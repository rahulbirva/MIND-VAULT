"""
pipeline.py — Orchestrates the full agent flow: turns a user's raw interests
into finished, ready-to-render "posts" — like an AI account posting to a feed.

This is the file your Node backend will eventually call. Right now it just
prints/returns the result so you can see it working standalone.

Flow per article:
    expand interest to subtopic (via topic_expander / topic_cache)
        -> suggest (search web with subtopic query)
        -> scrape (get real text + og:image)
        -> simplify (Qwen 2.5 turns it into summary + key_points + why_it_matters)
        -> assemble into one "post" object
        -> save to MongoDB and mark subtopic as used

Nothing here is a loop the AI controls — it's a fixed assembly line.
That's deliberate: predictable steps, each independently testable and
each with its own failure fallback, so nothing about this looks flaky live.
"""

from article_suggester import suggest_articles_for_interest
from scraper import scrape_article
from simplifier import simplify_text
from tools import build_search_query
from db import (
    has_seen_url,
    save_post,
    get_used_subtopics,
    mark_subtopic_used,
)


def build_post(article: dict) -> dict:
    """
    Takes one article dict from the suggester and turns it into a finished
    feed post: scrape real text, get an image if one's easily available,
    simplify via the AI agent, and package it all together.
    """
    scraped = scrape_article(article["url"])

    # If scraping failed entirely, fall back to using the search snippet as
    # the "text" so simplify_text still has something to work with instead
    # of just failing silently.
    text_to_simplify = scraped["text"] or article.get("snippet", "")

    simplified = simplify_text(text_to_simplify, title=article["title"])

    return {
        "title": article["title"],
        "summary": simplified["summary"],
        "key_points": simplified["key_points"],
        "why_it_matters": simplified.get("why_it_matters", ""),
        "surprising_fact": simplified.get("surprising_fact", ""),
        "try_this": simplified.get("try_this", ""),
        "image_url": scraped["image_url"],  # None if not found — frontend handles that
        "source_url": article["url"],
        "source_domain": article["source_domain"],
        "interest": article.get("interest", ""),
        "subtopic": article.get("subtopic", ""),
    }


def generate_feed_for_user(user_id: str, interests: list[str], max_per_interest: int = 3) -> dict:
    """
    Full pipeline entry point, now backed by MongoDB and Topic Expansion.

    - Fetches used_subtopics for this user and interest.
    - Expands interest to a fresh subtopic via build_search_query(interest, used_subtopics).
    - Checks has_seen_url() before processing each article — no repeat posts.
    - Calls save_post() and mark_subtopic_used() for every new post.

    Returns posts grouped by interest:
    {
        "space": [ {title, summary, key_points, subtopic, ...}, ... ],
        "politics": [ ... ],
    }
    """
    feed = {}
    for interest in interests:
        used_subtopics = get_used_subtopics(user_id, interest)
        query, subtopic = build_search_query(interest, used_subtopics)
        print(f"[pipeline] Interest '{interest}' expanded to subtopic: '{subtopic}' (query: '{query}')")

        articles = suggest_articles_for_interest(
            interest,
            max_results=max_per_interest,
            query=query,
            subtopic=subtopic,
        )

        posts = []
        for article in articles:
            if has_seen_url(user_id, article["url"]):
                print(f"[pipeline] Skipping duplicate: {article['title']}")
                continue

            print(f"[pipeline] Processing: {article['title']}")
            post = build_post(article)
            save_post(user_id, post)
            mark_subtopic_used(user_id, interest, subtopic)
            posts.append(post)

        feed[interest] = posts

    return feed


if __name__ == "__main__":
    import json
    import sys

    # Quick manual test — run: python3 pipeline.py <user_id>
    user_id = sys.argv[1] if len(sys.argv) > 1 else "demo_user_1"
    sample_interests = ["space"]  # start with just one interest to test fast
    result = generate_feed_for_user(user_id, sample_interests, max_per_interest=1)
    print("\n=== FINAL FEED ===")
    print(json.dumps(result, indent=2, default=str))
