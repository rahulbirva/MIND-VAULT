"""
api.py — FastAPI microservice for MindVault Discovery Engine.

Run with:
    uvicorn api:app --host 0.0.0.0 --port 8000 --reload
or:
    python api.py
"""

import os
import sys
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure current folder is on sys.path
CURRENT_DIR = os.path.abspath(os.path.dirname(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from db import (
    DB_ONLINE,
    get_or_refresh_categories,
    get_or_refresh_discovery_pool,
    get_used_discovery_topics,
    get_feed_for_user,
)
from category_generator import generate_categories
from discovery_generator import generate_topics_for_category
from discovery_topics import get_random_topic
from discovery import generate_daily_discovery_post

app = FastAPI(
    title="MindVault Proactive Discovery Engine API",
    description="Microservice providing practical knowledge discovery, dynamic category and topic pools, and LLM simplification.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DiscoveryRequest(BaseModel):
    userId: Optional[str] = "default_user"
    maxAttempts: Optional[int] = 3


class SimplifyLegacyRequest(BaseModel):
    topics: List[str]


@app.get("/health")
@app.get("/api/discovery/health")
def health():
    return {
        "status": "ok",
        "service": "discovery-engine",
        "db_online": DB_ONLINE,
        "model": os.getenv("MODEL_NAME", "qwen2.5:7b"),
        "mock_mode": os.getenv("MOCK_MODE", "false").lower() == "true",
    }


@app.post("/api/discovery/daily-post")
def create_discovery_post(payload: DiscoveryRequest):
    user_id = payload.userId or "default_user"
    post = generate_daily_discovery_post(user_id=user_id, max_attempts=payload.maxAttempts or 3)
    if not post:
        raise HTTPException(
            status_code=500,
            detail="Failed to surface discovery post. All candidate attempts failed.",
        )
    return post


@app.get("/api/discovery/categories")
def get_categories():
    categories = get_or_refresh_categories()
    return {"categories": categories, "count": len(categories)}


@app.get("/api/discovery/random-topic")
def pick_random_topic(user_id: Optional[str] = None):
    used = get_used_discovery_topics(user_id) if user_id else set()
    topic = get_random_topic(exclude=used)
    return {"topic": topic}


@app.get("/api/discovery/feed/{user_id}")
def get_user_discovery_feed(user_id: str, limit: int = 20):
    posts = get_feed_for_user(user_id, limit=limit)
    discovery_posts = [p for p in posts if p.get("source") == "discovery"]
    return {"userId": user_id, "posts": discovery_posts, "total": len(discovery_posts)}


# ── Backward Compatibility with legacy Backend pythonService ───────────────────
@app.post("/simplify")
def legacy_simplify(payload: SimplifyLegacyRequest):
    """Fallback compatibility endpoint for legacy Feed pipeline."""
    results = []
    for t in payload.topics:
        results.append({
            "topic": t,
            "summary": f"Practical overview of {t}.",
            "keyPoints": [f"Key aspect 1 of {t}", f"Key aspect 2 of {t}", f"Key aspect 3 of {t}"],
            "videoUrl": None,
        })
    return results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
