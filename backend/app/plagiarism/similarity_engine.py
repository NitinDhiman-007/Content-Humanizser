"""Passage matching, overlap interval merging, and similarity percentage calculation."""
from __future__ import annotations
import difflib
import re
from uuid import uuid4
from .schemas import MatchedPassage, MatchedSource, MatchType, ReviewCategory, PlagiarismReviewFlag
from .text_normalizer import (
    normalize_for_matching,
    find_quotation_spans,
    find_citation_spans,
    is_span_overlapping,
    extract_candidate_passages,
    TextPassage
)


def merge_intervals(intervals: list[tuple[int, int]]) -> list[tuple[int, int]]:
    """Merge overlapping or adjacent character index intervals [start, end]."""
    if not intervals:
        return []
    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged = [sorted_intervals[0]]
    for current in sorted_intervals[1:]:
        prev_start, prev_end = merged[-1]
        curr_start, curr_end = current
        if curr_start <= prev_end:
            merged[-1] = (prev_start, max(prev_end, curr_end))
        else:
            merged.append(current)
    return merged


class ReferenceDocEntry:
    def __init__(self, doc_id: str, title: str, content: str, source_url: str | None = None):
        self.doc_id = doc_id
        self.title = title
        self.content = content
        self.source_url = source_url
        self.normalized = normalize_for_matching(content)
        # Pre-extract reference sentences for fuzzy matching
        self.passages = extract_candidate_passages(content, min_words=5, min_chars=25)


