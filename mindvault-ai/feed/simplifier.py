"""
simplifier.py — The actual AI agent step.

Takes raw scraped article text and asks local Llama 3 (via ollama) to
turn it into a plain-English summary + key points, as strict JSON.

This is the ONE place in the pipeline that talks to the LLM. Everything
around it (scraping, search, image extraction) is plain code on purpose —
keeping the "agentic" part narrow and controlled makes it far easier to
debug when something looks wrong live.
"""

import json
import os
import ollama

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

# Configurable via env var so you can swap models without touching code —
# e.g. MODEL_NAME=qwen2.5:7b or MODEL_NAME=qwen2.5:1.5b if your laptop is weaker.
MODEL_NAME = os.getenv("MODEL_NAME", "qwen2.5:7b")

SYSTEM_PROMPT = (
    "You are the writing engine for MindVault, an app that helps curious learners "
    "actually understand and REMEMBER topics, not just skim them.\n\n"
    "You will receive raw, possibly messy text scraped from a real article. Your job: "
    "explain the core idea to a smart, curious student with ZERO background in this "
    "specific topic, in a way that is genuinely memorable — not just accurate.\n\n"
    "Apply these evidence-based memory principles when writing:\n"
    "1. CHUNKING: give AT MOST 3 key_points, never more. Three specific points that "
    "stick beat five generic ones that blur together.\n"
    "2. CONCRETE DETAIL: wherever possible, anchor claims to a specific number, date, "
    "name, or measurable fact. 'Agriculture began long ago' is forgettable. "
    "'Agriculture began independently in different regions about 11,500 years ago' "
    "is memorable. Always prefer the second style.\n"
    "3. EMOTIONAL HOOK: find one genuinely surprising fact, myth, or counter-intuitive "
    "detail related to the topic. Curiosity and mild surprise create stronger memories "
    "than flat information.\n"
    "4. SELF-GENERATION PROMPT: end with one short, low-effort reflective challenge "
    "that invites the reader to mentally rehearse the idea in their own words (not a "
    "quiz question with a right/wrong answer — just a nudge to self-explain).\n\n"
    "Writing rules:\n"
    "- No jargon without immediately explaining it in plain words.\n"
    "- No filler phrases like 'In today's world' or 'It is important to note that'.\n"
    "- Write like you're explaining it to a friend, not writing a textbook.\n"
    "- If the scraped text is mostly navigation menus, ads, or broken content rather "
    "than a real article, say so honestly instead of inventing facts.\n\n"
    "Output rules (critical, do not break these):\n"
    "- Respond with ONLY a valid JSON object. Nothing before it, nothing after it.\n"
    "- No markdown code fences, no ```json, no explanation of what you're doing.\n"
    "- The JSON must have exactly these keys:\n"
    '  "summary": 2-3 sentences, plain English, at least one concrete number/date/name\n'
    '  "key_points": a list of EXACTLY 3 short strings, each a distinct idea\n'
    '  "why_it_matters": ONE sentence on why a curious person should care\n'
    '  "surprising_fact": ONE sentence — the most counter-intuitive or surprising '
    "detail you found in the text\n"
    '  "try_this": ONE short sentence inviting the reader to explain the idea in '
    "their own words (e.g. \"Try explaining this to a friend in one sentence.\")\n"
    '  "tags": a list of 3-5 specific, lowercase semantic keywords or subtopic tags (e.g. ["orbital-mechanics", "rocket-propulsion", "aerospace-engineering"])\n\n'
    "Never return an error message or apology as a JSON value — if the content is "
    "thin, give your best honest attempt instead of refusing."
)


def _clean_json_response(raw: str) -> str:
    """Strips common LLM output noise (markdown fences, stray text) before parsing."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json", "", 1).strip()
    return cleaned


def simplify_text(raw_text: str, title: str = "") -> dict:
    """
    Returns {"summary": str, "key_points": list[str], "tags": list[str], ...}.
    Falls back to a safe placeholder if the model fails to return valid JSON
    or if MOCK_MODE is on (useful for fast frontend testing without waiting
    on a real LLM call every time).
    """
    if MOCK_MODE:
        return {
            "summary": f"[MOCK] A simplified explanation of '{title}' would appear here.",
            "key_points": ["Mock key point 1", "Mock key point 2", "Mock key point 3"],
            "why_it_matters": "[MOCK] This is why the topic matters.",
            "surprising_fact": "[MOCK] Here's a surprising fact about the topic.",
            "try_this": "[MOCK] Try explaining this to a friend in one sentence.",
            "tags": [title.lower().replace(" ", "-")] if title else ["general-knowledge"],
        }

    if not raw_text or len(raw_text.strip()) < 50:
        return {
            "summary": f"Not enough content was found to summarize '{title}'.",
            "key_points": [],
            "why_it_matters": "",
            "surprising_fact": "",
            "try_this": "",
            "tags": [title.lower().replace(" ", "-")] if title else ["general-knowledge"],
        }

    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Title: {title}\n\nArticle text:\n{raw_text}"},
            ],
        )
        raw_content = response["message"]["content"]
        cleaned = _clean_json_response(raw_content)
        data = json.loads(cleaned)

        # Basic shape validation — don't trust the model blindly.
        if "summary" not in data or "key_points" not in data:
            raise ValueError("Missing expected keys in model output")

        return {
            "summary": data["summary"],
            "key_points": data["key_points"] if isinstance(data["key_points"], list) else [],
            "why_it_matters": data.get("why_it_matters", ""),
            "surprising_fact": data.get("surprising_fact", ""),
            "try_this": data.get("try_this", ""),
            "tags": data.get("tags", [title.lower().replace(" ", "-")] if title else ["general-knowledge"]),
        }

    except Exception as e:
        print(f"[simplify_text] LLM call or parsing failed for '{title}': {e}")
        return {
            "summary": f"Could not generate a simplified summary for '{title}' right now.",
            "key_points": [],
            "why_it_matters": "",
            "surprising_fact": "",
            "try_this": "",
            "tags": [title.lower().replace(" ", "-")] if title else ["general-knowledge"],
        }
