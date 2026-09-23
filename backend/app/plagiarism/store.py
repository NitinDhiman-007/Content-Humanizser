"""SQLite persistence for reference documents and plagiarism checks with concurrency safety."""
from __future__ import annotations
import json
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from .document_parser import calculate_hash, count_words


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PlagiarismStore:
    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._init_db()

    @contextmanager
    def _connection(self):
        conn = sqlite3.connect(self.db_path, timeout=15)
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

    def _init_db(self):
        with self._connection() as conn:
            conn.execute('''CREATE TABLE IF NOT EXISTS reference_documents (
                doc_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                source_url TEXT,
                content TEXT NOT NULL,
                content_hash TEXT NOT NULL,
                word_count INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )''')
            conn.execute('''CREATE TABLE IF NOT EXISTS plagiarism_checks (
                check_id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                status TEXT NOT NULL,
                check_mode TEXT NOT NULL,
                scope TEXT NOT NULL,
                content_hash TEXT NOT NULL,
                similarity_percentage REAL,
                sources_checked INTEGER,
                report_json TEXT,
                error_message TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )''')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_plagiarism_job_id ON plagiarism_checks (job_id)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_plagiarism_status ON plagiarism_checks (status)')

    # --- Reference Document Management ---

    def add_reference_doc(self, title: str, content: str, source_url: str | None = None) -> dict:
        doc_id = str(uuid4())
        now = utc_now()
        content_hash = calculate_hash(content)
        word_cnt = count_words(content)
        with self._lock, self._connection() as conn:
            conn.execute('''INSERT INTO reference_documents
                (doc_id, title, source_url, content, content_hash, word_count, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (doc_id, title, source_url, content, content_hash, word_cnt, now))
        return {
            'doc_id': doc_id,
            'title': title,
            'source_url': source_url,
            'word_count': word_cnt,
            'content_hash': content_hash,
            'created_at': now
        }

    def list_reference_docs(self) -> list[dict]:
        with self._lock, self._connection() as conn:
            rows = conn.execute(
                'SELECT doc_id, title, source_url, word_count, content_hash, created_at '
                'FROM reference_documents ORDER BY created_at DESC'
            ).fetchall()
            return [dict(r) for r in rows]

    def get_reference_doc(self, doc_id: str) -> dict | None:
        with self._lock, self._connection() as conn:
            row = conn.execute('SELECT * FROM reference_documents WHERE doc_id=?', (doc_id,)).fetchone()
            return dict(row) if row else None

    def delete_reference_doc(self, doc_id: str) -> bool:
        with self._lock, self._connection() as conn:
            cursor = conn.execute('DELETE FROM reference_documents WHERE doc_id=?', (doc_id,))
            return cursor.rowcount > 0

    # --- Plagiarism Check Operations ---

    def find_active_check(self, job_id: str, content_hash: str, check_mode: str) -> dict | None:
        """Find any queued or processing check for the same job, content, and mode to avoid duplicates."""
        with self._lock, self._connection() as conn:
            row = conn.execute(
                "SELECT * FROM plagiarism_checks WHERE job_id=? AND content_hash=? AND check_mode=? AND status IN ('queued', 'processing')",
                (job_id, content_hash, check_mode)
            ).fetchone()
            return dict(row) if row else None

    def create_check(self, job_id: str, check_mode: str, scope: str, content_hash: str) -> dict:
        # Check for active duplicate first
        active = self.find_active_check(job_id, content_hash, check_mode)
        if active:
            return active

        check_id = str(uuid4())
        now = utc_now()
        with self._lock, self._connection() as conn:
            conn.execute('''INSERT INTO plagiarism_checks
                (check_id, job_id, status, check_mode, scope, content_hash, created_at, updated_at)
                VALUES (?, ?, 'queued', ?, ?, ?, ?, ?)''',
                (check_id, job_id, check_mode, scope, content_hash, now, now))
        return {
            'check_id': check_id,
            'job_id': job_id,
            'status': 'queued',
            'created_at': now
        }

    def get_check(self, check_id: str) -> dict | None:
        with self._lock, self._connection() as conn:
            row = conn.execute('SELECT * FROM plagiarism_checks WHERE check_id=?', (check_id,)).fetchone()
            return dict(row) if row else None

    def get_latest_check_by_job(self, job_id: str) -> dict | None:
        with self._lock, self._connection() as conn:
            row = conn.execute(
                'SELECT * FROM plagiarism_checks WHERE job_id=? ORDER BY created_at DESC LIMIT 1',
                (job_id,)
            ).fetchone()
            return dict(row) if row else None

    def set_check_processing(self, check_id: str):
        with self._lock, self._connection() as conn:
            conn.execute(
                "UPDATE plagiarism_checks SET status='processing', updated_at=? WHERE check_id=? AND status='queued'",
                (utc_now(), check_id)
            )

    def complete_check(
        self,
        check_id: str,
        report: dict,
        similarity_percentage: float | None,
        sources_checked: int | None
    ):
        with self._lock, self._connection() as conn:
            conn.execute(
                "UPDATE plagiarism_checks SET status='completed', report_json=?, similarity_percentage=?, "
                "sources_checked=?, error_message=NULL, updated_at=? WHERE check_id=?",
                (json.dumps(report, ensure_ascii=False), similarity_percentage, sources_checked, utc_now(), check_id)
            )

    def fail_check(self, check_id: str, error_message: str):
        with self._lock, self._connection() as conn:
            conn.execute(
                "UPDATE plagiarism_checks SET status='failed', error_message=?, updated_at=? WHERE check_id=?",
                (error_message[:400], utc_now(), check_id)
            )

    def mark_interrupted(self):
        """Recovery for in-flight tasks when server restarts."""
        with self._lock, self._connection() as conn:
            conn.execute(
                "UPDATE plagiarism_checks SET status='failed', "
                "error_message='Plagiarism check was interrupted by a server restart. Submit the check again.', "
                "updated_at=? WHERE status IN ('queued', 'processing')",
                (utc_now(),)
            )
