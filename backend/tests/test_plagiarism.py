"""Acceptance tests for the Plagiarism Checker subsystem (T01 - T25)."""
import json
import tempfile
from pathlib import Path
from fastapi.testclient import TestClient
from app.job_store import JobStore
from app.plagiarism.store import PlagiarismStore
from app.plagiarism.document_parser import extract_document_text, calculate_hash
from app.plagiarism.local_checker import run_local_check
from app.plagiarism.schemas import PlagiarismReport
from app.main import create_app


def make_test_client(directory: Path):
    job_db = directory / 'jobs.db'
    j_store = JobStore(job_db)
    p_store = PlagiarismStore(job_db)
    app = create_app(j_store, p_store)
    client = TestClient(app)
    return client, j_store, p_store


# T01: Valid plagiarism check
def test_t01_valid_plagiarism_check():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        # Add reference document
        ref_text = (
            "Artificial intelligence chatbots follow predefined conversational scripts. "
            "Modern AI chatbots can interpret questions and generate flexible conversational responses. "
            "Some chatbots connect with booking systems and retrieve customer records."
        )
        p_store.add_reference_doc("AI Chatbot Overview", ref_text, "https://example.com/chatbot-overview")

        # Create humanized job
        article = (
            "# Chatbots in Business\n\n"
            "Modern AI chatbots can interpret questions and generate flexible conversational responses. "
            "Some chatbots connect with booking systems and retrieve customer records. "
            "However, their primary strength is answering repetitive consumer questions."
        )
        job_res = client.post('/api/jobs', json={'original_text': article})
        job_id = job_res.json()['job_id']

        # Request plagiarism check
        res = client.post(f'/api/jobs/{job_id}/plagiarism', json={'check_mode': 'local'})
        assert res.status_code == 201
        check_id = res.json()['check_id']

        # Query report
        rep_res = client.get(f'/api/jobs/{job_id}/plagiarism/report')
        assert rep_res.status_code == 200
        report = rep_res.json()
        assert report['status'] == 'completed'
        assert report['check_mode'] == 'local'
        assert report['scope'] == 'internal_reference_collection'
        assert report['similarity_percentage'] is not None
        assert report['similarity_percentage'] > 0.0
        assert len(report['matched_sources']) == 1
        assert report['matched_sources'][0]['title'] == 'AI Chatbot Overview'
        assert report['matched_sources'][0]['url'] == 'https://example.com/chatbot-overview'
        assert len(report['matched_passages']) >= 1


# T02: Empty content rejected
def test_t02_empty_content_rejected():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        # Create a job with blank humanized result
        row = j_store.create('Some input', 'local', [])
        j_store.complete(row['job_id'], {'humanized_text': '   ', 'infographics': [], 'audit': {
            'original_word_count': 2, 'final_word_count': 0, 'word_count_ratio': 0,
            'validation_status': 'passed', 'review_flags': []
        }})
        res = client.post(f"/api/jobs/{row['job_id']}/plagiarism", json={'check_mode': 'local'})
        assert res.status_code == 422
        assert 'empty' in res.json()['detail'].lower() or 'blank' in res.json()['detail'].lower()


# T03: Missing job returns 404
def test_t03_missing_job_returns_404():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, _, _ = make_test_client(Path(temp_dir))
        fake_uuid = '00000000-0000-0000-0000-000000000000'
        res = client.post(f'/api/jobs/{fake_uuid}/plagiarism', json={'check_mode': 'local'})
        assert res.status_code == 404
        assert client.get(f'/api/jobs/{fake_uuid}/plagiarism').status_code == 404
        assert client.get(f'/api/jobs/{fake_uuid}/plagiarism/report').status_code == 404


# T04: Job still processing returns 409
def test_t04_job_still_processing_returns_409():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, _ = make_test_client(Path(temp_dir))
        row = j_store.create('Pending article', 'local', [])
        # Job is currently in queued status
        res = client.post(f"/api/jobs/{row['job_id']}/plagiarism", json={'check_mode': 'local'})
        assert res.status_code == 409
        assert 'not complete' in res.json()['detail'].lower()