def analyze_similarity(
    assessed_text: str,
    reference_docs: list[ReferenceDocEntry],
    min_passage_chars: int = 35,
    min_passage_words: int = 6,
    similarity_threshold: float = 0.85
) -> tuple[float | None, list[MatchedSource], list[MatchedPassage], list[PlagiarismReviewFlag]]:
    """
    Execute deterministic similarity analysis between assessed text and reference documents.
    Returns (similarity_percentage, matched_sources, matched_passages, review_flags).
    """
    if not reference_docs:
        flags = [
            PlagiarismReviewFlag(
                code='NO_SOURCES',
                severity='info',
                message='No reference documents are registered in the local collection. Similarity cannot be assessed.'
            )
        ]
        return None, [], [], flags

    # Assessed text non-whitespace character length
    total_assessed_chars = len(re.sub(r'\s+', '', assessed_text))
    if total_assessed_chars == 0:
        return 0.0, [], [], [PlagiarismReviewFlag(code='EMPTY_TEXT', severity='info', message='Submitted content is empty.')]

    # Precompute quote and citation spans on the assessed text
    quote_spans = find_quotation_spans(assessed_text)
    citation_spans = find_citation_spans(assessed_text)

    # Extract candidate passages from assessed text
    candidates = extract_candidate_passages(
        assessed_text,
        min_words=min_passage_words,
        min_chars=min_passage_chars
    )

    matched_passages: list[MatchedPassage] = []

    for candidate in candidates:
        best_match: dict | None = None

        for doc in reference_docs:
            # 1. Exact match check
            if candidate.normalized in doc.normalized:
                best_match = {
                    'doc': doc,
                    'score': 1.0,
                    'type': 'exact_match',
                    'context': candidate.raw_text
                }
                break  # Exact match on a source is prioritized

            # 2. Close similarity check against reference document passages
            for ref_p in doc.passages:
                len_ratio = len(candidate.normalized) / max(len(ref_p.normalized), 1)
                if not (0.7 <= len_ratio <= 1.4):
                    continue

                ratio = difflib.SequenceMatcher(None, candidate.normalized, ref_p.normalized).ratio()
                if ratio >= similarity_threshold:
                    if best_match is None or ratio > best_match['score']:
                        best_match = {
                            'doc': doc,
                            'score': round(ratio, 3),
                            'type': 'close_similarity',
                            'context': ref_p.raw_text
                        }

        if best_match:
            matched_doc: ReferenceDocEntry = best_match['doc']
            is_quoted = is_span_overlapping(candidate.start_offset, candidate.end_offset, quote_spans)
            is_cited = is_span_overlapping(candidate.start_offset, candidate.end_offset, citation_spans)

            if is_quoted:
                category: ReviewCategory = 'quoted'
                needs_review = False
            elif is_cited:
                category = 'cited'
                needs_review = False
            elif best_match['type'] == 'exact_match':
                category = 'exact_match'
                needs_review = True
            else:
                category = 'close_similarity'
                needs_review = True

            passage = MatchedPassage(
                passage_id=str(uuid4()),
                source_id=matched_doc.doc_id,
                source_title=matched_doc.title,
                source_url=matched_doc.source_url,
                text=candidate.raw_text,
                start_offset=candidate.start_offset,
                end_offset=candidate.end_offset,
                similarity_score=best_match['score'],
                match_type=best_match['type'],
                is_quoted=is_quoted,
                is_cited=is_cited,
                review_category=category,
                needs_review=needs_review,
                context=best_match['context']
            )
            matched_passages.append(passage)

    # Prune subsumed lower-quality matches when an exact match or higher score covers the same span
    filtered_passages: list[MatchedPassage] = []
    for p in matched_passages:
        superseded = False
        for other in matched_passages:
            if p is other:
                continue
            # Check overlap
            overlap = min(p.end_offset, other.end_offset) - max(p.start_offset, other.start_offset)
            if overlap > 0.8 * (p.end_offset - p.start_offset):
                # If the other match has a higher similarity score (e.g. 1.0 vs 0.92), supersede this one
                if other.similarity_score > p.similarity_score:
                    superseded = True
                    break
                elif other.similarity_score == p.similarity_score and (other.end_offset - other.start_offset) > (p.end_offset - p.start_offset):
                    superseded = True
                    break
        if not superseded:
            filtered_passages.append(p)

    matched_passages = filtered_passages

    # Track intervals per source
    source_intervals: dict[str, list[tuple[int, int]]] = {doc.doc_id: [] for doc in reference_docs}
    source_match_counts: dict[str, int] = {doc.doc_id: 0 for doc in reference_docs}
    for p in matched_passages:
        source_intervals[p.source_id].append((p.start_offset, p.end_offset))
        source_match_counts[p.source_id] += 1

    # Merge intervals across all sources to compute total unique matched character coverage
    all_intervals = [(p.start_offset, p.end_offset) for p in matched_passages]
    merged_all = merge_intervals(all_intervals)
    total_matched_chars = sum(len(re.sub(r'\s+', '', assessed_text[start:end])) for start, end in merged_all)

    # Calculate overall similarity percentage using consistent denominator
    similarity_percentage = round(min(100.0, (total_matched_chars / total_assessed_chars) * 100), 1)

    # Build MatchedSource summaries
    matched_sources: list[MatchedSource] = []
    for doc in reference_docs:
        count = source_match_counts[doc.doc_id]
        if count > 0:
            doc_merged = merge_intervals(source_intervals[doc.doc_id])
            doc_matched_chars = sum(len(re.sub(r'\s+', '', assessed_text[start:end])) for start, end in doc_merged)
            src_pct = round(min(100.0, (doc_matched_chars / total_assessed_chars) * 100), 1)
            matched_sources.append(MatchedSource(
                source_id=doc.doc_id,
                title=doc.title,
                url=doc.source_url,
                similarity_percentage=src_pct,
                matches_count=count
            ))

    # Sort sources by similarity percentage descending
    matched_sources.sort(key=lambda s: s.similarity_percentage, reverse=True)

    # Generate review flags
    review_flags: list[PlagiarismReviewFlag] = []
    exact_matches = [p for p in matched_passages if p.review_category == 'exact_match']
    close_matches = [p for p in matched_passages if p.review_category == 'close_similarity']
    quoted_matches = [p for p in matched_passages if p.review_category == 'quoted']
    cited_matches = [p for p in matched_passages if p.review_category == 'cited']

    if exact_matches:
        review_flags.append(PlagiarismReviewFlag(
            code='EXACT_MATCH',
            severity='warning',
            message=f'{len(exact_matches)} unquoted exact passage matches require editorial review.'
        ))
    if close_matches:
        review_flags.append(PlagiarismReviewFlag(
            code='CLOSE_SIMILARITY',
            severity='warning',
            message=f'{len(close_matches)} close text similarity matches detected.'
        ))
    if quoted_matches:
        review_flags.append(PlagiarismReviewFlag(
            code='QUOTED_PASSAGES',
            severity='info',
            message=f'{len(quoted_matches)} matching passages are formatted as direct quotations.'
        ))
    if cited_matches:
        review_flags.append(PlagiarismReviewFlag(
            code='CITED_PASSAGES',
            severity='info',
            message=f'{len(cited_matches)} matching passages include citation or reference attribution.'
        ))

    review_flags.append(PlagiarismReviewFlag(
        code='INTERNAL_SCOPE',
        severity='info',
        message='Internal Similarity score reflects comparison against your uploaded reference documents only. It is not an internet-wide search and does not prove plagiarism.'
    ))

    return similarity_percentage, matched_sources, matched_passages, review_flags
