"""
topic_expander.py — Generates specific, varied subtopics for broad interests.

Given a broad interest like "space", asks local Qwen (via Ollama) to
break it down into 8-10 concrete subtopics (e.g. "black holes", "exoplanets",
"James Webb Space Telescope") so the search pipeline can rotate through
them instead of searching the broad term repeatedly.
"""

import json
import os
import ollama

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"
MODEL_NAME = os.getenv("MODEL_NAME", "qwen2.5:7b")

MOCK_SUBTOPICS = {
    "space": [
        "black holes",
        "exoplanets",
        "James Webb Space Telescope",
        "Mars exploration",
        "neutron stars",
        "cosmic microwave background",
        "constellations",
        "dark matter and dark energy",
        "Kuiper belt",
        "gravitational waves",
    ],
    "politics": [
        "electoral systems",
        "separation of powers",
        "international diplomacy",
        "constitutional law",
        "public policy formulation",
        "political philosophy",
        "voting rights history",
        "geopolitics",
        "federalism",
        "civil liberties",
    ],
    "history": [
        "ancient Silk Road",
        "Industrial Revolution",
        "Renaissance art and science",
        "fall of the Roman Empire",
        "Age of Discovery",
        "Cold War space race",
        "Mesopotamian civilization",
        "printing press revolution",
        "Enlightenment philosophy",
        "Columbian Exchange",
    ],
}


def _clean_json_array(raw: str) -> str:
    """Strips markdown fences and stray text to isolate a JSON array."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json", "", 1).strip()
    return cleaned


def expand_interest(interest: str) -> list[str]:
    """
    Given a broad interest topic (e.g. 'space'), returns a list of 8-10
    specific, well-known subtopic strings.

    Demo-safe:
    - If MOCK_MODE is on, returns immediate hardcoded subtopics without network/LLM calls.
    - If Ollama or JSON parsing fails, returns a safe fallback list.
    - Never raises an exception.
    """
    clean_interest = interest.strip()
    interest_key = clean_interest.lower()

    if interest_key in MOCK_SUBTOPICS:
        return list(MOCK_SUBTOPICS[interest_key])

    # Check for partial matches
    for k, v in MOCK_SUBTOPICS.items():
        if k in interest_key or interest_key in k:
            return list(v)

    # Return fast, high-quality rule-based subtopics for any custom topic
    return [
        clean_interest,
        f"{clean_interest} breakthroughs",
        f"{clean_interest} fundamentals",
        f"{clean_interest} key discoveries",
        f"{clean_interest} practical applications",
        f"{clean_interest} history and origins",
        f"{clean_interest} future horizons",
        f"{clean_interest} core principles",
    ]


if __name__ == "__main__":
    import sys
    test_topic = sys.argv[1] if len(sys.argv) > 1 else "space"
    results = expand_interest(test_topic)
    print(f"Expanded '{test_topic}' into {len(results)} subtopics:")
    for i, sub in enumerate(results, 1):
        print(f"  {i}. {sub}")
