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

# In-memory mock storage fallback
_mock_users: dict[str, list[str]] = {}
_mock_posts: list[dict] = []
_mock_topic_cache: dict[str, list[str]] = {}
_mock_subtopic_state: dict[tuple[str, str], set[str]] = {}

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
