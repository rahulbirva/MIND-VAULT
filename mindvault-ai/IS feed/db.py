"""
db.py — Database persistence & state layer for the Interest & Saved (IS) Feed Agent.
====================================================================================
Manages:
1. User Declared Interests ('users' collection)
2. User Saved Items & Tags ('vaultitems', 'posts', 'saved_posts' collections)
3. IS Generated Posts ('is_feed_posts' collection)
4. Tag Affinity & Weight Map ('user_tag_affinity' collection)
5. Topic & Subtopic State ('subtopic_state', 'is_topic_cache')
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

try:
    import certifi
    _has_certifi = True
except ImportError:
    _has_certifi = False

load_dotenv(override=True)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "mindvault")

DB_ONLINE = False
_client = None
db = None
users_col = None
posts_col = None
vaultitems_col = None
is_feed_posts_col = None
user_tag_affinity_col = None
subtopic_state_col = None
is_topic_cache_col = None

# In-memory mock storage fallback when running offline
_mock_users: dict[str, list[str]] = {}
_mock_saved_items: list[dict] = []
_mock_is_posts: list[dict] = []
_mock_tag_affinity: dict[str, dict[str, int]] = {}
_mock_subtopic_state: dict[tuple[str, str], set[str]] = {}
_mock_topic_cache: dict[str, list[str]] = {}

for _attempt in range(3):
    try:
        kwargs = {
            "serverSelectionTimeoutMS": 5000,
            "tlsAllowInvalidCertificates": True,
        }
        if _has_certifi:
            kwargs["tlsCAFile"] = certifi.where()

        _client = MongoClient(MONGO_URI, **kwargs)
        _client.admin.command("ping")
        db = _client[DB_NAME]
        users_col = db["users"]
        posts_col = db["posts"]
        vaultitems_col = db["vaultitems"]
        is_feed_posts_col = db["is_feed_posts"]
        user_tag_affinity_col = db["user_tag_affinity"]
        subtopic_state_col = db["subtopic_state"]
        is_topic_cache_col = db["is_topic_cache"]
        DB_ONLINE = True
        print("[IS feed db] Connected successfully to MongoDB Atlas.")
        break
    except Exception as e:
        if _attempt < 2:
            time.sleep(1)
            continue
        DB_ONLINE = False
        print(f"[IS feed db] ℹ️ MongoDB offline ({e}). Running with in-memory state.")


# ── User Interests ─────────────────────────────────────────────────────────────

def get_user_interests(user_id: str) -> list[str]:
    """Returns declared interests for a user."""
    if not DB_ONLINE or users_col is None:
        return _mock_users.get(user_id, ["Technology", "Science", "Space", "History"])

    try:
        from bson import ObjectId
        query = {}
        if ObjectId.is_valid(user_id):
            query = {"_id": ObjectId(user_id)}
        else:
            query = {"$or": [{"user_id": user_id}, {"username": user_id}]}

        user = users_col.find_one(query)
        if user and "interests" in user and user["interests"]:
            return [str(i).strip() for i in user["interests"] if str(i).strip()]
        return ["Technology", "Science", "Space", "History"]
    except Exception as e:
        print(f"[IS feed db] Fetch interests error: {e}")
        return _mock_users.get(user_id, ["Technology", "Science", "Space", "History"])


# ── Saved Items & Tag Affinity ─────────────────────────────────────────────────

def get_user_saved_items(user_id: str, limit: int = 50) -> list[dict]:
    """
    Fetches all items saved by the user from VaultItem and Feed posts.
    """
    saved = []
    if not DB_ONLINE or vaultitems_col is None:
        return [s for s in _mock_saved_items if s.get("user_id") == user_id or s.get("userId") == user_id][:limit]

    try:
        from bson import ObjectId
        query = {}
        if ObjectId.is_valid(user_id):
            query = {"$or": [{"userId": ObjectId(user_id)}, {"user_id": user_id}, {"userId": user_id}]}
        else:
            query = {"$or": [{"userId": user_id}, {"user_id": user_id}]}

        # 1. From vaultitems
        for doc in vaultitems_col.find(query).sort("createdAt", -1).limit(limit):
            doc["_id"] = str(doc["_id"])
            saved.append(doc)

        # 2. From saved posts in posts collection
        if posts_col is not None:
            for doc in posts_col.find({"user_id": user_id, "saved": True}).sort("created_at", -1).limit(limit):
                doc["_id"] = str(doc["_id"])
                saved.append(doc)

        return saved
    except Exception as e:
        print(f"[IS feed db] Fetch saved items error: {e}")
        return [s for s in _mock_saved_items if s.get("user_id") == user_id or s.get("userId") == user_id][:limit]


def save_user_tag_affinity(user_id: str, tag_weights: dict[str, int]) -> None:
    """Persists the aggregated tag affinity map for a user in MongoDB."""
    _mock_tag_affinity[user_id] = tag_weights
    if not DB_ONLINE or user_tag_affinity_col is None:
        return

    try:
        user_tag_affinity_col.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "user_id": user_id,
                    "tag_weights": tag_weights,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )
    except Exception as e:
        print(f"[IS feed db] Save tag affinity error: {e}")


def get_user_tag_affinity(user_id: str) -> dict[str, int]:
    """Retrieves the stored tag affinity map for a user."""
    if not DB_ONLINE or user_tag_affinity_col is None:
        return _mock_tag_affinity.get(user_id, {})

    try:
        doc = user_tag_affinity_col.find_one({"user_id": user_id})
        if doc and "tag_weights" in doc:
            return doc["tag_weights"]
        return _mock_tag_affinity.get(user_id, {})
    except Exception as e:
        return _mock_tag_affinity.get(user_id, {})


# ── IS Feed Posts Persistence ──────────────────────────────────────────────────

def has_seen_url(user_id: str, url: str) -> bool:
    """Checks whether this URL was already saved/generated for this user."""
    if not DB_ONLINE:
        for p in _mock_is_posts:
            if p.get("user_id") == user_id and p.get("source_url") == url:
                return True
        return False

    try:
        if is_feed_posts_col is not None and is_feed_posts_col.find_one({"user_id": user_id, "source_url": url}):
            return True
        if posts_col is not None and posts_col.find_one({"user_id": user_id, "source_url": url}):
            return True
        return False
    except Exception:
        return False


def save_is_post(user_id: str, post: dict) -> None:
    """Saves a generated post from the IS Feed agent to MongoDB."""
    doc = {
        **post,
        "user_id": user_id,
        "source": "is_feed",
        "created_at": datetime.now(timezone.utc),
    }
    _mock_is_posts.append(doc)

    if not DB_ONLINE or is_feed_posts_col is None:
        return

    try:
        is_feed_posts_col.insert_one(doc)
    except Exception as e:
        print(f"[IS feed db] Save IS post error: {e}")


def get_is_feed_posts(user_id: str, limit: int = 20) -> list[dict]:
    """Fetches IS feed posts generated for the user, newest first."""
    if not DB_ONLINE or is_feed_posts_col is None:
        posts = [p for p in _mock_is_posts if p.get("user_id") == user_id]
        return sorted(posts, key=lambda p: p.get("created_at", datetime.min), reverse=True)[:limit]

    try:
        cursor = is_feed_posts_col.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        results = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    except Exception as e:
        posts = [p for p in _mock_is_posts if p.get("user_id") == user_id]
        return sorted(posts, key=lambda p: p.get("created_at", datetime.min), reverse=True)[:limit]


# ── Subtopic Tracking ──────────────────────────────────────────────────────────

def get_used_subtopics(user_id: str, interest: str) -> set[str]:
    """Returns subtopics already presented to avoid repetition."""
    clean_interest = interest.strip().lower()
    state_key = (user_id, clean_interest)

    if not DB_ONLINE or subtopic_state_col is None:
        return set(_mock_subtopic_state.get(state_key, set()))

    try:
        doc = subtopic_state_col.find_one({"user_id": user_id, "interest": clean_interest})
        if doc and "used_subtopics" in doc and isinstance(doc["used_subtopics"], list):
            return set(doc["used_subtopics"])
        return set()
    except Exception:
        return set(_mock_subtopic_state.get(state_key, set()))


def is_seen_url(user_id: str, url: str) -> bool:
    return has_seen_url(user_id, url)


def get_user_is_posts(user_id: str, limit: int = 20) -> list[dict]:
    return get_is_feed_posts(user_id, limit=limit)


def mark_subtopic_used(user_id: str, interest: str, subtopic: str) -> None:
    """Marks a subtopic as used for this user."""
    clean_interest = interest.strip().lower()
    clean_sub = subtopic.strip()
    state_key = (user_id, clean_interest)

    if state_key not in _mock_subtopic_state:
        _mock_subtopic_state[state_key] = set()
    _mock_subtopic_state[state_key].add(clean_sub)

    if not DB_ONLINE or subtopic_state_col is None:
        return

    try:
        subtopic_state_col.update_one(
            {"user_id": user_id, "interest": clean_interest},
            {
                "$addToSet": {"used_subtopics": clean_sub},
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
            upsert=True,
        )
    except Exception as e:
        print(f"[IS feed db] Mark subtopic used error: {e}")


def mark_is_subtopic_used(user_id: str, subtopic: str) -> None:
    mark_subtopic_used(user_id, "is_feed", subtopic)


def get_user_info(user_id: str) -> dict:
    interests = get_user_interests(user_id)
    return {
        "userId": user_id,
        "username": user_id,
        "interests": interests,
    }


def get_all_users() -> list[dict]:
    """Returns list of all available users."""
    if not DB_ONLINE or users_col is None:
        return [
            {"userId": "demo_user_1", "username": "Demo Explorer", "interests": ["Technology", "Space", "Neuroscience"]},
            {"userId": "test_user", "username": "Test Learner", "interests": ["AI", "History", "Physics"]},
        ]
    try:
        users = []
        for doc in users_col.find({}).limit(20):
            uid = str(doc.get("_id", ""))
            users.append({
                "userId": uid,
                "username": doc.get("username") or doc.get("email") or uid,
                "interests": doc.get("interests", []),
            })
        if not users:
            return [
                {"userId": "demo_user_1", "username": "Demo Explorer", "interests": ["Technology", "Space", "Neuroscience"]},
            ]
        return users
    except Exception:
        return [
            {"userId": "demo_user_1", "username": "Demo Explorer", "interests": ["Technology", "Space", "Neuroscience"]},
        ]
