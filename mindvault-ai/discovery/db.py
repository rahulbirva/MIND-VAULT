"""
db.py bridge — Exposes central MongoDB functions to discovery package.
"""
import sys
import os

FEED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "feed"))
if FEED_DIR not in sys.path:
    sys.path.insert(0, FEED_DIR)

import db as _feed_db

# Re-export all database functions and collections
from db import (
    DB_ONLINE,
    has_seen_url,
    save_post,
    get_feed_for_user,
    get_category_pool,
    save_category_pool,
    get_or_refresh_categories,
    get_discovery_pool,
    save_discovery_pool,
    get_or_refresh_discovery_pool,
    get_used_discovery_topics,
    mark_discovery_topic_used,
)

__all__ = [
    "DB_ONLINE",
    "has_seen_url",
    "save_post",
    "get_feed_for_user",
    "get_category_pool",
    "save_category_pool",
    "get_or_refresh_categories",
    "get_discovery_pool",
    "save_discovery_pool",
    "get_or_refresh_discovery_pool",
    "get_used_discovery_topics",
    "mark_discovery_topic_used",
]
