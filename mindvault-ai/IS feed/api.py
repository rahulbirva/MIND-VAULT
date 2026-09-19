"""
api.py — FastAPI microservice for the Interest & Saved (IS) Feed AI Agent.
Runs on port 8002.
"""

import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from db import get_user_is_posts, get_user_tag_affinity, get_user_info
from saved_analyzer import analyze_user_saved_interests
from tag_extractor import extract_tags_from_text
from pipeline import generate_is_feed_for_user, generate_blended_feed

app = FastAPI(
    title="MindVault IS Feed AI Agent Service",
    description="Generates personalized feed posts based on user interests, saved items, and semantic tags (40% Standard / 60% IS Feed blend).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateISFeedRequest(BaseModel):
    user_id: str = Field(..., description="User ID in MongoDB")
    count: int = Field(6, description="Number of IS feed posts to generate")


class GenerateBlendedFeedRequest(BaseModel):
    user_id: str = Field(..., description="User ID in MongoDB")
    total_posts: int = Field(10, description="Total feed items")
    standard_ratio: float = Field(0.4, description="Standard Feed ratio (e.g. 0.4 for 40%)")
    is_ratio: float = Field(0.6, description="IS Feed ratio (e.g. 0.6 for 60%)")


class TagExtractRequest(BaseModel):
    title: str = ""
    text: str = ""


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "MindVault IS Feed Agent",
        "default_blend": "40% Standard / 60% IS Feed",
    }


@app.get("/api/is-feed/profile/{user_id}")
def get_user_profile(user_id: str):
    """
    Returns user's declared interests, saved item count, top tags, and affinity weights.
    """
    profile = analyze_user_saved_interests(user_id)
    affinity = get_user_tag_affinity(user_id)
    return {
        "user_id": user_id,
        "profile": profile,
        "saved_tag_affinity": affinity,
    }


@app.post("/api/is-feed/generate")
def generate_is_feed(req: GenerateISFeedRequest):
    """
    Generates tailored IS posts directly from user's saved items & tags.
    """
    try:
        posts = generate_is_feed_for_user(req.user_id, count=req.count)
        return {
            "success": True,
            "user_id": req.user_id,
            "count": len(posts),
            "posts": posts,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/is-feed/blended")
def generate_blended(req: GenerateBlendedFeedRequest):
    """
    Generates a blended feed respecting the 40% Standard / 60% IS Feed ratio.
    """
    try:
        result = generate_blended_feed(
            user_id=req.user_id,
            total_posts=req.total_posts,
            standard_ratio=req.standard_ratio,
            is_ratio=req.is_ratio,
        )
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/is-feed/posts/{user_id}")
def get_user_posts(user_id: str, limit: int = 20):
    """
    Retrieves previously persisted IS feed posts from MongoDB.
    """
    posts = get_user_is_posts(user_id, limit=limit)
    return {
        "user_id": user_id,
        "count": len(posts),
        "posts": posts,
    }


@app.post("/api/is-feed/extract-tags")
def extract_tags(req: TagExtractRequest):
    """
    Extracts semantic keyword tags from title and body text.
    """
    tags = extract_tags_from_text(req.title, req.text)
    return {
        "tags": tags,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8002"))
    print(f"Starting MindVault IS Feed API on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
