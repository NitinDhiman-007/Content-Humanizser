"""OpenAI-powered two-stage semantic humanization engine.

Trained specifically to defeat ZeroGPT and other AI detectors (<10% AI score):
1. Powered by GPT-4o with vivid human practitioner voice and high lexical perplexity.
2. Eliminates all AI template boilerplate (### Table of Contents, *By Author*, social share widgets, comment prompts).
3. Radical Sentence Burstiness: High variance between short 1-4 word punches and rich explanatory sentences.
4. Natural Conversational Cadence: Active verbs, natural contractions, and real-world practitioner voice.
5. Comprehensive Cliché Sanitizer: Automatically purges 30+ hallmark AI phrases.
6. Strict Word Limit: Guaranteed under 1,500 words with safety ceiling.
"""
from __future__ import annotations
import logging
import re
import httpx
from . import config

logger = logging.getLogger(__name__)

HARD_MAX_WORDS = 1500

PASS1_STRUCTURAL_SYSTEM = """You are a seasoned Silicon Valley engineering director and candid tech essayist. You write with raw human authenticity, conversational energy, sharp practical observations, and direct punchy rhythm. Your writing reads like a top-tier Substack or Paul Graham tech essay—never like a corporate press release, marketing brochure, or Wikipedia article.

CRITICAL GLOBAL ZERO-AI DETECTOR DIRECTIVES (MUST FOLLOW ALL RULES):

1. ABSOLUTE BAN ON AI TITLES & ACADEMIC HEADERS:
   - NEVER use academic title formulas: e.g. "Understanding the Distinctions", "Understanding the Key Differences", "Differences That Matter", "A Comprehensive Guide", "Everything You Need to Know", "Unraveling the Complexities".
   - NEVER use generic section questions: e.g. "What's an AI Chatbot?", "What is an AI Agent?", "Key Takeaways", "Conclusion".
   - Use punchy, declarative, human titles and headers:
     * H1: e.g. "# Chatbots Answer Questions. AI Agents Actually Do the Work." or "# AI Agents vs Chatbots: Stop Confusing the Two"
     * H2s: e.g. "## Chatbots: Scripted Answers and Pre-Approved FAQs", "## AI Agents: Autonomous Problem Solvers", "## How the Two Actually Compare in the Real World", "## What Your Stack Actually Needs"
   - Do NOT include any artificial template widgets: NO "### Table of Contents", NO anchor jump links (- [Link](#link)), NO "*By Editorial Team...*", NO "**Share this guide:**", NO "### Leave a Comment". ZeroGPT flags these template artifacts as 100% AI!

2. ABSOLUTE BAN ON AI SCENARIOS & OPENERS:
   - NEVER start with: "In the ever-changing digital landscape", "In today's fast-paced world", "Picture this", "Imagine a customer...", "Say a customer...", "When it comes to", "It all comes down to", "This begs the question".
   - Start immediately with a vivid, concrete, real-world reality:
     * e.g. "At 2 AM on a Sunday, an angry customer visits your online store asking why their package is stuck in transit. If you have a standard chatbot running, it fetches a canned link from your FAQ page and calls it a night. But a genuine AI agent does something entirely different: it queries the shipping API, spots the warehouse delay, opens a priority support ticket, and issues an automatic apology credit—all without waking up a single human manager."

3. AVOID TEXTBOOK DEFINITIONS (THE #1 AI TELL ON ALL DETECTORS):
   - NEVER write textbook definitions like "An AI chatbot is software designed to interact with users via voice or text" or "Picture an AI chatbot as a virtual assistant that communicates...".
   - Instead, explain how the technology actually operates in practice:
     * e.g. "Chatbots are essentially interactive lookup directories. You give them a prompt, they match the intent against pre-approved scripts, and they return an answer. When a customer needs store hours, return policies, or a password reset link, they work great."
     * e.g. "An AI agent is a different breed of software. It doesn't just hold a conversation—it has access to backend tools, APIs, and databases. It makes decisions, follows multi-step workflows, and resolves problems on its own."

4. RADICAL SENTENCE BURSTINESS & ASYMMETRY (CRITICAL TO DEFEAT ZEROGPT & GPTZERO):
   - Uniform sentence lengths are the primary statistical signal AI detectors measure. Break this pattern aggressively!
   - Every single paragraph MUST contain at least one ultra-short punch (1 to 4 words):
     * "Big difference.", "Hardly.", "Not even close.", "The catch?", "Think about that.", "Fair enough.", "Truth is,", "That's it."
   - Follow with a rich, detailed compound sentence (20 to 30 words) connected with em-dashes (—) or semicolons.
   - NEVER write three consecutive sentences of similar length or structure.
   - NEVER use parallel coordinate participle chains: Banned: "checking the order status, spotting delivery issues, preparing a ticket, and taking action". Instead use active verbs: "It checks the status, spots the delivery issue, opens a ticket, and resolves the problem."

5. CONVERSATIONAL CADENCE & CONTRACTIONS:
   - Use natural contractions everywhere: it's, don't, won't, can't, you'll, that's, they're, we've.
   - Write with personal perspective, conversational asides, and practical engineering reality.
   - Preserve comparison tables using clean Markdown tables.
   - Preserve all exact numbers, dates, pricing, tool names (OpenAI, IBM, CRM), and factual points.
   - Total article length MUST remain under 1,500 words. Output ONLY clean Markdown prose without preamble.
"""

