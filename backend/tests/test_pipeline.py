from app.pipeline import factual_anchors, infographic_specs, process, transform_local, visible_word_count
from app.rules_catalog import load_catalog, AUTOMATED_RULES


def test_catalog_complete_but_not_all_automated():
    catalog = load_catalog()
    assert (len(catalog['rules']), len(catalog['requirements']), len(catalog['tests'])) == (100, 30, 27)
    assert len(AUTOMATED_RULES) < 100


def test_local_edits_and_literal_preservation():
    original = '''# Our guide\n\nWe utilize a tool in order to help customers. The key difference is this.\n\nRead [the docs](https://example.com/2026) and pay ₹4,000.\n\n```python\nutilize = "do not edit"\n```\n'''
    edited, applied = transform_local(original)
    assert 'We use a tool to help customers' in edited
    assert '**The key difference**' in edited
    assert '[the docs](https://example.com/2026)' in edited
    assert '₹4,000' in edited
    assert 'utilize = "do not edit"' in edited
    assert 'R002' in applied
    assert factual_anchors(original) == factual_anchors(edited)


def test_no_change_when_safely_uneditable():
    original = '# A clear title\n\nA plain paragraph that is already readable.\n'
    output, applied = transform_local(original)
    assert output == original
    assert not applied
    result = process(original, 'local', [])
    assert any(f.code == 'NO_SAFE_EDITS' for f in result.audit.review_flags)


def test_word_count_visible_not_code_or_meta():
    source = '''# Title\n\nOne two three. [Official docs](https://example.com/x123)\n\n| Name | Cost |\n| --- | --- |\n| Plan | ₹500 |\n\n```python\nhello = 999\n```\n'''
    assert visible_word_count(source) == 10


def test_word_count_and_numbers_are_reported():
    source = 'Your order costs ₹1,299. This is important information.\n'
    result = process(source, 'local', [])
    assert result.audit.original_word_count > 0
    assert result.audit.final_word_count > 0
    assert result.audit.word_count_ratio == 100
    assert not any(f.code == 'FACTUAL_ANCHOR_MISMATCH' for f in result.audit.review_flags)


def test_factual_mismatch_blocks_clean_status():
    source = 'Price is ₹900 today.'
    result = process(source, 'external', [], external_provider=lambda _: 'Price is ₹800 today.')
    assert result.audit.validation_status == 'review_required'
    assert any(f.code == 'FACTUAL_ANCHOR_MISMATCH' and f.severity == 'critical' for f in result.audit.review_flags)


def test_infographic_from_real_steps_only():
    source = '# Workflow\n\n1. Receive content\n2. Check facts\n3. Return result\n'
    specs = infographic_specs(source)
    assert len(specs) == 1
    assert specs[0].items == ['Receive content', 'Check facts', 'Return result']
    assert '<script' not in (specs[0].svg_preview or '')
    assert infographic_specs('One normal paragraph.') == []


def test_infographic_svg_escapes_input():
    specs = infographic_specs('1. First <script>\n2. Second & thing\n3. Third\n')
    assert '&lt;script&gt;' in specs[0].svg_preview
    assert '&amp;' in specs[0].svg_preview


def test_protected_quotation_stays_verbatim():
    source = 'The expert said "We utilize tools" and asked us to commence.\n'
    transformed, _ = transform_local(source)
    assert '"We utilize tools"' in transformed
    assert 'asked us to start' in transformed


def test_transition_cleanup_only_on_sentence_opening():
    source = 'Furthermore, we utilize these tools.\n'
    transformed, applied = transform_local(source)
    assert transformed == 'We use these tools.\n'
    assert 'R005' in applied
