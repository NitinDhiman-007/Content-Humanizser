from app.pipeline import process


def test_a001_a003_a009():
    source = '# Example\n\nWe utilize a CRM and charge ₹2,400. Refunds may take 7 days.\n'
    result = process(source, 'local', [])
    assert 'We use a CRM' in result.humanized_text
    assert '₹2,400' in result.humanized_text
    assert 'may take 7 days' in result.humanized_text
    assert not any(flag.code == 'FACTUAL_ANCHOR_MISMATCH' for flag in result.audit.review_flags)


def test_a021_length_exception_not_fabricated():
    source = '# Title\n\nIt is important to note that our policy is clear.\n'
    result = process(source, 'local', [])
    assert result.audit.word_count_ratio < 95
    assert any(flag.code == 'WORD_COUNT_EXCEPTION' for flag in result.audit.review_flags)


def test_a023_maintain_list_numbers_and_bolding():
    source = '# Guide\n\n1. First task\n2. Second task\n3. Third task\n\nThe key difference is the approval process.\n'
    result = process(source, 'local', [])
    assert all(f'{i}. ' in result.humanized_text for i in (1, 2, 3))
    assert '**The key difference**' in result.humanized_text
    assert len(result.infographics) == 1


def test_a024_no_fabricated_detector_scores():
    result = process('This is clear.', 'local', [])
    assert result.audit.originality_check == 'not tested'
    assert result.audit.ai_detection_check == 'not tested'