# T05: Exact duplicate reference document (100% similarity)
def test_t05_exact_duplicate_reference_doc():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        passage = (
            "An AI agent coordinates several discrete tools to solve complex customer problems. "
            "Rather than requiring human intervention at every step, the agent plans multi-step workflows."
        )
        p_store.add_reference_doc("AI Agents Whitepaper", passage)

        job = client.post('/api/jobs', json={'original_text': passage}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        assert report['similarity_percentage'] == 100.0
        assert len(report['matched_passages']) >= 1


# T06: Partially matching document with accurate proportional calculation
def test_t06_partially_matching_document():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        shared = "Machine learning algorithms require substantial training data to generalize across diverse domains."
        unshared = "Fresh strawberries taste significantly sweeter during sunny late spring harvests."
        
        p_store.add_reference_doc("ML Basics", shared)

        combined = f"{shared}\n\n{unshared}"
        job = client.post('/api/jobs', json={'original_text': combined}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        # Shared sentence should account for roughly 50-60% of total text
        assert 35.0 <= report['similarity_percentage'] <= 70.0
        assert len(report['matched_passages']) == 1
        assert shared in report['matched_passages'][0]['text']


# T07: Completely different reference doc (0.0% similarity)
def test_t07_completely_different_reference_doc():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        ref = "Quantum computing relies on qubits to execute complex cryptographic factoring."
        p_store.add_reference_doc("Quantum Physics", ref)

        article = "Baking sourdough bread at home requires flour, water, salt, and patience."
        job = client.post('/api/jobs', json={'original_text': article}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        assert report['similarity_percentage'] == 0.0
        assert len(report['matched_passages']) == 0
        assert len(report['matched_sources']) == 0


# T08: Empty reference collection returns explicit status and None similarity
def test_t08_empty_reference_collection():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        # Ensure zero reference documents
        assert len(p_store.list_reference_docs()) == 0

        article = "This is a comprehensive overview of cloud computing infrastructure."
        job = client.post('/api/jobs', json={'original_text': article}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        assert report['similarity_percentage'] is None
        assert report['sources_checked'] == 0
        assert 'No reference documents available' in (report['error_message'] or '')


# T09: Short generic phrases ignored (false positive prevention)
def test_t09_short_generic_phrases_ignored():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        # Add a reference doc containing short generic phrases
        p_store.add_reference_doc("Grammar Tips", "In order to do this. On the other hand, it is important.")

        # Test article using standard transition words but otherwise distinct content
        article = (
            "Organic gardening demands mindful soil management throughout each season. "
            "In order to do this, gardeners enrich the topsoil with decomposed compost matter. "
            "On the other hand, commercial fertilizers frequently disrupt beneficial microbial life."
        )
        job = client.post('/api/jobs', json={'original_text': article}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        # The short transition phrases should NOT match as plagiarized passages
        assert report['similarity_percentage'] == 0.0


# T10: Legitimately quoted passages
def test_t10_legitimately_quoted_passages():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        quote_text = "The only way to do great work is to love what you do every single day."
        p_store.add_reference_doc("Steve Jobs Biography", quote_text)

        article = f'As the visionary leader famously observed, "{quote_text}"'
        job = client.post('/api/jobs', json={'original_text': article}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        assert len(report['matched_passages']) >= 1
        passage = report['matched_passages'][0]
        assert passage['is_quoted'] is True
        assert passage['review_category'] == 'quoted'
        assert passage['needs_review'] is False


# T11: Cited matching passages
def test_t11_cited_matching_passages():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        cited_text = "Neural network model architectures show improved semantic coherence when trained on multimodal datasets."
        p_store.add_reference_doc("AI Research Paper", cited_text)

        article = f"According to Dr. Williams (Williams, 2024), {cited_text}"
        job = client.post('/api/jobs', json={'original_text': article}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        assert len(report['matched_passages']) >= 1
        passage = report['matched_passages'][0]
        assert passage['is_cited'] is True
        assert passage['review_category'] == 'cited'
        assert passage['needs_review'] is False


# T12: Multiple overlapping matches merged without double counting
def test_t12_multiple_overlapping_matches():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        # Doc 1 has sentence A + B
        doc1 = "Microservices architecture divides software into autonomous services communicating over lightweight APIs."
        # Doc 2 has sentence A
        doc2 = "Microservices architecture divides software into autonomous services communicating over lightweight APIs."
        p_store.add_reference_doc("Doc 1", doc1)
        p_store.add_reference_doc("Doc 2", doc2)

        # Article has exactly sentence A
        article = doc1
        job = client.post('/api/jobs', json={'original_text': article}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        # Even though both Doc 1 and Doc 2 match the same sentence, similarity cannot exceed 100%
        assert report['similarity_percentage'] == 100.0


# T13: Duplicate sources consolidated in source breakdown
def test_t13_duplicate_sources_consolidated():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        p1 = "First principle of clean code is choosing descriptive and unambiguous variable identifiers."
        p2 = "Second principle requires separating business domain rules from volatile technical frameworks."
        ref_text = f"{p1}\n\n{p2}"
        p_store.add_reference_doc("Clean Code Guide", ref_text)

        article = f"{p1}\n\nSome unrelated paragraph in between.\n\n{p2}"
        job = client.post('/api/jobs', json={'original_text': article}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        # Should group under 1 source entry with matches_count == 2
        assert len(report['matched_sources']) == 1
        assert report['matched_sources'][0]['matches_count'] == 2


# T14: Unicode content handling
def test_t14_unicode_content_handling():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        unicode_text = "Le café français de qualité supérieure coûte environ €5,00 par tasse dans ce bistrot renommé."
        p_store.add_reference_doc("Paris Guide", unicode_text)

        article = f"Voyage à Paris: {unicode_text}"
        job = client.post('/api/jobs', json={'original_text': article}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        assert len(report['matched_passages']) == 1
        p = report['matched_passages'][0]
        # Character offsets must correctly slice matching unicode string
        extracted = article[p['start_offset']:p['end_offset']]
        assert extracted == unicode_text


# T15: Markdown formatting handling
def test_t15_markdown_formatting_handling():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        raw_passage = "Continuous integration requires automated tests to run on every proposed code change."
        p_store.add_reference_doc("DevOps Handbook", raw_passage)

        article = f"## DevOps Practices\n\n* **Key Rule**: {raw_passage}\n* **Second Rule**: Deploy often."
        job = client.post('/api/jobs', json={'original_text': article}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        assert len(report['matched_passages']) == 1
        p = report['matched_passages'][0]
        assert raw_passage in article[p['start_offset']:p['end_offset']]


# T16: Long article performance
def test_t16_long_article_performance():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        sample_sentence = "Modern distributed computing relies on consensus protocols like Raft to manage replicated logs. "
        long_ref = sample_sentence * 200  # ~4,000 words
        p_store.add_reference_doc("Distributed Systems", long_ref)

        long_article = sample_sentence * 300  # ~6,000 words
        job = client.post('/api/jobs', json={'original_text': long_article}).json()
        res = client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        assert res.status_code == 201
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()
        assert report['status'] == 'completed'
        assert report['similarity_percentage'] == 100.0


# T17: Malformed document upload
def test_t17_malformed_document_upload():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, _, _ = make_test_client(Path(temp_dir))
        # Corrupted PDF upload
        fake_corrupted_pdf = b'%PDF-1.4\nthis is clearly not a valid pdf stream'
        files = {'file': ('corrupted.pdf', fake_corrupted_pdf, 'application/pdf')}
        res = client.post('/api/references/upload', files=files)
        assert res.status_code == 422
        assert 'pdf' in res.json()['detail'].lower()


# T18: External provider not configured returns 422
def test_t18_external_provider_not_configured():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, _ = make_test_client(Path(temp_dir))
        article = "Testing unconfigured external plagiarism provider adapter."
        job = client.post('/api/jobs', json={'original_text': article}).json()

        # External check with consent but unconfigured credentials
        res = client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={
            'check_mode': 'external',
            'external_consent': True
        })
        assert res.status_code == 422
        assert 'external plagiarism checking is not configured' in res.json()['detail'].lower()


# T19: External provider requires explicit consent
def test_t19_external_provider_requires_consent():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, _ = make_test_client(Path(temp_dir))
        article = "Testing consent gating for external checks."
        job = client.post('/api/jobs', json={'original_text': article}).json()

        # External check without explicit consent
        res = client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={
            'check_mode': 'external',
            'external_consent': False
        })
        assert res.status_code == 400
        assert 'consent' in res.json()['detail'].lower()


# T20: External provider failure handling
def test_t20_external_provider_failure_handling():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        # Manually create a check and simulate a failed state
        article = "Some sample text."
        job = client.post('/api/jobs', json={'original_text': article}).json()
        check = p_store.create_check(job['job_id'], 'external', 'external_provider', 'hash123')
        p_store.fail_check(check['check_id'], 'Provider rate limit exceeded (HTTP 429).')

        res = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report")
        assert res.status_code == 409
        assert 'rate limit' in res.json()['detail'].lower()


# T21: Database persistence and restart recovery
def test_t21_database_persistence_and_recovery():
    with tempfile.TemporaryDirectory() as temp_dir:
        db_path = Path(temp_dir) / 'jobs.db'
        j_store1 = JobStore(db_path)
        p_store1 = PlagiarismStore(db_path)
        
        # Add reference document and queued check
        doc = p_store1.add_reference_doc("Persistence Guide", "Persisted content must survive server reboot.")
        check = p_store1.create_check("job-123", "local", "internal_reference_collection", "hash-abc")

        # Simulate server crash/restart: a new instance opens the database and runs mark_interrupted()
        j_store2 = JobStore(db_path)
        p_store2 = PlagiarismStore(db_path)
        p_store2.mark_interrupted()

        # Reference doc must survive
        docs = p_store2.list_reference_docs()
        assert len(docs) == 1
        assert docs[0]['title'] == "Persistence Guide"

        # Interrupted check must be marked failed
        recovered_check = p_store2.get_check(check['check_id'])
        assert recovered_check['status'] == 'failed'
        assert 'interrupted by a server restart' in recovered_check['error_message']


# T22: Content hash outdated detection
def test_t22_content_hash_outdated_detection():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        p_store.add_reference_doc("Ref 1", "Static web application architectures offer performance and security advantages.")

        original = "Static web application architectures offer performance and security advantages."
        job = client.post('/api/jobs', json={'original_text': original}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        
        # Initial report
        rep1 = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()
        assert not any(f['code'] == 'OUTDATED_REPORT' for f in rep1['review_flags'])

        # Now simulate modifying the humanized text in the job store
        modified_result = {
            'humanized_text': 'Completely new modified blog content that was not in the original check.',
            'infographics': [],
            'audit': {'original_word_count': 10, 'final_word_count': 10, 'word_count_ratio': 100.0,
                      'validation_status': 'passed', 'review_flags': []}
        }
        j_store.complete(job['job_id'], modified_result)

        # Query report again - must have OUTDATED_REPORT flag
        rep2 = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()
        assert any(f['code'] == 'OUTDATED_REPORT' for f in rep2['review_flags'])


# T23: Duplicate request prevention
def test_t23_duplicate_request_prevention():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        article = "Unique article content for duplicate request testing."
        job = client.post('/api/jobs', json={'original_text': article}).json()
        
        # Simulate active in-progress check
        content_hash = calculate_hash(article)
        c1 = p_store.create_check(job['job_id'], 'local', 'internal_reference_collection', content_hash)
        
        # Second call to create check for the same job and content
        c2 = p_store.create_check(job['job_id'], 'local', 'internal_reference_collection', content_hash)
        
        # Must return the exact same check_id without duplicate entries
        assert c1['check_id'] == c2['check_id']


# T24: Exact text highlight offsets
def test_t24_exact_text_highlight_offsets():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        passage = "Relational databases use structured query language for defining and manipulating data."
        p_store.add_reference_doc("SQL Manual", passage)

        article = f"# Database Systems\n\n{passage}\n\nNoSQL databases provide alternative models."
        job = client.post('/api/jobs', json={'original_text': article}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        assert len(report['matched_passages']) == 1
        p = report['matched_passages'][0]
        # Verify that slicing the article with start_offset:end_offset matches exactly
        sliced = article[p['start_offset']:p['end_offset']]
        assert sliced == passage
        assert sliced == p['text']


# T25: JSON response conforms to Pydantic model
def test_t25_json_response_pydantic_validation():
    with tempfile.TemporaryDirectory() as temp_dir:
        client, j_store, p_store = make_test_client(Path(temp_dir))
        p_store.add_reference_doc("Doc A", "A complete end-to-end acceptance test validates all system requirements.")

        article = "A complete end-to-end acceptance test validates all system requirements."
        job = client.post('/api/jobs', json={'original_text': article}).json()
        client.post(f"/api/jobs/{job['job_id']}/plagiarism", json={'check_mode': 'local'})
        report_data = client.get(f"/api/jobs/{job['job_id']}/plagiarism/report").json()

        # Must validate cleanly against PlagiarismReport Pydantic schema
        validated = PlagiarismReport.model_validate(report_data)
        assert validated.check_id is not None
        assert validated.job_id == job['job_id']
        assert validated.status == 'completed'
        assert validated.similarity_percentage == 100.0
