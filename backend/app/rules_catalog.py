"""Parse authoritative Markdown identifiers; do not pretend all rules are automated."""
import re
from functools import lru_cache
from .config import RULEBOOK

# Only rules with a real, narrowly scoped automatic implementation are listed.
AUTOMATED_RULES = {
    'R002', 'R003', 'R004', 'R005', 'R009', 'R019', 'R048',
    'R050', 'R056', 'R071', 'R086', 'R093', 'R095', 'R096', 'R100',
}

@lru_cache(maxsize=1)
def load_catalog():
    text = RULEBOOK.read_text(encoding='utf-8')
    rules = dict(re.findall(r'\*\*R(\d{3})\.\s+(.+?)\*\*', text))
    requirements = dict(re.findall(r'^\|\s*(F\d{3})\s*\|\s*([^|]+)', text, flags=re.M))
    tests = dict(re.findall(r'^\|\s*(A\d{3})\s*\|\s*([^|]+)', text, flags=re.M))
    if set(rules) != {f'{i:03d}' for i in range(1, 101)}:
        raise ValueError('Rulebook is missing one or more of the 100 editorial rules.')
    if set(requirements) != {f'F{i:03d}' for i in range(1, 31)}:
        raise ValueError('Rulebook is missing functional requirements.')
    if set(tests) != {f'A{i:03d}' for i in range(1, 28)}:
        raise ValueError('Rulebook is missing acceptance tests.')
    return {'rules': rules, 'requirements': requirements, 'tests': tests,
            'automated_rules': sorted(AUTOMATED_RULES),
            'review_required_rules': [f'R{i:03d}' for i in range(1, 101)
                                      if f'R{i:03d}' not in AUTOMATED_RULES]}