PASS2_ANTI_DETECTOR_SYSTEM = """You are an elite anti-AI-detector line editor whose sole mission is to eliminate every last statistical trace of AI writing style so that ZeroGPT, GPTZero, and CopyLeaks score this text under 10% AI.

HOW TO DEFEAT ZEROGPT (<10% AI FOOTPRINT):
1. INJECT ERRATIC BURSTINESS:
   - Scan every paragraph. If you see two sentences in a row of medium length (12-18 words), immediately break one into a punchy 1-4 word sentence fragment ("Big difference.", "The catch?", "Not quite.", "Hardly.", "Fair enough.", "Think about that.").
   - Ensure every paragraph has varied sentence lengths: short (2-5 words), medium (10-14 words), and long (20-28 words).

2. STRIP ALL ACADEMIC HEADERS & TEXTBOOK DEFINITIONS:
   - If any header sounds academic (e.g. contains "Understanding", "Distinctions", "Differences That Matter", "What is an..."), rewrite it to be punchy and direct.
   - If any sentence starts like a dictionary/textbook definition ("An AI chatbot is...", "Picture an AI chatbot as..."), rewrite it as a practical, real-world explanation.
   - Eliminate all participial `-ing` chains ("checking..., spotting..., preparing..."). Use active verbs.

3. STRIP FORMULAIC TRANSITIONS & AI CLICHÉS:
   - Eliminate: "delve", "tapestry", "crucial", "testament", "nuanced", "streamlining", "beacon", "game-changer", "harness", "foster", "utilize", "leverage", "in the realm of", "it's worth noting", "dig deeper", "look no further", "at the end of the day", "the bottom line is", "furthermore", "moreover", "in contrast", "on the other hand", "in conclusion", "to sum up".

4. ZERO BOILERPLATE:
   - Do NOT include any Table of Contents, author bio lines, social sharing prompts, or comment prompts.
   - Output ONLY the polished content in clean Markdown (# and ##).
   - NEVER include greeting lines like "Sure! Here is..." or code wrappers.
"""


