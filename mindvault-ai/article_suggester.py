"""
article_suggester.py — Feature 1's entry point: Interest-Based Article Suggestion.

This is the function your Node backend (or a test script) calls.
Input: list of user interests (from MongoDB, eventually).
Output: list of article suggestions per interest, ready to be simplified
        in the next stage (simplifier.py) or saved as-is.

MOCK_MODE is controlled by an environment variable so you can flip it
instantly during the live demo without touching code.
"""

import os
from tools import search_web, build_search_query, dedupe_by_domain
from mock_data import get_mock_articles
from db import get_used_subtopics

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"


def suggest_articles_for_interest(
    interest: str,
    max_results: int = 3,
    query: str | None = None,
    subtopic: str | None = None,
    used_subtopics: set[str] | None = None,
) -> list[dict]:
    """
    Returns a list of article suggestion dicts for a single interest.
    If query/subtopic are not supplied, calls build_search_query(interest, used_subtopics).
    Falls back to mock data automatically if live search returns nothing
    (covers both MOCK_MODE=true and silent live-search failures).
    """
    if not query or not subtopic:
        query, subtopic = build_search_query(interest, used_subtopics)

    if MOCK_MODE:
        results = [dict(r) for r in get_mock_articles(interest)[:max_results]]
        for r in results:
            r["interest"] = interest
            r["subtopic"] = subtopic
        return results

    results = search_web(query, max_results=max_results * 2)  # over-fetch, then dedupe
    results = dedupe_by_domain(results, max_per_domain=1)[:max_results]

    if not results:
        # Live search failed or returned nothing — demo-safety fallback.
        print(f"[suggest_articles_for_interest] No live results for '{interest}' (query: '{query}'), using mock fallback.")
        results = [dict(r) for r in get_mock_articles(interest)[:max_results]]
        for r in results:
            r["interest"] = interest
            r["subtopic"] = subtopic
        return results

    # Tag each result with which interest and subtopic it came from — useful once this
    # gets saved to MongoDB and shown in a feed grouped by interest.
    for r in results:
        r["interest"] = interest
        r["subtopic"] = subtopic

    return results


def suggest_articles_for_user(
    interests: list[str],
    max_per_interest: int = 3,
    user_id: str | None = None,
) -> dict:
    """
    Takes a user's full interest list and returns suggestions grouped by interest.
    Rotates through subtopics by checking used_subtopics per user.
    """
    feed = {}
    for interest in interests:
        used = get_used_subtopics(user_id, interest) if user_id else set()
        query, subtopic = build_search_query(interest, used)
        feed[interest] = suggest_articles_for_interest(
            interest,
            max_results=max_per_interest,
            query=query,
            subtopic=subtopic,
        )
    return feed


if __name__ == "__main__":
    # Quick manual test — run: python3 article_suggester.py
    import json

    sample_interests = ["space", "politics", "history"]
    result = suggest_articles_for_user(sample_interests, user_id="demo_user_1")
    print(json.dumps(result, indent=2))
