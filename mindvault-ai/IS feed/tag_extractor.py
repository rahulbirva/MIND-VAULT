"""
tag_extractor.py — Semantic Tag Extraction Engine for MindVault Feed Posts.
=============================================================================
Extracts high-signal, normalized semantic keywords and conceptual tags
from articles, summaries, and user-saved items using Qwen 2.5:7b.
"""

import json
import os
import re

try:
    import ollama
except ImportError:
    ollama = None

MODEL_NAME = os.getenv("MODEL_NAME", "qwen2.5:7b")
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with",
    "by", "about", "against", "between", "into", "through", "during", "before",
    "after", "above", "below", "from", "up", "down", "of", "off", "over", "under",
    "again", "further", "then", "once", "here", "there", "when", "where", "why",
    "how", "all", "any", "both", "each", "few", "more", "most", "other", "some",
    "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "s", "t", "can", "will", "just", "don", "should", "now", "post", "article",
    "video", "news", "today", "world", "information", "study", "new"
}

SYSTEM_PROMPT = (
    "You are a semantic tagging and taxonomy engine for an educational knowledge graph.\n"
    "Given an article title, summary, or text, extract EXACTLY 3 to 6 precise, high-signal "
    "semantic tags that capture the specific technologies, historical events, scientific laws, "
    "or intellectual subfields mentioned.\n\n"
    "Tag Rules:\n"
    "1. Format every tag as lowercase with hyphens for spaces (e.g., 'quantum-computing', 'pozzolanic-ash', 'orbital-mechanics').\n"
    "2. Be specific rather than generic: prefer 'lithography' or 'euv-lasers' over just 'tech'.\n"
    "3. No generic words like 'news', 'article', 'science', 'interesting'.\n"
    "4. Return ONLY a JSON object: {\"tags\": [\"tag-1\", \"tag-2\", \"tag-3\", ...]}\n"
    "No markdown fences, no conversational preamble."
)


def _clean_json(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json", "", 1).strip()
    return cleaned


def normalize_tag(tag: str) -> str:
    """Normalizes a raw tag string into clean slug format."""
    tag = tag.strip().lower()
    tag = re.sub(r"[^\w\s-]", "", tag)
    tag = re.sub(r"[\s_]+", "-", tag)
    tag = re.sub(r"-+", "-", tag).strip("-")
    return tag


def extract_tags_fallback(text: str, title: str = "") -> list[str]:
    """Fast regex/heuristic tag extractor when LLM is unavailable or in mock mode."""
    content = f"{title} {text}".lower()
    words = re.findall(r"\b[a-z]{3,20}\b", content)
    meaningful = [w for w in words if w not in STOP_WORDS]
    
    # Calculate word frequency
    freq = {}
    for w in meaningful:
        freq[w] = freq.get(w, 0) + 1
    
    sorted_words = sorted(freq.keys(), key=lambda w: freq[w], reverse=True)
    tags = [normalize_tag(w) for w in sorted_words[:5] if len(w) >= 4]
    if not tags and title:
        tags = [normalize_tag(w) for w in title.split() if w.lower() not in STOP_WORDS]
    return tags or ["knowledge", "deep-dive"]


def extract_semantic_tags(text: str, title: str = "") -> list[str]:
    """
    Extracts 3-6 semantic tags from text/title using Qwen 2.5:7b.
    Falls back gracefully to heuristic extractor if offline.
    """
    if MOCK_MODE or not ollama:
        return extract_tags_fallback(text, title)

    combined_input = f"Title: {title}\nContent: {text[:1200]}"
    try:
        resp = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": combined_input},
            ],
        )
        raw = resp["message"]["content"]
        cleaned = _clean_json(raw)
        data = json.loads(cleaned)
        raw_tags = data.get("tags", [])
        if isinstance(raw_tags, list) and raw_tags:
            normalized = [normalize_tag(t) for t in raw_tags if normalize_tag(t)]
            return list(dict.fromkeys(normalized))[:6]
    except Exception as e:
        print(f"[tag_extractor] LLM tag extraction warning ({e}). Using heuristic fallback.")

    return extract_tags_fallback(text, title)


def extract_tags_from_text(title: str = "", text: str = "") -> list[str]:
    """Alias function for extracting semantic tags."""
    return extract_semantic_tags(text, title=title)

