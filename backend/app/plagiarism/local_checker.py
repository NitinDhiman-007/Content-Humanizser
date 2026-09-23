"""Orchestrates local similarity checking against stored reference documents."""
from __future__ import annotations
from datetime import datetime, timezone
from .document_parser import calculate_hash
from .schemas import PlagiarismReport
from .similarity_engine import analyze_similarity, ReferenceDocEntry
from .store import PlagiarismStore


def run_local_check(
    text: str,
    job_id: str,
    check_id: str,
    store: PlagiarismStore,
    original_text: str | None = None,
    include_revision_comparison: bool = False,
    min_passage_chars: int = 35,
    min_passage_words: int = 6,
    similarity_threshold: float = 0.85
) -> PlagiarismReport:
    """Run deterministic local similarity analysis against authorized reference collection."""
    content_hash = calculate_hash(text)
    checked_at = datetime.now(timezone.utc).isoformat()

    # Load all stored reference documents
    raw_docs = store.list_reference_docs()
    reference_entries: list[ReferenceDocEntry] = []

    for doc_meta in raw_docs:
        full_doc = store.get_reference_doc(doc_meta['doc_id'])
        if full_doc and full_doc['content'].strip():
            reference_entries.append(ReferenceDocEntry(
                doc_id=full_doc['doc_id'],
                title=full_doc['title'],
                content=full_doc['content'],
                source_url=full_doc.get('source_url')
            ))

    # If user explicitly requested comparison against original revision:
    if include_revision_comparison and original_text and original_text.strip():
        reference_entries.append(ReferenceDocEntry(
            doc_id='revision-original',
            title='Previous Revision (Original Input Text)',
            content=original_text,
            source_url=None
        ))

    # Execute similarity engine
    similarity_pct, matched_sources, matched_passages, review_flags = analyze_similarity(
        assessed_text=text,
        reference_docs=reference_entries,
        min_passage_chars=min_passage_chars,
        min_passage_words=min_passage_words,
        similarity_threshold=similarity_threshold
    )

    scope = 'internal_reference_collection'
    if not reference_entries:
        error_msg = 'Not checked: No reference documents available.'
    else:
        error_msg = None

    return PlagiarismReport(
        check_id=check_id,
        job_id=job_id,
        status='completed' if reference_entries else 'completed',
        check_mode='local',
        scope=scope,
        similarity_percentage=similarity_pct,
        sources_checked=len(reference_entries),
        matched_sources=matched_sources,
        matched_passages=matched_passages,
        review_flags=review_flags,
        checked_content_hash=content_hash,
        checked_at=checked_at,
        error_message=error_msg
    )
