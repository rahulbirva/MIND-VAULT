"""
category_generator.py — Dynamically generates practical, real-world discovery categories.

Generates categories for a 'things everyone should actually know' discovery feed,
aimed at actionable knowledge (money, legal rights, health, safety, civic knowledge)
rather than abstract trivia.
"""

import os
import json
import ollama

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"
MODEL_NAME = os.getenv("MODEL_NAME", "qwen2.5:7b")

SEED_CATEGORIES = ["money & finance", "rights & law", "health & safety"]


def _clean_json_array(raw: str) -> str:
    """Strips markdown fences and extra whitespace to isolate a JSON array string."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    return cleaned.strip()


def generate_categories(existing_categories: list[str], count: int = 5) -> list[str]:
    """
    Generates `count` new, practical categories using local Ollama.
    Never lets an exception escape — returns a safe seed list fallback on any error.
    """
    if MOCK_MODE:
        return list(SEED_CATEGORIES)

    existing_str = (
        ", ".join(f"'{c}'" for c in existing_categories)
        if existing_categories
        else "None yet."
    )

    prompt = (
        f"You design categories for a 'things everyone should actually know' discovery feed aimed "
        f"at a curious adult. The bar for every category: would a smart friend say 'wait, I didn't "
        f"know that was a whole area I could learn about' — and would knowing it change a real "
        f"decision they make (money, health, legal, safety, civic)? \n\n"
        f"Reject anything abstract, academic, or trivia-flavored (no 'space facts', no 'history "
        f"mysteries', no 'fun science'). Every category must map to knowledge someone uses in real "
        f"life this year — not knowledge that's merely interesting.\n\n"
        f"Good examples: 'money & finance', 'rights & law', 'health & safety', 'consumer protection', "
        f"'civic knowledge', 'workplace rights'.\n"
        f"Bad examples (reject these): 'space facts', 'fun history', 'science trivia', 'random facts'.\n\n"
        f"Generate {count} NEW category names (2-4 words each), each covering a genuinely distinct "
        f"area — no two categories should overlap in what they'd actually teach.\n\n"
        f"Do NOT repeat or closely rephrase any of these existing categories:\n"
        f"{existing_str}\n\n"
        f"Return ONLY a JSON array of {count} strings. No markdown fences, no preamble, no explanation."
    )

    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_content = response.get("message", {}).get("content", "")
        cleaned = _clean_json_array(raw_content)
        data = json.loads(cleaned)

        if isinstance(data, list) and len(data) > 0:
            valid_strings = [str(item).strip().lower() for item in data if isinstance(item, str) and item.strip()]
            if valid_strings:
                return valid_strings

        print(f"[category_generator] Model returned invalid format: {raw_content}. Falling back to seed list.")
        return list(SEED_CATEGORIES)

    except Exception as e:
        print(f"[category_generator] Exception during category generation: {e}. Falling back to seed list.")
        return list(SEED_CATEGORIES)


if __name__ == "__main__":
    print("Testing generate_categories...")
    cats = generate_categories(existing_categories=["money & finance"], count=3)
    print("Result:", cats)
