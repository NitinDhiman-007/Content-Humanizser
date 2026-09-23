"""Safe text extraction from TXT, Markdown, and PDF documents."""
from __future__ import annotations
import hashlib
import io
import re

MAX_DOCUMENT_BYTES = 10 * 1024 * 1024  # 10 MB limit
WORD_PATTERN = re.compile(r"[^\W_]+(?:['’][^\W_]+)*", re.UNICODE)


def calculate_hash(text: str) -> str:
    """Deterministic SHA-256 hash of text."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def count_words(text: str) -> int:
    """Count words using unicode word pattern."""
    return len(WORD_PATTERN.findall(text))


def parse_plain_text(data: bytes) -> str:
    """Decode plain text or markdown safely."""
    if len(data) > MAX_DOCUMENT_BYTES:
        raise ValueError(f'Document exceeds maximum size limit of {MAX_DOCUMENT_BYTES // (1024 * 1024)}MB.')
    try:
        text = data.decode('utf-8')
    except UnicodeDecodeError:
        try:
            text = data.decode('latin-1')
        except Exception as exc:
            raise ValueError('Document cannot be decoded as valid text.') from exc
    if not text.strip():
        raise ValueError('Document contains no readable text.')
    return text


def parse_pdf(data: bytes) -> str:
    """Extract text from PDF safely using pypdf."""
    if len(data) > MAX_DOCUMENT_BYTES:
        raise ValueError(f'PDF exceeds maximum size limit of {MAX_DOCUMENT_BYTES // (1024 * 1024)}MB.')
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            try:
                reader.decrypt('')
            except Exception:
                raise ValueError('Encrypted or password-protected PDF files cannot be processed.')
        pages_text = []
        for i, page in enumerate(reader.pages):
            extracted = page.extract_text() or ''
            if extracted.strip():
                pages_text.append(extracted)
        text = '\n\n'.join(pages_text).strip()
        if not text:
            raise ValueError('PDF contains no extractable text (it may be scanned images).')
        return text
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f'Invalid or corrupt PDF document: {str(exc)}') from exc


def parse_docx(data: bytes) -> str:
    """Extract text from Word .docx file safely using standard zipfile and xml parser."""
    if len(data) > MAX_DOCUMENT_BYTES:
        raise ValueError(f'DOCX exceeds maximum size limit of {MAX_DOCUMENT_BYTES // (1024 * 1024)}MB.')
    try:
        import zipfile
        import xml.etree.ElementTree as ET
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            texts = [node.text for node in tree.iter() if node.text]
            text = ' '.join(texts).strip()
            if not text:
                raise ValueError('Word document contains no readable text.')
            return text
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f'Invalid or corrupt Word document: {str(exc)}') from exc


def extract_document_text(filename: str, data: bytes) -> str:
    """Route document extraction based on filename extension."""
    lower = filename.lower()
    if lower.endswith('.pdf'):
        return parse_pdf(data)
    elif lower.endswith(('.docx', '.doc')):
        return parse_docx(data)
    elif lower.endswith(('.txt', '.md', '.markdown', '.rst')):
        return parse_plain_text(data)
    else:
        # Fallback to plain text decoding
        return parse_plain_text(data)

