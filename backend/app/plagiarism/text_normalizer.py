"""Text normalization, sentence extraction, and quotation/citation detection."""
from __future__ import annotations
import re
import unicodedata

# Punctuation / quote patterns
QUOTE_PATTERN = re.compile(r'["“][^"”]{5,}?["”]|(?<=[\s\n])\'[^\']{5,}?\'(?=[\s\n.,;])|^>[ \t].*$', re.MULTILINE)
CITATION_PATTERN = re.compile(
    r'\([A-Z][a-zA-Z\s]+,\s*(?:19|20)\d{2}\)|'                     # (Smith, 2024)
    r'\[\d+\]|'                                                    # [1]
    r'\[([^\]]+)\]\((https?://[^\s)]+)\)|'                         # [Anchor](http://...)
    r'\b(?:According to|As stated by|Source:|Cited in|Ref:)\s+[A-Z][\w\s]+',  # According to X
    re.IGNORECASE
)
WHITESPACE_RE = re.compile(r'\s+')
SENTENCE_SPLIT_RE = re.compile(r'(?<=[.!?])\s+')


def normalize_for_matching(text: str) -> str:
    """Normalize text for comparison: NFKC, lowercase, collapse whitespace, strip markdown markers."""
    text = unicodedata.normalize('NFKC', text)
    # Strip basic markdown formatting markers (*, _, #, `, ~) for matching
    cleaned = re.sub(r'[*_#`~]', '', text)
    cleaned = WHITESPACE_RE.sub(' ', cleaned).strip().lower()
    return cleaned


def find_quotation_spans(text: str) -> list[tuple[int, int]]:
    """Return character index ranges (start, end) that are inside quotation marks or blockquotes."""
    spans = []
    for match in QUOTE_PATTERN.finditer(text):
        spans.append((match.start(), match.end()))
    return spans


def find_citation_spans(text: str) -> list[tuple[int, int]]:
    """Return character index ranges (start, end) that contain citation anchors."""
    spans = []
    for match in CITATION_PATTERN.finditer(text):
        spans.append((match.start(), match.end()))
    return spans


def is_span_overlapping(start: int, end: int, span_list: list[tuple[int, int]], threshold_chars: int = 15) -> bool:
    """Check if [start, end] significantly overlaps any span in span_list."""
    for s_start, s_end in span_list:
        overlap_start = max(start, s_start)
        overlap_end = min(end, s_end)
        if overlap_end - overlap_start >= threshold_chars:
            return True
        # Also consider if the entire span is contained within [s_start, s_end]
        if s_start <= start and end <= s_end:
            return True
        # Or if the citation is immediately adjacent (within 40 chars before or after)
        if 0 <= start - s_end <= 40 or 0 <= s_start - end <= 40:
            return True
    return False


class TextPassage:
    def __init__(self, raw_text: str, start_offset: int, end_offset: int, normalized: str, word_count: int):
        self.raw_text = raw_text
        self.start_offset = start_offset
        self.end_offset = end_offset
        self.normalized = normalized
        self.word_count = word_count


def extract_candidate_passages(text: str, min_words: int = 6, min_chars: int = 35) -> list[TextPassage]:
    """
    Extract meaningful sentence-level passages with preserved character offsets into original text.
    Filters out short fragments, headings without punctuation, and common short phrases.
    """
    passages: list[TextPassage] = []
    
    # Process paragraph by paragraph to preserve offsets
    paragraph_pattern = re.compile(r'[^\n]+')
    for para_match in paragraph_pattern.finditer(text):
        para_text = para_match.group(0)
        para_start = para_match.start()
        
        # Skip pure headers or table dividers like |---|---|
        if para_text.startswith('#') or re.match(r'^[|\s:-]+$', para_text):
            continue
            
        # Split paragraph into sentences
        last_idx = 0
        sentence_end_pattern = re.compile(r'(?<=[.!?])\s+|(?<=\n)')
        splits = list(sentence_end_pattern.finditer(para_text))
        
        sentence_spans = []
        curr = 0
        for s in splits:
            sentence_spans.append((curr, s.start()))
            curr = s.end()
        if curr < len(para_text):
            sentence_spans.append((curr, len(para_text)))
            
        for s_start, s_end in sentence_spans:
            raw_sent = para_text[s_start:s_end].strip()
            if not raw_sent:
                continue
            # Calculate exact character offset in raw text
            exact_start = para_start + s_start + (len(para_text[s_start:s_end]) - len(para_text[s_start:s_end].lstrip()))
            exact_end = exact_start + len(raw_sent)
            
            words = raw_sent.split()
            if len(words) >= min_words and len(raw_sent) >= min_chars:
                norm = normalize_for_matching(raw_sent)
                if len(norm) >= min_chars:
                    passages.append(TextPassage(
                        raw_text=raw_sent,
                        start_offset=exact_start,
                        end_offset=exact_end,
                        normalized=norm,
                        word_count=len(words)
                    ))

            # Also extract quoted content if sentence contains quotation
            quote_match = re.search(r'["“]([^"”]{20,})["”]', raw_sent)
            if quote_match:
                q_text = quote_match.group(1).strip()
                q_words = q_text.split()
                if len(q_words) >= min_words and len(q_text) >= min_chars:
                    q_start = exact_start + quote_match.start(1)
                    q_end = q_start + len(q_text)
                    passages.append(TextPassage(
                        raw_text=q_text,
                        start_offset=q_start,
                        end_offset=q_end,
                        normalized=normalize_for_matching(q_text),
                        word_count=len(q_words)
                    ))

            # Also check if sentence has a colon prefix (e.g. "Voyage à Paris: ...")
            if ':' in raw_sent:
                parts = raw_sent.split(':', 1)
                after_colon = parts[1].strip()
                after_words = after_colon.split()
                if len(after_words) >= min_words and len(after_colon) >= min_chars:
                    colon_offset = raw_sent.find(after_colon)
                    c_start = exact_start + colon_offset
                    c_end = c_start + len(after_colon)
                    passages.append(TextPassage(
                        raw_text=after_colon,
                        start_offset=c_start,
                        end_offset=c_end,
                        normalized=normalize_for_matching(after_colon),
                        word_count=len(after_words)
                    ))
                    
    return passages

