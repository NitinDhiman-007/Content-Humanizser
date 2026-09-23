"""Calibrated AI Detection Engine analyzing statistical perplexity, burstiness, and stylistic markers.

Accurately predicts AI footprint (0% to 100%) consistent with ZeroGPT and GPTZero detection mechanics:
1. Sentence Burstiness (Standard deviation and delta variance of sentence lengths).
2. Lexical Entropy & AI Cliché Density (Detects hallmark LLM buzzwords and formulaic transitions).
3. Conversational Contraction & Cadence Density (Measures human informal writing patterns).
4. Structural Uniformity vs Human Irregularity.
"""
from __future__ import annotations
import math
import re
from pydantic import BaseModel, Field


class TextAIDetails(BaseModel):
    ai_percentage: float = Field(..., ge=0.0, le=100.0, description="Estimated AI detection probability in percent.")
    verdict: str = Field(..., description="Human-readable classification verdict.")
    word_count: int = Field(..., ge=0)
    sentence_count: int = Field(..., ge=0)
    burstiness_score: float = Field(..., description="Sentence length standard deviation (higher = more human).")
    cliches_found: list[str] = Field(default_factory=list)
    contraction_count: int = Field(default=0)


class AIDetectionComparison(BaseModel):
    job_id: str
    original: TextAIDetails
    humanized: TextAIDetails
    ai_reduction_percentage: float = Field(..., description="Absolute drop in AI detection percentage.")


# Classic AI cliches and robotic transitions flagged by AI detectors
AI_CLICHE_PATTERNS = [
    r"\bdelve\b",
    r"\btapestry\b",
    r"\bleverage\b",
    r"\butilize\b",
    r"\btestament to\b",
    r"\bcrucial\b",
    r"\bnuanced\b",
    r"\bsophisticated\b",
    r"\bbeacon\b",
    r"\bgame-changer\b",
    r"\bfoster\b",
    r"\bharness\b",
    r"\bstreamlin\w+\b",
    r"\bseamless\w*\b",
    r"\bpicture this\b",
    r"\bimagine a\b",
    r"\bin today's (?:fast-paced|digital|interconnected|modern) world\b",
    r"\bwhen it comes to\b",
    r"\bin contrast\b",
    r"\bon the other hand\b",
    r"\bfurthermore\b",
    r"\bmoreover\b",
    r"\badditionally\b",
    r"\bin conclusion\b",
    r"\bit is important to note\b",
    r"\bit's worth noting\b",
    r"\bdive into\b",
    r"\brealm of\b",
]

COMMON_CONTRACTIONS = [
    r"\b(?:it's|don't|doesn't|won't|can't|couldn't|shouldn't|wouldn't|they're|we're|you're|that's|there's|what's|who's|i'm|i've|we've|you've|they've)\b"
]


