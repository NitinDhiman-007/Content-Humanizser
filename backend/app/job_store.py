"""Short SQLite transactions per operation, with persisted originals and results."""
import json
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


def utc_now():
    return datetime.now(timezone.utc).isoformat()

class JobStore:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        with self._connection() as conn:
            conn.execute('''CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY, status TEXT NOT NULL,
                original_text TEXT NOT NULL, mode TEXT NOT NULL,
                seo_keywords TEXT NOT NULL, result_json TEXT,
                error_message TEXT, created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )''')

    @contextmanager
    def _connection(self):
        conn = sqlite3.connect(self.path, timeout=15)
        conn.row_factory = sqlite3.Row
        try:
            conn.execute('PRAGMA busy_timeout=15000')
            conn.execute('PRAGMA journal_mode=WAL')
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def create(self, original_text: str, mode: str, seo_keywords: list[str]):
        now = utc_now()
        job_id = str(uuid4())
        with self._lock, self._connection() as conn:
            conn.execute('''INSERT INTO jobs
                (job_id,status,original_text,mode,seo_keywords,created_at,updated_at)
                VALUES (?, 'queued', ?, ?, ?, ?, ?)''',
                (job_id, original_text, mode, json.dumps(seo_keywords), now, now))
        return {'job_id': job_id, 'status': 'queued', 'created_at': now}

    def get(self, job_id: str):
        with self._lock, self._connection() as conn:
            row = conn.execute('SELECT * FROM jobs WHERE job_id=?', (job_id,)).fetchone()
            return dict(row) if row else None

    def set_processing(self, job_id: str):
        with self._lock, self._connection() as conn:
            conn.execute("UPDATE jobs SET status='processing', updated_at=? WHERE job_id=? AND status='queued'", (utc_now(), job_id))

    def complete(self, job_id: str, result: dict):
        with self._lock, self._connection() as conn:
            conn.execute("UPDATE jobs SET status='completed', result_json=?, error_message=NULL, updated_at=? WHERE job_id=?", (json.dumps(result, ensure_ascii=False), utc_now(), job_id))

    def fail(self, job_id: str, message: str):
        with self._lock, self._connection() as conn:
            conn.execute("UPDATE jobs SET status='failed', error_message=?, updated_at=? WHERE job_id=?", (message[:350], utc_now(), job_id))

    def mark_interrupted(self):
        """Avoid claiming lost in-process work is still running after server restart."""
        with self._lock, self._connection() as conn:
            conn.execute("""UPDATE jobs SET status='failed',
                error_message='Processing was interrupted by a server restart. Submit the content again.', updated_at=?
                WHERE status IN ('queued','processing')""", (utc_now(),))
