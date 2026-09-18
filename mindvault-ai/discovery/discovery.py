"""
discovery.py — Main Proactive Discovery Engine.

Surfaces practically useful, real-world knowledge (laws, rights, finances, health)
by reusing the core search -> scrape -> simplify -> assemble pipeline with dynamic
AI-generated topic pools.
"""

import os
import sys

# Ensure local directories are resolvable
FEED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "feed"))
DISCOVERY_DIR = os.path.abspath(os.path.dirname(__file__))
for p in [DISCOVERY_DIR, FEED_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from db import (
    has_seen_url,
    save_post,
    get_used_discovery_topics,
    mark_discovery_topic_used,
)
from article_suggester import suggest_articles_for_interest
from scraper import scrape_article
from simplifier import simplify_text
from discovery_topics import get_random_topic


def generate_daily_discovery_post(user_id: str, max_attempts: int = 3) -> dict | None:
    """
    Assembles a single high-value discovery post for a user.
    - Picks an unshown practical topic across dynamic categories.
    - Queries search -> deduplicates seen URLs -> scrapes -> simplifies via LLM.
    - Persists with save_post(user_id, post) and marks topic used.
    - Never crashes: loops up to max_attempts on any failure, returns None if exhausted.
    """
    try:
        used_topics = get_used_discovery_topics(user_id)
    except Exception as e:
        print(f"[discovery] Error getting used topics ({e}), continuing with empty set.")
        used_topics = set()

    for attempt in range(1, max_attempts + 1):
        try:
            # 1. Pick a fresh topic
            topic = get_random_topic(exclude=used_topics)
            print(f"[discovery] Attempt {attempt}/{max_attempts} with topic: '{topic}'")

            # 2. Search for candidate articles using real article_suggester signature
            articles = suggest_articles_for_interest(
                interest=topic,
                max_results=3,
                query=topic,
                subtopic=topic,
            )

            if not articles:
                print(f"[discovery] No articles found for '{topic}', retrying next attempt.")
                continue

            # 3. Find first workable candidate not yet seen by user
            for article in articles:
                url = article.get("url")
                if not url:
                    continue

                try:
                    if has_seen_url(user_id, url):
                        print(f"[discovery] Skipping duplicate URL for user: {url}")
                        continue
                except Exception as e:
                    print(f"[discovery] Duplicate check warning: {e}")

                # 4. Scrape real article content
                print(f"[discovery] Scraping article: {article.get('title', url)}")
                scraped = scrape_article(url)

                text = scraped.get("text") or article.get("snippet", "")
                if not text or len(text.strip()) < 50:
                    print(f"[discovery] Insufficient text ({len(text.strip())} chars) for {url}, skipping candidate.")
                    continue

                # 5. Simplify via LLM (5 fields: summary, key_points, why_it_matters, surprising_fact, try_this)
                title = article.get("title", topic)
                print(f"[discovery] Simplifying content for '{title}'...")
                cleaned_text = text[:3000] if len(text) > 3000 else text
                simplified = simplify_text(cleaned_text, title=title)

                # 6. Assemble standardized post dict
                post = {
                    "user_id": user_id,
                    "title": title,
                    "source_url": url,
                    "source_domain": article.get("source_domain", ""),
                    "image_url": scraped.get("image_url"),
                    "topic": topic,
                    "source": "discovery",
                    "summary": simplified.get("summary", ""),
                    "key_points": simplified.get("key_points", []),
                    "why_it_matters": simplified.get("why_it_matters", ""),
                    "surprising_fact": simplified.get("surprising_fact", ""),
                    "try_this": simplified.get("try_this", ""),
                }

                # 7. Persist and mark topic used
                save_post(user_id, post)
                mark_discovery_topic_used(user_id, topic)
                print(f"[discovery] Successfully created discovery post: '{title}'!")
                return post

        except Exception as err:
            print(f"[discovery] Attempt {attempt} failed with exception: {err}. Retrying next attempt...")
            continue

    print(f"[discovery] All {max_attempts} attempts failed to generate a discovery post.")
    return None


if __name__ == "__main__":
    import json
    print("Testing generate_daily_discovery_post...")
    res = generate_daily_discovery_post(user_id="test_discovery_user")
    if res:
        print("\n=== GENERATED DISCOVERY POST ===")
        print(json.dumps(res, indent=2, default=str))
    else:
        print("Could not generate discovery post.")
