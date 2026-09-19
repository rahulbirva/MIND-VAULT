"""
discovery_topics.py — Picks a fresh, non-exhausted discovery topic.

Balances category distribution by first selecting among categories with unused topics,
then randomly selecting an unshown topic within that category.
"""

import os
import sys
import random

# Ensure local directories are resolvable
FEED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "feed"))
DISCOVERY_DIR = os.path.abspath(os.path.dirname(__file__))
for p in [DISCOVERY_DIR, FEED_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from db import get_or_refresh_categories, get_or_refresh_discovery_pool


def get_random_topic(exclude: set | None = None) -> str:
    """
    Selects a random topic across refreshed categories, avoiding topics in `exclude`.
    If all categories are exhausted, resets and cycles from full pools so it never crashes.
    """
    excluded = set(exclude) if exclude else set()

    # 1. Fetch live categories
    categories = get_or_refresh_categories()
    if not categories:
        categories = ["money & finance", "rights & law", "health & safety"]

    # 2. Build map of category -> available (unused) topics
    available_by_category: dict[str, list[str]] = {}
    full_pool_by_category: dict[str, list[str]] = {}

    for cat in categories:
        topics = get_or_refresh_discovery_pool(cat)
        if topics:
            full_pool_by_category[cat] = topics
            unused = [t for t in topics if t not in excluded]
            if unused:
                available_by_category[cat] = unused

    # 3. If ALL categories are exhausted, ignore the exclude set and cycle
    active_pool = available_by_category if available_by_category else full_pool_by_category

    if not active_pool:
        # Ultimate safety fallback
        return "how your credit score is actually calculated"

    # 4. Randomly pick one category, then one topic within it
    chosen_category = random.choice(list(active_pool.keys()))
    chosen_topic = random.choice(active_pool[chosen_category])

    print(f"[discovery_topics] Selected category: '{chosen_category}' -> topic: '{chosen_topic}'")
    return chosen_topic


if __name__ == "__main__":
    print("Testing get_random_topic...")
    t = get_random_topic(exclude={"how your credit score is actually calculated"})
    print("Chosen topic:", t)
