"""Quick local smoke test without installing any frontend packages."""
import argparse
import json
from pathlib import Path
from app.pipeline import process

parser = argparse.ArgumentParser(description='Generate a local editorial JSON result from a Markdown blog.')
parser.add_argument('article', type=Path, help='Path to a Markdown or text blog.')
args = parser.parse_args()
article = args.article.read_text(encoding='utf-8')
result = process(article, 'local', [])
print(result.model_dump_json(indent=2))
