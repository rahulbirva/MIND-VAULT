"""
sync_reels_mongo.py — Standalone MongoDB Atlas Sync & Health Utility for MindVault AI Reels
============================================================================================
Syncs generated_reels/manifest.json to MongoDB Atlas 'reels' collection and prints document stats.
"""

import os
import sys
import json
import time
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

load_dotenv(override=True)

try:
    from pymongo import MongoClient
    import certifi
except ImportError:
    print("❌ PyMongo or Certifi not installed. Run: pip install pymongo certifi")
    sys.exit(1)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
MANIFEST_PATH = os.path.join(BASE_DIR, "generated_reels", "manifest.json")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/mindvault")
DB_NAME = os.getenv("DB_NAME", "mindvault")


def sync_reels_database():
    print("=" * 70)
    print("⚡ MINDVAULT AI REELS — MONGODB SYNC UTILITY")
    print(f"📁 Manifest Path : {MANIFEST_PATH}")
    print(f"🗄️ Target DB     : {DB_NAME}.reels")
    masked_uri = MONGO_URI
    if "@" in masked_uri:
        prefix, rest = masked_uri.split("@", 1)
        scheme = prefix.split("://")[0]
        masked_uri = f"{scheme}://***:***@{rest}"
    print(f"🔗 Mongo URI     : {masked_uri}")
    print("=" * 70)

    if not os.path.exists(MANIFEST_PATH):
        print(f"❌ Manifest file not found at: {MANIFEST_PATH}")
        return

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    if not isinstance(manifest, list) or len(manifest) == 0:
        print("⚠️ Manifest is empty.")
        return

    print(f"📋 Loaded {len(manifest)} reel(s) from local manifest. Connecting to MongoDB...")

    try:
        client = MongoClient(
            MONGO_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000,
            tlsAllowInvalidCertificates=True,
        )
        client.admin.command("ping")
        print("✅ Connected successfully to MongoDB Atlas!")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return

    db = client[DB_NAME]
    reels_col = db["reels"]

    synced = 0
    for item in manifest:
        filename = item.get("filename")
        if not filename:
            continue

        doc = {
            "topic": item.get("topic"),
            "filename": filename,
            "title": item.get("title"),
            "caption": item.get("caption", ""),
            "video_prompt": item.get("video_prompt", ""),
            "negative_prompt": item.get("negative_prompt", ""),
            "videoUrl": f"/generated_reels/{filename}",
            "duration": 5.0,
            "aspectRatio": "9:16",
            "resolution": "720x1280",
            "model": "Wan 2.2 (Q6_K GGUF)",
            "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        reels_col.update_one(
            {"filename": filename},
            {
                "$set": doc,
                "$setOnInsert": {
                    "likes_count": 0,
                    "views_count": 0,
                    "liked_by": [],
                    "createdAt": item.get("createdAt") or doc["updatedAt"],
                },
            },
            upsert=True,
        )
        synced += 1

    total_in_db = reels_col.count_documents({})
    print("\n" + "=" * 70)
    print(f"🎉 SUCCESS: Synced {synced} reel(s) to MongoDB Atlas.")
    print(f"📊 Total documents in '{DB_NAME}.reels': {total_in_db}")
    print("=" * 70)

    # Print summary list
    print("\n📽️ Current Reels in MongoDB:")
    for r in reels_col.find({}).sort("createdAt", -1):
        print(f"  • [{r.get('topic')}] {r.get('title')} ({r.get('filename')}) — Likes: {r.get('likes_count', 0)}, Views: {r.get('views_count', 0)}")


if __name__ == "__main__":
    sync_reels_database()
