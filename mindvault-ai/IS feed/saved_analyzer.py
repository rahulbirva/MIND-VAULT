"""
saved_analyzer.py — User Saved Items & Tag Affinity Analyzer.
===============================================================
Analyzes posts saved by the user from their feed, aggregates their tags with
frequency weights, and constructs a personalized "Interest & Saved" (IS) knowledge profile.
"""

import os
import sys
from pathlib import Path

_current_dir = str(Path(__file__).resolve().parent)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)

from db import (
    get_user_saved_items,
    get_user_interests,
    save_user_tag_affinity,
    get_user_tag_affinity,
)
from tag_extractor import extract_semantic_tags, normalize_tag


def analyze_user_saved_interests(user_id: str) -> dict:
    """Alias for build_user_is_profile."""
    return build_user_is_profile(user_id)


def build_user_is_profile(user_id: str) -> dict:
    """
    Constructs a comprehensive interest and saved profile for a user:
    - Declared interests (from user profile)
    - Saved post count & topics
    - Weighted tag affinity map (frequency-weighted based on what they saved)
    - Top 8 high-signal affinity tags
    """
    declared_interests = get_user_interests(user_id)
    saved_items = get_user_saved_items(user_id, limit=50)

    tag_counts: dict[str, int] = {}
    saved_topics: dict[str, int] = {}

    for item in saved_items:
        topic = item.get("topic") or item.get("interest") or "General"
        saved_topics[topic] = saved_topics.get(topic, 0) + 1

        # Extract or read existing tags
        item_tags = item.get("tags") or []
        if not item_tags or not isinstance(item_tags, list):
            # Extract tags dynamically if not stored
            title = item.get("title") or ""
            body = item.get("body") or item.get("summary") or ""
            item_tags = extract_semantic_tags(body, title)

        for tag in item_tags:
            clean_t = normalize_tag(str(tag))
            if clean_t:
                # Saved item tags get +2 weight
                tag_counts[clean_t] = tag_counts.get(clean_t, 0) + 2

    # Also seed declared interests into the tag map with +1 base weight
    for interest in declared_interests:
        clean_int = normalize_tag(interest)
        if clean_int:
            tag_counts[clean_int] = tag_counts.get(clean_int, 0) + 1

    # Persist updated tag weights to MongoDB
    if tag_counts:
        save_user_tag_affinity(user_id, tag_counts)

    # Sort tags by weight descending
    sorted_tags = sorted(tag_counts.items(), key=lambda kv: kv[1], reverse=True)
    top_tags = [tag for tag, weight in sorted_tags[:8]]

    # If user has no saved items yet, derive initial tags from declared interests
    if not top_tags and declared_interests:
        for i in declared_interests:
            top_tags.append(normalize_tag(i))

    return {
        "user_id": user_id,
        "declared_interests": declared_interests,
        "saved_count": len(saved_items),
        "saved_topics": saved_topics,
        "tag_affinity": tag_counts,
        "top_tags": top_tags,
    }
