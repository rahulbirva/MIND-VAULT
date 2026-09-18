"""
check_mongo.py — Quick diagnostic utility to check MongoDB connectivity and document counts.
"""

import os
import time
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv

import certifi
load_dotenv(override=True)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "mindvault")


def check_database():
    print(f"[check_mongo] Connecting to database '{DB_NAME}'...")
    masked_uri = MONGO_URI
    if "@" in masked_uri:
        prefix, rest = masked_uri.split("@", 1)
        scheme = prefix.split("://")[0]
        masked_uri = f"{scheme}://***:***@{rest}"
    print(f"[check_mongo] Target URI: {masked_uri}")

    for attempt in range(3):
        try:
            client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=15000)
            # Ping the deployment
            client.admin.command("ping")
            print("[check_mongo] SUCCESS: Connected to MongoDB Atlas!")
            break
        except Exception as e:
            if attempt < 2:
                time.sleep(1)
                continue
            print("\n[check_mongo] FAILED to connect to MongoDB:")
            print(f"Exact Error ({type(e).__name__}): {e}")
            return False

    try:

        db = client[DB_NAME]
        users_count = db["users"].count_documents({})
        posts_count = db["posts"].count_documents({})
        topic_cache_count = db["topic_cache"].count_documents({})
        subtopic_state_count = db["subtopic_state"].count_documents({})

        print("\n=== COLLECTION COUNTS ===")
        print(f"Users collection ('users'):                 {users_count} document(s)")
        print(f"Posts collection ('posts'):                 {posts_count} document(s)")
        print(f"Topic Cache collection ('topic_cache'):       {topic_cache_count} document(s)")
        print(f"Subtopic State collection ('subtopic_state'): {subtopic_state_count} document(s)")

        if topic_cache_count > 0:
            print("\nCached Topics in 'topic_cache':")
            for t in db["topic_cache"].find({}):
                print(f"  • {t.get('interest')}: {len(t.get('subtopics', []))} subtopics ({t.get('subtopics')[:3]}...)")

        if subtopic_state_count > 0:
            print("\nUsed Subtopics in 'subtopic_state':")
            for s in db["subtopic_state"].find({}):
                print(f"  • User: {s.get('user_id')} | Topic: {s.get('interest')} | Used: {s.get('used_subtopics')}")

        if posts_count > 0:
            print("\nLatest Post in 'posts':")
            sample_post = db["posts"].find_one(sort=[("created_at", -1)])
            print({
                "title": sample_post.get("title"),
                "user_id": sample_post.get("user_id"),
                "interest": sample_post.get("interest"),
                "subtopic": sample_post.get("subtopic"),
                "source_url": sample_post.get("source_url"),
                "created_at": str(sample_post.get("created_at")),
            })

        return True

    except PyMongoError as e:
        print("\n[check_mongo] FAILED to connect to MongoDB:")
        print(f"Exact Error ({type(e).__name__}): {e}")
        return False


if __name__ == "__main__":
    check_database()
