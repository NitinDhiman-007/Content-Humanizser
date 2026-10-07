import re
from app.ai_detector import evaluate_ai_footprint

with open('../sample_blog.md', encoding='utf-8') as f:
    text = f.read()

# Replace cliches
text = text.replace('Imagine a customer', 'At 2 AM on a Sunday, a customer').replace('imagine a business', 'suppose a business')
# Replace contractions
text = re.sub(r'\bdo not\b', "don't", text)
text = re.sub(r'\bdoes not\b', "doesn't", text)
text = re.sub(r'\bcannot\b', "can't", text)
text = re.sub(r'\bit is\b', "it's", text)
text = re.sub(r'\bthey are\b', "they're", text)
text = re.sub(r'\bwe have\b', "we've", text)
text = re.sub(r'\bwhat is\b', "what's", text)

res = evaluate_ai_footprint(text)
print('Score after test pass:', res.ai_percentage, 'Cliches:', res.cliches_found, 'Contractions:', res.contraction_count, 'Burstiness:', res.burstiness_score)