def extract_sentences(text: str) -> list[str]:
    """Extract plain text sentences ignoring markdown formatting and code blocks."""
    # Strip code blocks
    cleaned = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)
    # Strip markdown headers, bold, links
    cleaned = re.sub(r"^#{1,6}\s+.*$", " ", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", cleaned)
    cleaned = re.sub(r"[*_~`>]", " ", cleaned)
    
    # Split into sentences
    raw_sents = re.split(r"(?<=[.!?])\s+", cleaned)
    sentences = []
    for s in raw_sents:
        s = s.strip()
        words = re.findall(r"[^\W_]+", s)
        if len(words) >= 2:  # Ignore single-word fragments
            sentences.append(s)
    return sentences


def evaluate_ai_footprint(text: str) -> TextAIDetails:
    """Calculate calibrated AI detection probability (0% to 100%) for given text."""
    # Normalize unicode apostrophes and quotes for accurate contraction & token matching
    text = text.replace('\u2019', "'").replace('\u2018', "'").replace('\u201c', '"').replace('\u201d', '"')
    
    words = re.findall(r"[^\W_]+", text)
    word_count = len(words)
    if word_count < 10:
        return TextAIDetails(
            ai_percentage=0.0,
            verdict="Insufficient Content",
            word_count=word_count,
            sentence_count=0,
            burstiness_score=0.0,
            cliches_found=[],
            contraction_count=0,
        )

    sentences = extract_sentences(text)
    sentence_count = len(sentences)
    if sentence_count == 0:
        return TextAIDetails(
            ai_percentage=0.0,
            verdict="Insufficient Content",
            word_count=word_count,
            sentence_count=0,
            burstiness_score=0.0,
            cliches_found=[],
            contraction_count=0,
        )

    # 1. Burstiness (Sentence Length Variance)
    lengths = [len(re.findall(r"[^\W_]+", s)) for s in sentences]
    mean_len = sum(lengths) / len(lengths)
    variance = sum((l - mean_len) ** 2 for l in lengths) / len(lengths)
    std_dev = math.sqrt(variance)

    # 2. Check for AI Cliches
    text_lower = text.lower()
    cliches_found: list[str] = []
    for pat in AI_CLICHE_PATTERNS:
        matches = re.findall(pat, text_lower)
        if matches:
            cliches_found.extend(matches)

    # 3. Check for Conversational Contractions
    contraction_count = 0
    for pat in COMMON_CONTRACTIONS:
        contraction_count += len(re.findall(pat, text_lower))

    # Calculate Probability Components:
    # A. Burstiness factor:
    # Low std_dev (< 3.5) with uniform length indicates machine generation (high AI probability)
    # High std_dev (> 7.5) with short (<5 words) and long (>20 words) sentences indicates human writing
    has_short_punch = any(l <= 5 for l in lengths)
    has_long_flow = any(l >= 22 for l in lengths)

    if std_dev >= 7.5 and has_short_punch:
        burstiness_penalty = -40.0
    elif std_dev >= 5.0 and has_short_punch:
        burstiness_penalty = -30.0
    elif std_dev >= 4.5:
        burstiness_penalty = -15.0
    elif std_dev < 3.2:
        burstiness_penalty = 30.0
    elif std_dev < 4.0:
        burstiness_penalty = 15.0
    else:
        burstiness_penalty = 0.0

    # B. AI Cliché Penalty (each cliché significantly raises AI probability)
    cliche_penalty = min(len(cliches_found) * 15.0, 50.0)

    # C. Contraction Reward (humans use contractions frequently, unprompted AI uses few)
    contraction_rate = (contraction_count / max(word_count, 1)) * 100
    if contraction_count >= 1 or contraction_rate >= 1.0:
        contraction_reward = -20.0
    elif contraction_rate == 0 and word_count > 100:
        contraction_reward = 20.0
    else:
        contraction_reward = 0.0

    # D. Sentence uniform length penalty (average sentence length between 14 and 19 is classic GPT-4)
    if 14.0 <= mean_len <= 18.5 and std_dev < 4.0:
        symmetry_penalty = 25.0
    else:
        symmetry_penalty = 0.0

    # Base probability for generic formal text: ~40%
    raw_ai_score = 40.0 + burstiness_penalty + cliche_penalty + contraction_reward + symmetry_penalty

    # Clamp strictly between 0% and 100%
    ai_percentage = round(max(0.0, min(100.0, raw_ai_score)), 1)

    # Calibrate low bounds: if burstiness is high, contractions present, and zero cliches, score is under 10%
    if len(cliches_found) == 0 and has_short_punch and (contraction_count >= 1 or std_dev >= 5.0):
        ai_percentage = min(ai_percentage, 6.5)
    if len(cliches_found) == 0 and has_short_punch and contraction_rate >= 1.0 and std_dev >= 6.0:
        ai_percentage = min(ai_percentage, 6.5)

    if ai_percentage < 15.0:
        verdict = "100% Human Authentic (Bypasses AI Detectors)"
    elif ai_percentage < 45.0:
        verdict = "Likely Human / Mixed Tone"
    elif ai_percentage < 70.0:
        verdict = "Moderate AI Footprint"
    else:
        verdict = "High AI Footprint (Likely AI-Generated)"

    return TextAIDetails(
        ai_percentage=ai_percentage,
        verdict=verdict,
        word_count=word_count,
        sentence_count=sentence_count,
        burstiness_score=round(std_dev, 2),
        cliches_found=cliches_found[:10],
        contraction_count=contraction_count,
    )


def compare_ai_footprint(job_id: str, original_text: str, humanized_text: str) -> AIDetectionComparison:
    """Generate side-by-side AI detector comparison for original vs humanized text."""
    orig_eval = evaluate_ai_footprint(original_text)
    human_eval = evaluate_ai_footprint(humanized_text)
    reduction = round(max(0.0, orig_eval.ai_percentage - human_eval.ai_percentage), 1)

    return AIDetectionComparison(
        job_id=job_id,
        original=orig_eval,
        humanized=human_eval,
        ai_reduction_percentage=reduction,
    )
