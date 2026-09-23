"""Conservative local editorial transformation with explicit validation limits."""
from __future__ import annotations
from collections import Counter
from html import escape
import re

from markdown_it import MarkdownIt

from .rules_catalog import load_catalog, AUTOMATED_RULES
from .schemas import AuditReport, HumanizedPayload, InfographicSpec, ReviewFlag

MD = MarkdownIt('commonmark').enable('table')
WORD = re.compile(r"[^\W_]+(?:['’][^\W_]+)*", re.UNICODE)
URL = re.compile(r'https?://[^\s<>\])]+|www\.[^\s<>\])]+')
NUMBER = re.compile(r'(?<![\w])(?:₹|\$|€|£)?\d+(?:[,.]\d+)*(?:\s*%|\s*percent)?(?!\w)', re.I)
PROTECTED = re.compile(r'(?:https?://\S+|www\.\S+|`[^`]+`|\[[^\]]+\]\([^\)]+\)|\"[^\"]*\"|“[^”]*”)')
REPLACEMENTS = {
    'utilize': 'use',
    'facilitate': 'help',
    'commence': 'start',
    'in order to': 'to',
    'it is important to note that': '',
    'it is worth mentioning that': '',
    'in today\'s modern world': '',
}
FILLER_OPENERS = {'furthermore', 'additionally', 'moreover'}
BOLD_PATTERNS = [re.compile(r'\b(the key difference)\b', re.I),
                 re.compile(r'\b(the important point)\b', re.I),
                 re.compile(r'\b(the main takeaway)\b', re.I)]


def visible_word_count(markdown: str) -> int:
    """Count visible prose, headings, table cells and list labels; exclude code and URLs."""
    try:
        tokens = MD.parse(markdown)
    except Exception:
        return len(WORD.findall(markdown))
    count = 0
    for token in tokens:
        if token.type != 'inline':
            continue
        for child in token.children or []:
            if child.type in ('text', 'html_inline'):
                text = URL.sub('', child.content)
                count += len(WORD.findall(text))
    return count


def factual_anchors(text: str) -> tuple[Counter, Counter]:
    urls = Counter(URL.findall(text))
    text_without_urls = URL.sub(' ', text)
    # URLs are counted separately so digits in addresses are not double counted.
    numbers = Counter(x.strip() for x in NUMBER.findall(text_without_urls))
    return urls, numbers


def preserve_case(original: str, replacement: str) -> str:
    if not replacement:
        return ''
    if original.isupper():
        return replacement.upper()
    if original[:1].isupper():
        return replacement[:1].upper() + replacement[1:]
    return replacement


def edit_prose(text: str) -> tuple[str, set[str]]:
    applied: set[str] = set()
    chunks = []
    last = 0
    # Never change inline links, code, or URLs. Apply a bounded set of safe substitutions.
    for protected in list(PROTECTED.finditer(text)) + [None]:
        start = protected.start() if protected else len(text)
        chunk = text[last:start]
        for old, new in REPLACEMENTS.items():
            pattern = re.compile(r'(?<![\w])' + re.escape(old) + r'(?![\w])', re.I)
            before = chunk
            chunk = pattern.sub(lambda match: preserve_case(match.group(), new), chunk)
            if before != chunk:
                applied.add('R002' if old in ('utilize', 'facilitate', 'commence') else 'R004')
        # Remove only unnecessary openers, never connectors inside the paragraph.
        if not chunks:
            lead = re.match(r'^\s*(?:furthermore|additionally|moreover),\s+', chunk, re.I)
            if lead:
                chunk = chunk[lead.end():]
                applied.add('R005')
        # Remove leftover separators after safe opening phrase removal.
        if not chunks and chunk != text[:start] and not text[:start].startswith((' ', '\t')):
            chunk = chunk.lstrip(' ,;:')
        if chunk and chunk[:1].islower() and not chunks and chunk != text[:start] and not text[:last].strip():
            chunk = chunk[:1].upper() + chunk[1:]
        chunks.append(chunk)
        if protected:
            chunks.append(protected.group())
            last = protected.end()
    result = ''.join(chunks)
    if result != text:
        applied.add('R086')
    return result, applied


def transform_local(markdown: str) -> tuple[str, list[str]]:
    """Never rewrite source material that cannot be safely segmented."""
    lines = markdown.splitlines(keepends=True)
    transformed = []
    applied: set[str] = set()
    in_fence = False
    fence_marker = None
    in_frontmatter = bool(lines and lines[0].strip() == '---')
    frontmatter_started = False
    bolded = 0
    for line in lines:
        stripped = line.strip()
        if in_frontmatter:
            transformed.append(line)
            if frontmatter_started and stripped == '---':
                in_frontmatter = False
            frontmatter_started = True
            continue
        fence = re.match(r'^\s*(`{3,}|~{3,})', line)
        if fence:
            marker = fence.group(1)[0]
            if not in_fence:
                in_fence, fence_marker = True, marker
            elif marker == fence_marker:
                in_fence, fence_marker = False, None
            transformed.append(line)
            continue
        # Conservatively keep code, tables, reference definitions, headings, links,
        # blockquotes, HTML and heavily structured text exactly as provided.
        if (in_fence or not stripped or line.startswith(('    ', '\t')) or
            re.match(r'^\s*(?:#{1,6}\s|\||>|<|\[[^\]]+\]:)', line) or
            '|' in line or re.search(r'\[[^\]]+\]\(', line) or
            re.match(r'^\s*(?:[-*+] |\d+[.)] )', line)):
            transformed.append(line)
            continue
        body = line.rstrip('\r\n')
        ending = line[len(body):]
        revised, rules = edit_prose(body)
        applied.update(rules)
        if '**' not in revised and bolded < 4:
            for pattern in BOLD_PATTERNS:
                if pattern.search(revised):
                    revised = pattern.sub(lambda match: '**' + match.group(1) + '**', revised, count=1)
                    applied.add('R096')
                    bolded += 1
                    break
        transformed.append(revised + ending)
    return ''.join(transformed), sorted(applied)


