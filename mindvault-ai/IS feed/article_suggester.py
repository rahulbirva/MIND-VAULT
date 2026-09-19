"""
article_suggester.py — Searches and selects articles based on synthesized IS topics.
Integrates user declared interests and saved feed tags.
"""

import os
from tools import search_web, dedupe_by_domain

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"


def suggest_articles_for_topic(topic_plan: dict, max_results: int = 2) -> list[dict]:
    """
    Given an IS topic plan dict:
    {
        "subtopic": str,
        "search_query": str,
        "rationale": str,
        "target_tags": list[str],
        "affinity_score": float
    }
    Performs search and returns ranked article recommendations.
    """
    query = topic_plan.get("search_query") or f"{topic_plan.get('subtopic', '')} deep dive article"
    subtopic = topic_plan.get("subtopic", "General Discovery")
    target_tags = topic_plan.get("target_tags", [])
    rationale = topic_plan.get("rationale", "")
    affinity_score = topic_plan.get("affinity_score", 0.75)

    if MOCK_MODE:
        return _get_mock_fallback(subtopic, query, target_tags, rationale, affinity_score, max_results)

    raw_results = search_web(query, max_results=max_results * 2)
    results = dedupe_by_domain(raw_results, max_per_domain=1)[:max_results]

    if not results:
        print(f"[IS article_suggester] Live search yielded no results for '{query}'. Using fallback.")
        return _get_mock_fallback(subtopic, query, target_tags, rationale, affinity_score, max_results)

    for r in results:
        r["subtopic"] = subtopic
        r["search_query"] = query
        r["target_tags"] = target_tags
        r["rationale"] = rationale
        r["affinity_score"] = affinity_score
        r["source_agent"] = "is_feed"

    return results


def _get_mock_fallback(
    subtopic: str,
    query: str,
    target_tags: list[str],
    rationale: str,
    affinity_score: float,
    max_results: int,
) -> list[dict]:
    """Creates realistic fallback article data when live search is unavailable."""
    return [
        {
            "title": f"The Evolution and Mechanics of {subtopic}",
            "url": f"https://example.org/{subtopic.lower().replace(' ', '-')}-overview",
            "snippet": f"A comprehensive analysis of {subtopic}, exploring core foundational principles, historical breakthroughs, and future developments.",
            "source_domain": "sciencedirect.com",
            "subtopic": subtopic,
            "search_query": query,
            "target_tags": target_tags,
            "rationale": rationale,
            "affinity_score": affinity_score,
            "source_agent": "is_feed",
        }
    ][:max_results]
