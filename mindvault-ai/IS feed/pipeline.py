"""
pipeline.py — Orchestrates the Interest & Saved (IS) Feed AI Agent pipeline.

Generates hyper-personalized educational feed posts from user saved items & tags,
and synthesizes blended feeds respecting the 40% Standard / 60% IS Feed ratio.
"""

import sys
import os
from pathlib import Path

# Add current and sibling feed directory to path for smooth interoperability
current_dir = Path(__file__).resolve().parent
feed_dir = current_dir.parent / "feed"

# Ensure IS feed directory is strictly first in sys.path
if str(current_dir) in sys.path:
    sys.path.remove(str(current_dir))
sys.path.insert(0, str(current_dir))

if str(feed_dir) not in sys.path:
    sys.path.append(str(feed_dir))

from saved_analyzer import analyze_user_saved_interests
from is_topic_synthesizer import synthesize_is_topics
from article_suggester import suggest_articles_for_topic
from scraper import scrape_article
from simplifier import simplify_is_article
from db import (
    save_is_post,
    is_seen_url,
    mark_is_subtopic_used,
    get_user_is_posts,
    get_user_info,
)

# Also import standard feed pipeline if available
try:
    import pipeline as standard_pipeline_module
except ImportError:
    standard_pipeline_module = None


def generate_is_feed_for_user(user_id: str, count: int = 6) -> list[dict]:
    """
    Core IS Feed generation pipeline:
    1. Analyzes user saved items from MongoDB and extracts weighted semantic tags.
    2. Uses Qwen 2.5:7b to synthesize deep-dive topics at the intersection of
       declared interests and saved tags.
    3. Finds authoritative articles for each topic.
    4. Scrapes content and summarizes using Qwen 2.5 with personalized reasoning.
    5. Saves to MongoDB (`is_feed_posts`) and returns post cards.
    """
    print(f"\n[IS Pipeline] Starting generation for user: {user_id} (requested count: {count})")
    profile = analyze_user_saved_interests(user_id)
    interests = profile.get("declared_interests", ["AI", "Technology", "Science"])
    top_tags = profile.get("top_tags", [])
    affinity_map = profile.get("affinity_map", {})

    print(f"[IS Pipeline] User interests: {interests}")
    print(f"[IS Pipeline] Top saved tags detected: {top_tags}")

    # Synthesize topic plans
    topic_plans = synthesize_is_topics(interests, top_tags, count=count)
    generated_posts = []

    for idx, plan in enumerate(topic_plans):
        subtopic = plan.get("subtopic", f"Topic {idx+1}")
        rationale = plan.get("rationale", "")
        target_tags = plan.get("target_tags", [])
        affinity_score = plan.get("affinity_score", 0.85)

        print(f"[IS Pipeline] Processing synthesized topic ({idx+1}/{len(topic_plans)}): '{subtopic}'")
        articles = suggest_articles_for_topic(plan, max_results=2)

        selected_article = None
        for art in articles:
            url = art.get("url", "")
            if not is_seen_url(user_id, url):
                selected_article = art
                break

        if not selected_article and articles:
            selected_article = articles[0]

        if not selected_article:
            continue

        url = selected_article.get("url", "")
        title = selected_article.get("title", subtopic)
        scraped = scrape_article(url) if url.startswith("http") else {"text": "", "image_url": None}
        raw_text = scraped.get("text") or selected_article.get("snippet", "")

        simplified = simplify_is_article(
            raw_text=raw_text,
            title=title,
            subtopic=subtopic,
            rationale=rationale,
            target_tags=target_tags,
        )

        post = {
            "title": title,
            "subtopic": subtopic,
            "summary": simplified["summary"],
            "key_points": simplified["key_points"],
            "why_it_matches_you": simplified.get("why_it_matches_you", rationale),
            "surprising_fact": simplified.get("surprising_fact", ""),
            "try_this": simplified.get("try_this", ""),
            "image_url": scraped.get("image_url"),
            "source_url": url,
            "source_domain": selected_article.get("source_domain", "mindvault.ai"),
            "tags": simplified.get("tags") or target_tags,
            "affinity_score": affinity_score,
            "source_agent": "is_feed",
            "source_type": "is_personalized",
            "agent_badge": "IS Feed AI Agent (Personalized)",
        }

        save_is_post(user_id, post)
        mark_is_subtopic_used(user_id, subtopic)
        generated_posts.append(post)

        if len(generated_posts) >= count:
            break

    return generated_posts