def infographic_specs(markdown: str) -> list[InfographicSpec]:
    """Use existing source text only, no invented numbers or statistics."""
    lines = markdown.splitlines()
    for idx, line in enumerate(lines):
        if re.match(r'^\s*\|\s*[^|]+\|', line) and idx + 2 < len(lines):
            if re.match(r'^\s*\|?\s*:?-{3,}', lines[idx + 1]):
                items = [re.sub(r'\s+', ' ', x.strip(' |'))[:110]
                         for x in lines[idx + 2:idx + 6]
                         if x.strip().startswith('|')]
                if len(items) >= 2:
                    return [_make_spec('comparison', 'Comparison from article', items)]
    sequence: list[str] = []
    for line in lines + ['']:
        match = re.match(r'^\s*\d+[.)]\s+(.+)', line)
        if match:
            sequence.append(match.group(1).strip()[:110])
        else:
            if len(sequence) >= 3:
                return [_make_spec('process', 'Steps from article', sequence[:6])]
            sequence = []
    return []


def _make_spec(kind: str, title: str, items: list[str]):
    # SVG contains escaped text only, and no script, images or external resources.
    width, item_height = 700, 64
    height = 80 + len(items) * item_height
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
           '<rect width="100%" height="100%" fill="#ffffff"/>',
           f'<text x="28" y="40" font-family="Arial,sans-serif" font-size="22" fill="#172b4d">{escape(title)}</text>']
    for i, item in enumerate(items):
        y = 64 + i * item_height
        svg.append(f'<rect x="24" y="{y}" width="650" height="54" rx="9" fill="#f1f5f9"/>')
        svg.append(f'<text x="38" y="{y+33}" font-family="Arial,sans-serif" font-size="15" fill="#172b4d">{escape(item[:76])}</text>')
    svg.append('</svg>')
    return InfographicSpec(type=kind, title=title, items=items, svg_preview=''.join(svg))


def validate(original: str, final: str, mode: str, applied: list[str], seo_keywords: list[str]) -> AuditReport:
    flags: list[ReviewFlag] = []

    def flag(code, severity, message):
        flags.append(ReviewFlag(code=code, severity=severity, message=message))

    before, after = visible_word_count(original), visible_word_count(final)
    ratio = round(after / before * 100, 2) if before else 0.0
    if before == 0:
        flag('EMPTY_VISIBLE_TEXT', 'warning', 'The input contains no countable visible article words.')
    elif ratio < 95 or ratio > 105:
        flag('WORD_COUNT_EXCEPTION', 'warning', f'Visible word count changed from {before} to {after} ({ratio}%). Review the difference.')
    orig_urls, orig_nums = factual_anchors(original)
    final_urls, final_nums = factual_anchors(final)
    for name, left, right in [('URLs', orig_urls, final_urls), ('numbers and prices', orig_nums, final_nums)]:
        missing, added = left - right, right - left
        if missing or added:
            flag('FACTUAL_ANCHOR_MISMATCH', 'critical', f'{name} changed. Missing: {dict(missing)}. Added: {dict(added)}.')
    for kw in seo_keywords:
        if kw.casefold() in original.casefold() and kw.casefold() not in final.casefold():
            flag('SEO_KEYWORD_REMOVED', 'warning', f'The original SEO term {kw!r} is missing from the result.')
    if mode == 'local':
        flag('LOCAL_CAPABILITY', 'info', 'Local mode performs limited deterministic edits. Contextual rewrites, factual verification and naturalness require editorial review.')
    else:
        flag('EXTERNAL_PROVIDER', 'info', 'External provider output needs editorial review. The package does not accept the Markdown rulebook directly.')
    flag('UNVERIFIED_FACTS', 'info', 'Exact anchor checks cannot establish that all factual meaning or claims are correct.')
    if not applied and mode == 'local':
        flag('NO_SAFE_EDITS', 'warning', 'No supported safe replacement was found. The original text was preserved rather than inventing a rewrite.')
    validation_status = 'review_required' if any(x.severity in ('critical', 'warning') for x in flags) else 'passed'
    return AuditReport(original_word_count=before, final_word_count=after, word_count_ratio=ratio,
                       validation_status=validation_status, review_flags=flags,
                       applied_rules=applied, automated_rule_count=len(AUTOMATED_RULES))


def process(original: str, mode: str, seo_keywords: list[str], external_provider=None) -> HumanizedPayload:
    load_catalog()  # Reject incomplete or changed rulebooks rather than silently ignoring them.
    if mode == 'external':
        if external_provider is None:
            raise RuntimeError('External provider was not configured.')
        final = external_provider(original)
        if not isinstance(final, str) or not final.strip():
            raise RuntimeError('External provider returned empty or invalid text.')
        applied = []
    else:
        final, applied = transform_local(original)
    audit = validate(original, final, mode, applied, seo_keywords)
    return HumanizedPayload(humanized_text=final, infographics=infographic_specs(final), audit=audit)
