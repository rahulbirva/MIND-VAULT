"""
db.py — All MongoDB access lives here. Nothing else in the project should
import pymongo directly — everything goes through these functions.

Why this matters: if Mongo isn't reachable during the demo (wrong URI,
Atlas network issue, etc.), you only need to fix/mock ONE file, not
hunt through every module that touches the database.

Collections:
  users          — { user_id, interests: [str] }
  posts          — { user_id, interest, title, summary, key_points, image_url,
                     source_url, source_domain, created_at }
  topic_cache    — { interest, subtopics: [str], created_at }
  subtopic_state — { user_id, interest, used_subtopics: [str] }

We use `source_url` as the natural duplicate-check key: if a post with
that URL already exists for this user, we've shown it before.
"""

import os
import sys
import time
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import certifi
load_dotenv(override=True)  # reads .env in this folder, with override

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "mindvault")

DB_ONLINE = False
_client = None
db = None
users_col = None
posts_col = None
topic_cache_col = None
subtopic_state_col = None
category_pool_col = None
discovery_pool_col = None
discovery_state_col = None

# In-memory mock storage fallback
_mock_users: dict[str, list[str]] = {}
_mock_posts: list[dict] = []
_mock_topic_cache: dict[str, list[str]] = {}
_mock_subtopic_state: dict[tuple[str, str], set[str]] = {}
_mock_category_pool: dict = {"categories": [], "updated_at": 0}
_mock_discovery_pool: dict[str, dict] = {}
_mock_discovery_state: dict[str, set[str]] = {}

for _attempt in range(3):
    try:
        _client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000)
        # Ping to check if server is reachable immediately
        _client.admin.command("ping")
        db = _client[DB_NAME]
        users_col = db["users"]
        posts_col = db["posts"]
        topic_cache_col = db["topic_cache"]
        subtopic_state_col = db["subtopic_state"]
        category_pool_col = db["category_pool"]
        discovery_pool_col = db["discovery_pool"]
        discovery_state_col = db["discovery_state"]
        DB_ONLINE = True
        print("[db] Connected successfully to MongoDB Atlas.")
        break
    except Exception as e:
        if _attempt < 2:
            time.sleep(1)
            continue
        DB_ONLINE = False
        print(f"[db] ⚠️ Could not connect to MongoDB ({e}). Running in offline mock mode.")


def get_user_interests(user_id: str) -> list[str]:
    """Returns the user's declared interests, or [] if the user doesn't exist yet."""
    if not DB_ONLINE or users_col is None:
        return _mock_users.get(user_id, [])

    try:
        user = users_col.find_one({"user_id": user_id})
        return user["interests"] if user else []
    except Exception as e:
        print(f"⚠️ DB Offline: Failed to fetch user interests ({e}).")
        return _mock_users.get(user_id, [])


def save_user_interests(user_id: str, interests: list[str]) -> None:
    """Creates or updates a user's declared interests."""
    _mock_users[user_id] = interests
    if not DB_ONLINE or users_col is None:
        print("⚠️ DB Offline: Saved user interests in memory")
        return

    try:
        users_col.update_one(
            {"user_id": user_id},
            {"$set": {"interests": interests}},
            upsert=True,
        )
    except Exception as e:
        print(f"⚠️ DB Offline: Failed to persist user interests ({e}).")


def has_seen_url(user_id: str, url: str) -> bool:
    """True if this user has already been shown a post from this exact URL."""
    if not DB_ONLINE or posts_col is None:
        print("⚠️ DB Offline: Bypassing duplicate check")
        return False

    try:
        return posts_col.find_one({"user_id": user_id, "source_url": url}) is not None
    except Exception as e:
        print("⚠️ DB Offline: Bypassing duplicate check")
        return False


def save_post(user_id: str, post: dict) -> None:
    """
    Saves a finished post (from pipeline.build_post) to the user's feed.
    Adds user_id and a timestamp — everything else comes from the post dict.
    """
    doc = {**post, "user_id": user_id, "created_at": datetime.now(timezone.utc)}
    _mock_posts.append(doc)

    if not DB_ONLINE or posts_col is None:
        print("⚠️ DB Offline: Pretending to save post")
        return

    try:
        posts_col.insert_one(doc)
    except Exception as e:
        print("⚠️ DB Offline: Pretending to save post")


def get_feed_for_user(user_id: str, interest: str | None = None, limit: int = 20) -> list[dict]:
    """
    Returns saved posts for a user, newest first. Pass `interest` to filter
    to just one topic (e.g. for a per-interest tab in the frontend).
    Mongo's internal _id is converted to a string so this is safe to
    return directly as JSON from an API endpoint.
    """
    if not DB_ONLINE or posts_col is None:
        posts = [p for p in _mock_posts if p.get("user_id") == user_id]
        if interest:
            posts = [p for p in posts if p.get("interest") == interest]
        posts = sorted(posts, key=lambda p: p.get("created_at", datetime.min), reverse=True)
        return posts[:limit]

    try:
        query = {"user_id": user_id}
        if interest:
            query["interest"] = interest

        cursor = posts_col.find(query).sort("created_at", -1).limit(limit)
        results = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    except Exception as e:
        print(f"⚠️ DB Offline: Fetching feed from memory ({e})")
        posts = [p for p in _mock_posts if p.get("user_id") == user_id]
        if interest:
            posts = [p for p in posts if p.get("interest") == interest]
        return posts[:limit]