def generate_blended_feed(
    user_id: str,
    total_posts: int = 10,
    standard_ratio: float = 0.4,
    is_ratio: float = 0.6,
) -> dict:
    """
    Produces a blended feed with:
    - 40% items from the Standard Discovery Feed Agent (broad exploration)
    - 60% items from the IS Feed Agent (deep personalization based on saved tags)
    """
    total = max(1, total_posts)
    standard_count = int(round(total * standard_ratio))
    is_count = total - standard_count

    print(f"\n==========================================")
    print(f"[Blended Feed] Generating {total} total posts for {user_id}:")
    print(f"  -> {standard_count} Standard Feed Posts ({int(standard_ratio*100)}%)")
    print(f"  -> {is_count} IS Feed Posts ({int(is_ratio*100)}%)")
    print(f"==========================================")

    # 1. Fetch user interests
    user_info = get_user_info(user_id)
    interests = user_info.get("interests", ["technology", "space", "history", "neuroscience"])
    if not interests:
        interests = ["technology", "science"]

    # 2. Generate IS feed posts
    is_posts = generate_is_feed_for_user(user_id, count=is_count)

    # 3. Generate Standard feed posts
    standard_posts = []
    try:
        if standard_pipeline_module and hasattr(standard_pipeline_module, "generate_feed_for_user"):
            raw_standard_feed = standard_pipeline_module.generate_feed_for_user(
                user_id,
                interests,
                max_per_interest=max(1, (standard_count + len(interests) - 1) // len(interests)),
            )
            for topic, p_list in raw_standard_feed.items():
                for p in p_list:
                    p["source_agent"] = "standard_feed"
                    p["source_type"] = "standard_discovery"
                    p["agent_badge"] = "Discovery Feed Agent (Broad)"
                    standard_posts.append(p)
                    if len(standard_posts) >= standard_count:
                        break
                if len(standard_posts) >= standard_count:
                    break
    except Exception as e:
        print(f"[Blended Feed] Standard feed generation notice: {e}")

    # Fallback standard posts if needed
    while len(standard_posts) < standard_count:
        mock_idx = len(standard_posts) + 1
        standard_posts.append({
            "title": f"Key Developments in {interests[mock_idx % len(interests)].capitalize()}",
            "subtopic": f"General {interests[mock_idx % len(interests)].capitalize()}",
            "summary": f"A broad perspective overview exploring fundamental principles of {interests[mock_idx % len(interests)]}.",
            "key_points": ["Core framework", "Historical context", "Future trajectory"],
            "why_it_matters": "Broad foundational literacy.",
            "surprising_fact": "Surprising patterns emerge across foundational paradigms.",
            "try_this": "Connect this concept to something you encountered recently.",
            "image_url": None,
            "source_url": "https://mindvault.ai/discovery",
            "source_domain": "mindvault.ai",
            "tags": [interests[mock_idx % len(interests)].lower(), "discovery"],
            "source_agent": "standard_feed",
            "source_type": "standard_discovery",
            "agent_badge": "Discovery Feed Agent (Broad)",
        })

    # 4. Interleave posts to match 40/60 distribution naturally throughout the scroll
    blended = []
    is_idx = 0
    std_idx = 0

    # Pattern: IS, Standard, IS, IS, Standard, IS, Standard, IS...
    while is_idx < len(is_posts) or std_idx < len(standard_posts):
        # Add 1-2 IS posts
        for _ in range(2):
            if is_idx < len(is_posts):
                blended.append(is_posts[is_idx])
                is_idx += 1
        # Add 1 Standard post
        if std_idx < len(standard_posts):
            blended.append(standard_posts[std_idx])
            std_idx += 1

    # Truncate to exact requested total if needed
    blended = blended[:total]

    stats = {
        "total_posts": len(blended),
        "is_posts_count": sum(1 for p in blended if p.get("source_agent") == "is_feed"),
        "standard_posts_count": sum(1 for p in blended if p.get("source_agent") == "standard_feed"),
        "is_percentage": f"{round((sum(1 for p in blended if p.get('source_agent') == 'is_feed') / max(1, len(blended))) * 100, 1)}%",
        "standard_percentage": f"{round((sum(1 for p in blended if p.get('source_agent') == 'standard_feed') / max(1, len(blended))) * 100, 1)}%",
    }

    return {
        "user_id": user_id,
        "stats": stats,
        "feed": blended,
    }


if __name__ == "__main__":
    import json
    uid = sys.argv[1] if len(sys.argv) > 1 else "demo_user_1"
    res = generate_blended_feed(uid, total_posts=10, standard_ratio=0.4, is_ratio=0.6)
    print("\n=== BLENDED FEED RESULT (40% Standard / 60% IS) ===")
    print(json.dumps(res["stats"], indent=2))
    print(f"Total returned posts: {len(res['feed'])}")
    for i, p in enumerate(res["feed"]):
        print(f"[{i+1}] {p['agent_badge']} -> {p['title']} | Tags: {p.get('tags', [])}")
