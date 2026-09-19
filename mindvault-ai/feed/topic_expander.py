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

    if MOCK_MODE:
        if interest_key in MOCK_SUBTOPICS:
            return list(MOCK_SUBTOPICS[interest_key])
        return [
            f"{clean_interest} basics",
            f"{clean_interest} history",
            f"{clean_interest} innovations",
            f"{clean_interest} discoveries",
            f"{clean_interest} key concepts",
            f"{clean_interest} future trends",
            f"{clean_interest} challenges",
            f"{clean_interest} global impact",
        ]

    system_prompt = (
        "You are an educational curriculum designer and topic analyzer. "
        "Given a broad user interest topic, generate a JSON array of 8 to 10 "
        "distinct, specific, and engaging subtopics suitable for beginner-friendly learning articles.\n\n"
        "Rules:\n"
        "- Respond with ONLY a valid JSON array of strings (e.g. [\"subtopic 1\", \"subtopic 2\"]).\n"
        "- No markdown fences, no ```json, no preamble, and no postamble.\n"
        "- Each subtopic must be a concrete concept, technology, discovery, or historical facet.\n"
        "- Keep each string 2 to 4 words long."
    )

    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Broad interest: {clean_interest}"},
            ],
        )
        raw_content = response["message"]["content"]
        cleaned = _clean_json_array(raw_content)
        data = json.loads(cleaned)

        if isinstance(data, list) and len(data) > 0:
            subtopics = [str(item).strip() for item in data if str(item).strip()]
            if subtopics:
                return subtopics

        raise ValueError("Model did not return a non-empty list of strings")

    except Exception as e:
        print(f"[topic_expander] LLM call or parsing failed for '{interest}': {e}. Using fallback.")
        return [
            clean_interest,
            f"{clean_interest} basics",
            f"{clean_interest} history",
            f"{clean_interest} facts",
            f"{clean_interest} future",
            f"{clean_interest} science",
            f"{clean_interest} discoveries",
            f"{clean_interest} applications",
        ]


if __name__ == "__main__":
    import sys
    test_topic = sys.argv[1] if len(sys.argv) > 1 else "space"
    results = expand_interest(test_topic)
    print(f"Expanded '{test_topic}' into {len(results)} subtopics:")
    for i, sub in enumerate(results, 1):
        print(f"  {i}. {sub}")