# --- Topic Expander & Subtopic State Management ---

def get_or_create_subtopics(interest: str) -> list[str]:
    """
    Looks up a cached subtopic list for this interest (lowercased) in MongoDB 'topic_cache'.
    If found, returns the cached list immediately.
    If not found, calls expand_interest(interest), stores the result in 'topic_cache'
    with the interest as key, and returns it.
    Global cache, no TTL/expiry.
    """
    clean_interest = interest.strip().lower()

    # In-memory mock fallback if DB is offline
    if not DB_ONLINE or topic_cache_col is None:
        if clean_interest in _mock_topic_cache:
            return list(_mock_topic_cache[clean_interest])
        from topic_expander import expand_interest
        subtopics = expand_interest(clean_interest)
        _mock_topic_cache[clean_interest] = list(subtopics)
        return list(subtopics)

    try:
        doc = topic_cache_col.find_one({"interest": clean_interest})
        if doc and "subtopics" in doc and isinstance(doc["subtopics"], list) and doc["subtopics"]:
            return list(doc["subtopics"])

        from topic_expander import expand_interest
        subtopics = expand_interest(clean_interest)
        topic_cache_col.update_one(
            {"interest": clean_interest},
            {
                "$set": {
                    "interest": clean_interest,
                    "subtopics": subtopics,
                    "created_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )
        return list(subtopics)

    except Exception as e:
        print(f"[db] ⚠️ Failed to fetch/save from topic_cache ({e}). Using in-memory fallback.")
        if clean_interest in _mock_topic_cache:
            return list(_mock_topic_cache[clean_interest])
        from topic_expander import expand_interest
        subtopics = expand_interest(clean_interest)
        _mock_topic_cache[clean_interest] = list(subtopics)
        return list(subtopics)


def get_used_subtopics(user_id: str, interest: str) -> set[str]:
    """
    Returns the set of subtopics already used for this user+interest
    from the 'subtopic_state' collection (empty set if none found).
    """
    clean_interest = interest.strip().lower()
    state_key = (user_id, clean_interest)

    if not DB_ONLINE or subtopic_state_col is None:
        return set(_mock_subtopic_state.get(state_key, set()))

    try:
        doc = subtopic_state_col.find_one({"user_id": user_id, "interest": clean_interest})
        if doc and "used_subtopics" in doc and isinstance(doc["used_subtopics"], list):
            return set(doc["used_subtopics"])
        return set()

    except Exception as e:
        print(f"[db] ⚠️ Failed to read subtopic_state ({e}). Using in-memory state.")
        return set(_mock_subtopic_state.get(state_key, set()))


def mark_subtopic_used(user_id: str, interest: str, subtopic: str) -> None:
    """
    Adds the subtopic to that user+interest's used list using MongoDB's
    $addToSet with upsert=True so it is safe to call repeatedly without duplicates.
    """
    clean_interest = interest.strip().lower()
    state_key = (user_id, clean_interest)

    if state_key not in _mock_subtopic_state:
        _mock_subtopic_state[state_key] = set()
    _mock_subtopic_state[state_key].add(subtopic)

    if not DB_ONLINE or subtopic_state_col is None:
        return

    try:
        subtopic_state_col.update_one(
            {"user_id": user_id, "interest": clean_interest},
            {"$addToSet": {"used_subtopics": subtopic}},
            upsert=True,
        )
    except Exception as e:
        print(f"[db] ⚠️ Failed to update subtopic_state ({e}).")


# ── Proactive Discovery Engine — Categories & Topic Pools ─────────────────────

def get_category_pool() -> dict:
    """Reads the single category pool doc from 'category_pool' collection."""
    if not DB_ONLINE or category_pool_col is None:
        return dict(_mock_category_pool)
    try:
        doc = category_pool_col.find_one({"_id": "categories"})
        if doc and "categories" in doc:
            return {
                "categories": doc.get("categories", []),
                "updated_at": doc.get("updated_at", 0),
            }
        return {"categories": [], "updated_at": 0}
    except Exception as e:
        print(f"[db] ⚠️ Failed to read category_pool ({e}). Using in-memory fallback.")
        return dict(_mock_category_pool)


def save_category_pool(categories: list[str]) -> None:
    """Upserts the category pool doc with the new list and updated_at: time.time()."""
    now = time.time()
    _mock_category_pool["categories"] = list(categories)
    _mock_category_pool["updated_at"] = now

    if not DB_ONLINE or category_pool_col is None:
        return
    try:
        category_pool_col.update_one(
            {"_id": "categories"},
            {"$set": {"categories": categories, "updated_at": now}},
            upsert=True,
        )
    except Exception as e:
        print(f"[db] ⚠️ Failed to save category_pool ({e}).")


def get_or_refresh_categories() -> list[str]:
    """
    Reads the category pool; if empty or older than 7 days (7*24*60*60s),
    calls generate_categories() from category_generator, merges using
    dict.fromkeys() to dedupe while preserving order, saves, and returns the merged list.
    """
    pool = get_category_pool()
    categories = pool.get("categories", [])
    updated_at = pool.get("updated_at", 0)
    SEVEN_DAYS = 7 * 24 * 60 * 60

    if not categories or (time.time() - updated_at > SEVEN_DAYS):
        try:
            try:
                from category_generator import generate_categories
            except ImportError:
                import sys, os
                disc_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "discovery"))
                if disc_dir not in sys.path:
                    sys.path.insert(0, disc_dir)
                from category_generator import generate_categories

            new_categories = generate_categories(existing_categories=categories, count=5)
            merged = list(dict.fromkeys(categories + new_categories))
            save_category_pool(merged)
            return merged
        except Exception as e:
            print(f"[db] ⚠️ Error refreshing categories ({e}). Returning existing.")
            return categories

    return categories


def get_discovery_pool(category: str) -> dict:
    """Reads a doc keyed by category from 'discovery_pool' collection."""
    clean_category = category.strip().lower()
    if not DB_ONLINE or discovery_pool_col is None:
        return dict(_mock_discovery_pool.get(clean_category, {"topics": [], "updated_at": 0}))
    try:
        doc = discovery_pool_col.find_one({"category": clean_category})
        if doc and "topics" in doc:
            return {
                "topics": doc.get("topics", []),
                "updated_at": doc.get("updated_at", 0),
            }
        return {"topics": [], "updated_at": 0}
    except Exception as e:
        print(f"[db] ⚠️ Failed to read discovery_pool for '{category}' ({e}).")
        return dict(_mock_discovery_pool.get(clean_category, {"topics": [], "updated_at": 0}))


def save_discovery_pool(category: str, topics: list[str]) -> None:
    """Upserts the discovery pool for a category with new topics and updated_at timestamp."""
    clean_category = category.strip().lower()
    now = time.time()
    _mock_discovery_pool[clean_category] = {"topics": list(topics), "updated_at": now}

    if not DB_ONLINE or discovery_pool_col is None:
        return
    try:
        discovery_pool_col.update_one(
            {"category": clean_category},
            {"$set": {"category": clean_category, "topics": topics, "updated_at": now}},
            upsert=True,
        )
    except Exception as e:
        print(f"[db] ⚠️ Failed to save discovery_pool for '{category}' ({e}).")


def get_or_refresh_discovery_pool(category: str) -> list[str]:
    """
    Reads topic pool for category; if empty or older than 24h (24*60*60s),
    calls generate_topics_for_category() from discovery_generator,
    merges using dict.fromkeys() to dedupe while preserving order, saves, and returns the merged list.
    """
    clean_category = category.strip().lower()
    pool = get_discovery_pool(clean_category)
    topics = pool.get("topics", [])
    updated_at = pool.get("updated_at", 0)
    ONE_DAY = 24 * 60 * 60

    if not topics or (time.time() - updated_at > ONE_DAY):
        try:
            try:
                from discovery_generator import generate_topics_for_category
            except ImportError:
                import sys, os
                disc_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "discovery"))
                if disc_dir not in sys.path:
                    sys.path.insert(0, disc_dir)
                from discovery_generator import generate_topics_for_category

            new_topics = generate_topics_for_category(category=category, existing_topics=topics, count=8)
            merged = list(dict.fromkeys(topics + new_topics))
            save_discovery_pool(clean_category, merged)
            return merged
        except Exception as e:
            print(f"[db] ⚠️ Error refreshing discovery pool for '{category}' ({e}). Returning existing.")
            return topics

    return topics


def get_used_discovery_topics(user_id: str) -> set[str]:
    """Returns used discovery topics for this user (empty set if none)."""
    if not DB_ONLINE or discovery_state_col is None:
        return set(_mock_discovery_state.get(user_id, set()))
    try:
        doc = discovery_state_col.find_one({"user_id": user_id})
        if doc and "used_topics" in doc and isinstance(doc["used_topics"], list):
            return set(doc["used_topics"])
        return set()
    except Exception as e:
        print(f"[db] ⚠️ Failed to read discovery_state ({e}). Using in-memory fallback.")
        return set(_mock_discovery_state.get(user_id, set()))


def mark_discovery_topic_used(user_id: str, topic: str) -> None:
    """Adds topic to user's discovery_state via $addToSet with upsert=True."""
    if user_id not in _mock_discovery_state:
        _mock_discovery_state[user_id] = set()
    _mock_discovery_state[user_id].add(topic)

    if not DB_ONLINE or discovery_state_col is None:
        return
    try:
        discovery_state_col.update_one(
            {"user_id": user_id},
            {"$addToSet": {"used_topics": topic}},
            upsert=True,
        )
    except Exception as e:
        print(f"[db] ⚠️ Failed to update discovery_state ({e}).")
