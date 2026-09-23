"""Environment based configuration. No remote services in local mode."""
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / 'backend'

try:
    from dotenv import load_dotenv
    load_dotenv(BACKEND_ROOT / '.env')
except Exception:
    pass
RULEBOOK = Path(os.getenv('HUMANIZER_RULEBOOK', str(PROJECT_ROOT / 'Functional Humanizer.md')))
DB_PATH = Path(os.getenv('HUMANIZER_DB_PATH', str(BACKEND_ROOT / 'jobs.db')))
MAX_CHARACTERS = int(os.getenv('HUMANIZER_MAX_CHARACTERS', '150000'))
DEFAULT_MODE = os.getenv('HUMANIZER_DEFAULT_MODE', 'local')
API_KEY = os.getenv('HUMANIZE_AI_TEXT_API_KEY', '')
BASE_URL = os.getenv('HUMANIZE_AI_TEXT_BASE_URL', 'https://api.humanize-ai-text.ai/v1')
ALLOWED_ORIGINS = os.getenv('HUMANIZER_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')

# OpenAI Semantic Humanizer Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '').strip()
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini').strip()

# Plagiarism Checker Configuration
PLAGIARISM_DB_PATH = Path(os.getenv('PLAGIARISM_DB_PATH', str(DB_PATH)))
PLAGIARISM_DEFAULT_MODE = os.getenv('PLAGIARISM_DEFAULT_MODE', 'local')
PLAGIARISM_API_KEY = os.getenv('PLAGIARISM_API_KEY', '')
PLAGIARISM_API_URL = os.getenv('PLAGIARISM_API_URL', '')
PLAGIARISM_MIN_PASSAGE_CHARS = int(os.getenv('PLAGIARISM_MIN_PASSAGE_CHARS', '35'))
PLAGIARISM_MIN_PASSAGE_WORDS = int(os.getenv('PLAGIARISM_MIN_PASSAGE_WORDS', '6'))
PLAGIARISM_SIMILARITY_THRESHOLD = float(os.getenv('PLAGIARISM_SIMILARITY_THRESHOLD', '0.85'))
