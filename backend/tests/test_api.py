import tempfile
from pathlib import Path
from fastapi.testclient import TestClient
from app.job_store import JobStore
from app.main import create_app


def make_client(path: Path):
    return TestClient(create_app(JobStore(path)))


def test_empty_and_missing_external_key(monkeypatch):
    import app.config as config
    monkeypatch.setattr(config, 'API_KEY', '')
    monkeypatch.setattr(config, 'OPENAI_API_KEY', '')
    with tempfile.TemporaryDirectory() as directory, make_client(Path(directory) / 'jobs.db') as client:
        assert client.post('/api/jobs', json={'original_text': ' '}).status_code == 422
        response = client.post('/api/jobs', json={'original_text': 'Hello.', 'mode': 'external'})
        assert response.status_code == 422
        assert 'credentials' in response.json()['detail']



def test_submit_persist_result_and_refresh():
    with tempfile.TemporaryDirectory() as directory:
        db = Path(directory) / 'jobs.db'
        original = '# Introduction\n\nWe utilize approved tools.\n'
        with make_client(db) as client:
            response = client.post('/api/jobs', json={'original_text': original})
            assert response.status_code == 201
            job_id = response.json()['job_id']
            result = client.get(f'/api/jobs/{job_id}')
            assert result.status_code == 200
            payload = result.json()
            assert payload['original_content']['original_text'] == original
            assert payload['status'] == 'completed'
            assert payload['result']['humanized_text'].startswith('# Introduction')
            assert client.get(f'/api/jobs/{job_id}/result').status_code == 200
        with make_client(db) as restarted:
            persistent = restarted.get(f'/api/jobs/{job_id}')
            assert persistent.status_code == 200
            assert persistent.json()['result']['humanized_text'] == payload['result']['humanized_text']


def test_invalid_id_and_interrupted_job():
    with tempfile.TemporaryDirectory() as directory:
        db = Path(directory) / 'jobs.db'
        store = JobStore(db)
        item = store.create('This is my blog.', 'local', [])
        with make_client(db) as client:
            response = client.get(f"/api/jobs/{item['job_id']}")
            assert response.json()['status'] == 'failed'
            assert 'restart' in response.json()['error_message']
            assert client.get('/api/jobs/not-valid').status_code == 404
            assert client.get(f"/api/jobs/{item['job_id']}/result").status_code == 409
