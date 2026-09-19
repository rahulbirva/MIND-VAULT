"""
simplifier.py — AI Synthesis and Simplification Agent for the IS Feed.

Transforms scraped articles into high-retention feed cards anchored
by the user's specific saved tags and interests.
"""

import json
import os
import ollama

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"
MODEL_NAME = os.getenv("MODEL_NAME", "qwen2.5:7b")

SYSTEM_PROMPT = """You are MindVault's Interest & Saved Feed Specialist AI.
Your purpose is to synthesize complex educational material into concise, high-impact learning cards tailored to learners whose previous saved articles reflect deep intellectual curiosity.

Given:
1. Article Title & Scraped Text
2. Target Subtopic & Topic Rationale
3. User's Prior Saved Tags & Preferences

Create an engaging explanation with:
- Summary: 2-3 lucid sentences with precise data/facts.
- Key Points: Exactly 3 crisp, memorable takeaways.
- Why It Matches You: 1 sentence explaining how this builds upon what the user saved before.
- Surprising Fact: 1 counter-intuitive insight.
- Try This: 1 mini self-explanation challenge.
- Tags: 3-5 specific, lowercase semantic tags (e.g., ["neural-plasticity", "cognitive-load", "spaced-repetition"]).

Output format must be strictly a single JSON object with no markdown formatting or commentary:
{
  "summary": "...",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "why_it_matches_you": "...",
  "surprising_fact": "...",
  "try_this": "...",
  "tags": ["tag-1", "tag-2", "tag-3"]
}"""


def _clean_json(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
    return cleaned


def simplify_is_article(
    raw_text: str,
    title: str,
    subtopic: str,
    rationale: str = "",
    target_tags: list[str] = None,
) -> dict:
    """
    Summarizes and tags the article content with Qwen 2.5:7b.
    """
    target_tags = target_tags or []

    if MOCK_MODE or not raw_text or len(raw_text.strip()) < 40:
        return {
            "summary": f"Exploration of {subtopic}: key mechanisms and recent practical discoveries.",
            "key_points": [
                f"Core foundations of {subtopic}",
                "Recent advancements connecting theoretical research with application",
                "Key implications for modern problem solving"
            ],
            "why_it_matches_you": f"Directly expands on your saved interest in {', '.join(target_tags[:2]) if target_tags else subtopic}.",
            "surprising_fact": f"Modern insights in {subtopic} overturn several traditional assumptions.",
            "try_this": f"Explain {subtopic} in one sentence to a non-expert.",
            "tags": target_tags if target_tags else [subtopic.lower().replace(" ", "-")],
        }

    user_prompt = f"""Title: {title}
Subtopic: {subtopic}
Topic Rationale: {rationale}
User's Saved Tags: {', '.join(target_tags)}

Article Content:
{raw_text[:4000]}"""

    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            options={"temperature": 0.3},
        )
        content = response["message"]["content"]
        cleaned = _clean_json(content)
        data = json.loads(cleaned)

        tags = data.get("tags")
        if not tags or not isinstance(tags, list):
            tags = target_tags if target_tags else [subtopic.lower().replace(" ", "-")]

        return {
            "summary": data.get("summary", ""),
            "key_points": data.get("key_points", [])[:3],
            "why_it_matches_you": data.get("why_it_matches_you", f"Relevant to your saved tags: {', '.join(target_tags[:3])}"),
            "surprising_fact": data.get("surprising_fact", ""),
            "try_this": data.get("try_this", ""),
            "tags": [t.strip().lower().replace(" ", "-") for t in tags if isinstance(t, str)],
        }
    except Exception as e:
        print(f"[IS simplifier] Qwen simplification failed: {e}")
        return {
            "summary": f"Insightful overview of {subtopic} highlighting key methodologies.",
            "key_points": [
                f"Foundational understanding of {subtopic}",
                "Interconnected concepts from recent research",
                "Practical applications and takeaways"
            ],
            "why_it_matches_you": f"Relevant to your saved items regarding {', '.join(target_tags[:2]) if target_tags else subtopic}.",
            "surprising_fact": f"Key dynamics of {subtopic} reveal subtle non-intuitive behaviors.",
            "try_this": f"What is the single most important rule behind {subtopic}?",
            "tags": target_tags if target_tags else [subtopic.lower().replace(" ", "-")],
        }