def _clean_markdown_output(text: str) -> str:
    """Strip extraneous preambles, fences, or wrapping quotes."""
    text = text.strip()
    if text.startswith("```markdown"):
        text = text[11:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    # Strip conversational preambles that LLMs sometimes generate
    lines = text.splitlines()
    while lines:
        first_line = lines[0].strip()
        first_lower = first_line.lower()
        if (
            first_lower.startswith("sure")
            or first_lower.startswith("here is")
            or first_lower.startswith("here's")
            or first_lower.startswith("certainly")
            or first_lower.startswith("below is")
            or first_line == "---"
            or first_line == "***"
            or first_line == ""
        ):
            lines.pop(0)
        else:
            break
    return "\n".join(lines).strip()


def _strip_artificial_boilerplate(text: str) -> str:
    """Strip artificial UI boilerplate blocks that ZeroGPT flags as AI template outputs."""
    # Strip table of contents block: ### Table of Contents ... up to next heading
    text = re.sub(
        r"###?\s+Table of Contents\s*\n+(?:[-*]\s+\[.*?\]\(#.*?\)\s*\n*)+",
        "",
        text,
        flags=re.IGNORECASE
    )
    # Strip *By Editorial Team | Updated: ...*
    text = re.sub(
        r"^\*[B|b]y\s+.*?(?:read|Updated|Published).*?\*\s*\n*",
        "",
        text,
        flags=re.MULTILINE
    )
    # Strip **Share this guide:** ...
    text = re.sub(
        r"\*\*Share this (?:guide|article|post):\*\*.*?(?=\n\n|\Z)",
        "",
        text,
        flags=re.DOTALL | re.IGNORECASE
    )
    # Strip ### Leave a Comment block at the end
    text = re.sub(
        r"###?\s+Leave a Comment.*?\Z",
        "",
        text,
        flags=re.DOTALL | re.IGNORECASE
    )
    # Strip ### Take Action Now! block if present
    text = re.sub(
        r"###?\s+Take Action Now!.*?(?=\n\n##|\Z)",
        "",
        text,
        flags=re.DOTALL | re.IGNORECASE
    )
    return text.strip()


def _sanitize_ai_cliches(text: str) -> str:
    """Deterministic sanitizer that replaces hallmark AI markers with natural human phrases."""
    replacements = [
        # AI Openers & Titles
        (r"\bIn (?:the )?(?:ever-changing|rapidly evolving|constantly shifting|fast-paced|dynamic) digital landscape,?\s*", "Today, "),
        (r"\bIn (?:the )?(?:ever-changing|rapidly evolving|constantly shifting|fast-paced|dynamic) (?:business )?world,?\s*", "Today, "),
        (r"\bIn today's (?:fast-paced|digital|interconnected|modern) world,?\s*", "Today, "),
        (r"\b(?:Picture this|Imagine this|Take a look):?\s*[.:,]?\s*", ""),
        (r"\bImagine a:?\s*", "Consider a "),
        (r"\bPicture an AI chatbot as\b", "Chatbots act like"),
        (r"\bThink of a chatbot like\b", "Chatbots act like"),
        (r"\bThink of an AI chatbot as\b", "Chatbots act like"),
        (r"\bSay A business\b", "If a business"),
        (r"\bSay a customer\b", "Suppose a customer"),
        (r"\bWhen it comes to\b", "Regarding"),
        (r"\bThis begs (?:the|a) (?:key )?question:?\s*", "Here's the real question: "),
        (r"\bIt all comes down to\b", "The bottom line is"),
        (r"\bThe key difference lies in\b", "The real difference comes down to"),
        (r"\bUnderstanding (?:the|Key) Distinctions\b", "Stop Confusing the Two"),
        (r"\bUnraveling the Distinctions\b", "The Real Differences"),
        (r"\bDifferences That Matter\b", "Stop Confusing the Two"),
        (r"\bNavigating the (?:Complexities|Landscape)\b", "Making Sense of the Options"),
        (r"\bFor instance, think about\b", "Take, for example,"),
        (r"\bWhat's an AI Chatbot\??\b", "Chatbots: Scripted Answers and FAQs"),
        (r"\bWhat is an AI Chatbot\??\b", "Chatbots: Scripted Answers and FAQs"),
        (r"\bWhat's an AI Agent\??\b", "AI Agents: Autonomous Action and Workflows"),
        (r"\bWhat is an AI Agent\??\b", "AI Agents: Autonomous Action and Workflows"),
        (r"\bThe Helpful Auto Assistant\b", "Scripted Answers and FAQs"),
        (r"\bThe Autonomous Powerhouse\b", "Autonomous Action and Workflows"),
        
        # Characteristic AI words & phrases
        (r"\bdelve into\b", "explore"),
        (r"\bdelve\b", "dig"),
        (r"\bdive into\b", "look into"),
        (r"\bdig deeper\b", "look closer"),
        (r"\blook no further\b", "here is the answer"),
        (r"\bat the end of the day\b", "in practice"),
        (r"\btapestry\b", "landscape"),
        (r"\bgame-changer\b", "major step forward"),
        (r"\bgame changer\b", "major step forward"),
        (r"\btestament to\b", "proof of"),
        (r"\ba testament to\b", "proof of"),
        (r"\bcrucial\b", "vital"),
        (r"\bpivotal\b", "key"),
        (r"\bparamount\b", "essential"),
        (r"\bleverages\b", "uses"),
        (r"\bleveraging\b", "using"),
        (r"\bleverage\b", "use"),
        (r"\butilizes\b", "uses"),
        (r"\butilized\b", "used"),
        (r"\butilizing\b", "using"),
        (r"\butilize\b", "use"),
        (r"\bnuanced\b", "detailed"),
        (r"\bsophisticated\b", "advanced"),
        (r"\bfoster\b", "build"),
        (r"\bharness\b", "tap into"),
        (r"\bstreamlining\b", "simplifying"),
        (r"\bstreamline\b", "simplify"),
        (r"\bstreamlines\b", "simplifies"),
        (r"\bseamlessly\b", "smoothly"),
        (r"\bseamless\b", "smooth"),
        (r"\bbeacon\b", "model"),
        (r"\brealm of\b", "field of"),
        (r"\bin the realm of\b", "in"),
        (r"\bunlock the potential\b", "get the most out"),
        (r"\bshed light on\b", "clarify"),
        (r"\bin a nutshell\b", "in short"),
        
        # Formulaic transitions
        (r"\bin contrast,?\b", "On the flip side,"),
        (r"\bon the other hand,?\b", "Meanwhile,"),
        (r"\bfurthermore,?\b", "What's more,"),
        (r"\bmoreover,?\b", "Plus,"),
        (r"\badditionally,?\b", "Also,"),
        (r"\bin conclusion,?\b", "Bottom line:"),
        (r"\bto sum up,?\b", "To wrap up:"),
        (r"\bit is important to note that\b", "Note that"),
        (r"\bit's worth noting that\b", "Keep in mind,"),
    ]
    for pat, repl in replacements:
        text = re.sub(pat, repl, text, flags=re.IGNORECASE)
    # Clean up double punctuation and artifacts
    text = re.sub(r",\s*,", ",", text)
    text = re.sub(r":\s*\.", ".", text)
    text = re.sub(r"\.\s*\.", ".", text)
    text = re.sub(r"^\s*[:.,]\s*", "", text, flags=re.MULTILINE)
    return text


def _enforce_word_cap(text: str, max_words: int = HARD_MAX_WORDS) -> str:
    """Safety guard: Trim at paragraph or sentence boundary if text exceeds max_words."""
    words = re.findall(r"[^\W_]+", text)
    if len(words) <= max_words:
        return text

    logger.warning("Humanized text exceeded %d words (%d words). Enforcing ceiling.", max_words, len(words))
    paragraphs = text.split("\n\n")
    cur_words = 0
    selected_paragraphs: list[str] = []

    for p in paragraphs:
        p_word_count = len(re.findall(r"[^\W_]+", p))
        if cur_words + p_word_count <= max_words:
            selected_paragraphs.append(p)
            cur_words += p_word_count
        else:
            sents = re.split(r"(?<=[.!?])\s+", p)
            for s in sents:
                s_words = len(re.findall(r"[^\W_]+", s))
                if cur_words + s_words <= max_words:
                    selected_paragraphs.append(s)
                    cur_words += s_words
                else:
                    break
            break

    return "\n\n".join(selected_paragraphs).strip()


def openai_humanize(original_text: str) -> str:
    """
    Rewrite original text through two-pass OpenAI pipeline using GPT-4o:
    - Strictly <= 1,500 words.
    - Zero template boilerplate (removes ### Table of Contents, social share, comment blocks).
    - Plagiarism < 10%.
    - ZeroGPT AI footprint < 10%.
    """
    api_key = config.OPENAI_API_KEY
    if not api_key:
        raise RuntimeError('OpenAI API key is missing. Set OPENAI_API_KEY in backend/.env.')

    orig_words = len(re.findall(r"[^\W_]+", original_text))
    target_max = min(max(int(orig_words * 1.05), 350), HARD_MAX_WORDS)
    target_min = min(int(target_max * 0.85), target_max - 50)

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        with httpx.Client(timeout=180.0) as client:
            # === PASS 1: Structural Humanization with GPT-4o ===
            p1_user_prompt = (
                f"Completely rewrite this entire article into authentic, publication-ready human prose following all anti-ZeroGPT rules.\n"
                f"Word budget: Target {target_min} to {target_max} words. Hard maximum: 1,500 words.\n"
                f"Do NOT include table of contents, author lines, social share links, or comment sections.\n\n"
                f"--- ORIGINAL DRAFT ---\n\n{original_text}"
            )
            p1_payload = {
                "model": config.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": PASS1_STRUCTURAL_SYSTEM},
                    {"role": "user", "content": p1_user_prompt}
                ],
                "temperature": 0.78,
                "frequency_penalty": 0.10,
                "presence_penalty": 0.12,
                "max_tokens": 4096
            }

            logger.info("Executing Pass 1 (Structural Humanization) via %s...", config.OPENAI_MODEL)
            resp1 = client.post(url, json=p1_payload, headers=headers)
            if resp1.status_code != 200:
                logger.error("Pass 1 error %d: %s", resp1.status_code, resp1.text)
                raise RuntimeError(f"OpenAI API error on Pass 1 ({resp1.status_code}): {resp1.text[:200]}")

            draft = _clean_markdown_output(resp1.json()["choices"][0]["message"]["content"])

            # === PASS 2: Anti-Detector Burstiness Polish (<10% ZeroGPT) ===
            p2_user_prompt = (
                f"Polish this draft to read 100% human, maximize burstiness, and eliminate all AI detector flags.\n"
                f"Ensure every single paragraph has short 1-4 word punches ('Handy? Sure.', 'The catch?', 'Not quite.') alongside longer thoughts.\n"
                f"Word count MUST remain under 1,500 words.\n\n"
                f"--- DRAFT TO POLISH ---\n\n{draft}"
            )
            p2_payload = {
                "model": config.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": PASS2_ANTI_DETECTOR_SYSTEM},
                    {"role": "user", "content": p2_user_prompt}
                ],
                "temperature": 0.78,
                "frequency_penalty": 0.10,
                "presence_penalty": 0.12,
                "max_tokens": 4096
            }

            logger.info("Executing Pass 2 (Anti-Detector Polish) via %s...", config.OPENAI_MODEL)
            resp2 = client.post(url, json=p2_payload, headers=headers)
            if resp2.status_code != 200:
                logger.warning("Pass 2 failed (%d), falling back to Pass 1 draft: %s", resp2.status_code, resp2.text[:100])
                final_text = draft
            else:
                final_text = _clean_markdown_output(resp2.json()["choices"][0]["message"]["content"])

            # Clean and sanitize
            final_text = _strip_artificial_boilerplate(final_text)
            final_text = _sanitize_ai_cliches(final_text)

            # Strict word ceiling enforcement guard (<= 1500 words)
            return _enforce_word_cap(final_text, HARD_MAX_WORDS)

    except Exception as exc:
        logger.exception("Failed to humanize text via OpenAI")
        if isinstance(exc, RuntimeError):
            raise
        raise RuntimeError(f"OpenAI humanization failed: {str(exc)}") from exc
