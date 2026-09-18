"""
discovery_generator.py — Generates concrete, practical topics for a discovery category.

Each topic is generated as a specific, searchable claim or question (not vague nouns)
that can be fed directly to web search and simplified into actionable posts.
"""

import os
import json
import ollama

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"
MODEL_NAME = os.getenv("MODEL_NAME", "qwen2.5:7b")

MOCK_TOPICS = {
    "money & finance": [
        "how your credit score is actually calculated",
        "why index funds beat actively managed funds over time",
        "what happens to your debt when you die",
        "how high-yield savings accounts generate interest safely",
        "hidden fees banks charge and how to avoid them",
        "how compound interest works against you in credit card debt",
        "the difference between term and whole life insurance",
        "what tax deductions people most frequently miss",
    ],
    "rights & law": [
        "what a landlord legally cannot do when evicting you",
        "your legal rights when questioned by police during a traffic stop",
        "what constitutes wage theft in common hourly workplaces",
        "how small claims court works without hiring a lawyer",
        "what to do legally if someone steals your identity",
        "your right to repair electronics you legally own",
        "what an employer cannot legally ask during a job interview",
        "how consumer warranty protection laws enforce refunds",
    ],
    "health & safety": [
        "why antibiotics stop working if you skip doses early",
        "how to perform the Heimlich maneuver on someone choking",
        "why sleeping less than 6 hours elevates cardiovascular risk",
        "what to do immediately during a grease fire in the kitchen",
        "how to identify the early warning signs of a stroke",
        "the science behind why carbon monoxide detectors save lives",
        "why mixing bleach with other cleaning agents creates toxic gas",
        "how heat stroke differs from heat exhaustion and what to do",
    ],
}


def _clean_json_array(raw: str) -> str:
    """Strips markdown fences and whitespace to isolate a JSON array string."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    return cleaned.strip()


def _get_fallback_topics(category: str, count: int) -> list[str]:
    """Returns safe fallback topics for any category."""
    cat_lower = category.strip().lower()
    for key, topics in MOCK_TOPICS.items():
        if key in cat_lower or cat_lower in key:
            return list(topics[:count])
    return [
        f"how {category} works in practice",
        f"common mistakes people make with {category}",
        f"legal and practical rights regarding {category}",
        f"how to protect yourself when dealing with {category}",
        f"what experts wish everyone knew about {category}",
        f"surprising facts that affect decisions in {category}",
        f"how to save money or prevent loss in {category}",
        f"essential safety checklist for {category}",
    ][:count]


def generate_topics_for_category(category: str, existing_topics: list[str], count: int = 8) -> list[str]:
    """
    Generates `count` practical, searchable claim-based topics for a given category.
    Never lets an exception escape — always returns a usable list of topic strings.
    """
    if MOCK_MODE:
        return _get_fallback_topics(category, count)

    existing_str = (
        ", ".join(f"'{t}'" for t in existing_topics)
        if existing_topics
        else "None yet."
    )

    prompt = (
        f"You generate topics for the '{category}' section of a 'things everyone should actually "
        f"know' discovery feed. Each topic becomes a search query that finds a real article, which "
        f"gets simplified into a short, memorable post for a curious adult.\n\n"
        f"Every topic MUST be phrased as a specific, concrete claim or question a person could look "
        f"up and immediately use — never a vague noun phrase. \n"
        f"Good: 'how your credit score is actually calculated', 'what a landlord legally cannot do "
        f"when evicting you', 'why antibiotics stop working if you skip doses'.\n"
        f"Bad (reject): 'credit scores', 'landlord rights', 'antibiotics'.\n\n"
        f"Favor topics that are surprising, commonly misunderstood, or have a real consequence if you "
        f"don't know them — not textbook-obvious facts.\n\n"
        f"Generate {count} NEW topics for this category.\n\n"
        f"Do NOT repeat or closely rephrase any of these already-used topics:\n"
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
            valid_strings = [str(item).strip() for item in data if isinstance(item, str) and item.strip()]
            if valid_strings:
                return valid_strings

        print(f"[discovery_generator] Invalid output for category '{category}': {raw_content}. Using fallback.")
        return _get_fallback_topics(category, count)

    except Exception as e:
        print(f"[discovery_generator] Exception for category '{category}': {e}. Using fallback.")
        return _get_fallback_topics(category, count)


if __name__ == "__main__":
    print("Testing generate_topics_for_category...")
    topics = generate_topics_for_category("rights & law", existing_topics=[], count=4)
    print("Result:", topics)
