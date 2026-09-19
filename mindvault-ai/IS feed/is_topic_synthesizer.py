"""
is_topic_synthesizer.py — Interest & Saved Tag Topic Synthesizer.
===================================================================
Uses Qwen 2.5:7b to synthesize deep-dive educational topics and precise search queries
at the intersection of the user's declared interests and the tags of items they saved.
"""

import json
import os
import random

try:
    import ollama
except ImportError:
    ollama = None

MODEL_NAME = os.getenv("MODEL_NAME", "qwen2.5:7b")
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

SYSTEM_PROMPT = (
    "You are a personalized curriculum and topic synthesizer for MindVault.\n"
    "Your goal is to discover and formulate fascinating, ultra-specific subtopics "
    "that lie at the EXACT intersection of a user's declared interest and the specific "
    "topics/tags of posts they previously SAVED in their vault.\n\n"
    "Guidelines:\n"
    "1. Never give broad generic topics like 'Space' or 'Ancient Rome'.\n"
    "2. Synthesize concrete, deeply intriguing technical or historical angles inspired "
    "by the saved tags (e.g. if interest is 'Space' and saved tags are ['aerospace', 'heat-shields', 'reentry'], "
    "generate 'Ablative Thermal Protection and Plasma Aerodynamics during Atmospheric Reentry').\n"
    "3. Exclude any previously explored subtopics.\n"
    "4. Return ONLY a JSON object with these keys:\n"
    '  "subtopic": specific, fascinating subtopic title (4-8 words)\n'
    '  "search_query": clean, effective search engine query to find real authoritative articles (4-7 keywords)\n'
    '  "target_tags": list of 3-4 semantic tags for this topic\n'
    '  "curiosity_hook": one sentence explaining why this connects to what the user saved\n\n'
    "No markdown fences, no conversational preamble."
)


def _clean_json(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json", "", 1).strip()
    return cleaned


def synthesize_is_topic(
    interest: str,
    top_saved_tags: list[str],
    used_subtopics: set[str] | None = None,
) -> dict:
    """
    Synthesizes a tailored topic & search query intersecting an interest and saved tags.
    """
    used = list(used_subtopics) if used_subtopics else []

    if MOCK_MODE or not ollama:
        tag_str = "-".join(top_saved_tags[:2]) if top_saved_tags else "breakthroughs"
        return {
            "subtopic": f"Advanced {interest.title()} & {tag_str.title()}",
            "search_query": f"{interest} {tag_str.replace('-', ' ')} deep dive explanation",
            "target_tags": [interest.lower(), *top_saved_tags[:3]],
            "curiosity_hook": f"Connected to your interest in {interest} and recent saved items.",
        }

    user_prompt = (
        f"Declared Interest: {interest}\n"
        f"Tags from User's Saved Vault Posts: {', '.join(top_saved_tags) if top_saved_tags else 'None yet'}\n"
        f"Already Explored Subtopics to AVOID: {', '.join(used[-6:]) if used else 'None'}\n\n"
        "Synthesize ONE fresh, captivating subtopic specifically tailored to this user's demonstrated curiosity."
    )

    try:
        resp = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )
        raw = resp["message"]["content"]
        cleaned = _clean_json(raw)
        data = json.loads(cleaned)

        if "subtopic" in data and "search_query" in data:
            return {
                "subtopic": data["subtopic"],
                "search_query": data["search_query"],
                "target_tags": data.get("target_tags", [interest.lower()]),
                "curiosity_hook": data.get("curiosity_hook", ""),
            }
    except Exception as e:
        print(f"[is_topic_synthesizer] Synthesizer warning ({e}). Using fallback.")

    tag_str = " ".join([t.replace("-", " ") for t in top_saved_tags[:2]]) if top_saved_tags else "innovations"
    return {
        "subtopic": f"Pioneering Frontiers in {interest.title()}: {tag_str.title()}",
        "search_query": f"{interest} {tag_str} breakthrough mechanisms explained",
        "target_tags": [interest.lower(), *top_saved_tags[:3]],
        "curiosity_hook": f"Deepening your exploration of {interest}.",
    }


BATCH_SYSTEM_PROMPT = (
    "You are a personalized curriculum and topic synthesizer for MindVault.\n"
    "Your goal is to formulate fascinating, ultra-specific subtopics that lie at the EXACT "
    "intersection of a user's declared interests and their previously SAVED tags in MongoDB.\n\n"
    "Output Rules:\n"
    "- Return ONLY a valid JSON array of objects.\n"
    "- Each object must have keys: 'subtopic' (string, 4-8 words), 'search_query' (string, 4-6 keywords), "
    "'target_tags' (list of 3-4 strings), 'curiosity_hook' (string, why this matches their saved tags).\n"
    "- No markdown, no commentary."
)


def synthesize_is_topics(
    interests: list[str],
    top_saved_tags: list[str],
    count: int = 6,
    used_subtopics: set[str] | None = None,
) -> list[dict]:
    """
    Synthesizes multiple deep-dive topic plans for a list of interests and saved tags in one fast LLM pass.
    """
    if not interests:
        interests = ["Technology", "Science", "Space"]

    used = list(used_subtopics) if used_subtopics else []

    if not MOCK_MODE and ollama:
        user_prompt = (
            f"Generate {count} unique subtopics.\n"
            f"Declared Interests: {', '.join(interests)}\n"
            f"Top Saved Tags from User Vault: {', '.join(top_saved_tags) if top_saved_tags else 'None'}\n"
            f"Avoid These Explored Subtopics: {', '.join(used[-8:]) if used else 'None'}\n"
        )
        try:
            resp = ollama.chat(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": BATCH_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                options={"temperature": 0.4},
            )
            raw = resp["message"]["content"]
            cleaned = _clean_json(raw)
            data = json.loads(cleaned)
            if isinstance(data, list) and len(data) > 0:
                plans = []
                for idx, item in enumerate(data[:count]):
                    sub = item.get("subtopic", f"{interests[idx % len(interests)]} Focus {idx+1}")
                    plans.append({
                        "subtopic": sub,
                        "search_query": item.get("search_query") or f"{sub} explained",
                        "rationale": item.get("curiosity_hook", f"Connecting your saved items to {sub}"),
                        "target_tags": item.get("target_tags", [interests[idx % len(interests)].lower()]),
                        "affinity_score": round(max(0.65, 0.95 - (idx * 0.05)), 2),
                    })
                if len(plans) >= count:
                    return plans
        except Exception as e:
            print(f"[is_topic_synthesizer] Batch synthesis notice: {e}. Falling back to iterative synthesis.")

    # Fallback / heuristic construction
    plans = []
    for idx in range(count):
        interest = interests[idx % len(interests)]
        start_tag_idx = (idx * 2) % max(1, len(top_saved_tags))
        relevant_tags = top_saved_tags[start_tag_idx:start_tag_idx + 2] if top_saved_tags else ["breakthroughs"]
        tag_phrase = " ".join([t.replace("-", " ") for t in relevant_tags])
        sub = f"Pioneering Frontiers in {interest.title()}: {tag_phrase.title()}"
        plans.append({
            "subtopic": sub,
            "search_query": f"{interest} {tag_phrase} mechanisms explained",
            "rationale": f"Directly deepens your saved interest in {tag_phrase}.",
            "target_tags": [interest.lower(), *relevant_tags],
            "affinity_score": round(max(0.65, 0.95 - (idx * 0.05)), 2),
        })

    return plans


