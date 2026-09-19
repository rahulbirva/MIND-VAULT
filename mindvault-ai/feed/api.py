"""
api.py — FastAPI microservice bridge for MindVault.

Exposes the HTTP endpoints consumed by the Node.js Express backend
(Backend/src/services/pythonService.js):
  - GET  /health          — Health check and model metadata
  - POST /simplify        — Generate simplified feed cards for a list of topics
  - POST /deepdive        — Generate comprehensive crash course + quiz questions
  - POST /grade           — AI grading of user quiz answers
"""

import os
import json
import urllib.parse
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load local environment variables
load_dotenv(override=True)

from simplifier import simplify_text, MODEL_NAME
from article_suggester import suggest_articles_for_interest
from scraper import scrape_article
import ollama

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

app = FastAPI(
    title="MindVault AI Microservice",
    description="AI engine powering personalized feeds, crash courses, and knowledge validation.",
    version="1.0.0",
)

# Enable CORS for local development (Express on 5000, Vite on 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Schemas ───────────────────────────────────────────────

class SimplifyRequest(BaseModel):
    topics: List[str]


class SimplifiedFeedItem(BaseModel):
    topic: str
    summary: str
    keyPoints: List[str]
    videoUrl: Optional[str] = None


class DeepDiveRequest(BaseModel):
    topic: str


class DeepDiveResponse(BaseModel):
    topic: str
    summary: str
    keyFacts: List[str]
    videoUrl: Optional[str] = None
    questions: List[str]


class GradeRequest(BaseModel):
    topic: str
    questions: List[str]
    answers: List[str]


class GradeResponse(BaseModel):
    passed: bool
    feedback: str


# ── Mock Fixtures ─────────────────────────────────────────────────────────────

MOCK_FEED_ITEMS = {
    "space": {
        "summary": "Humanity has been venturing into space since 1957, driven by scientific curiosity, satellite technology, and multi-planetary ambition.",
        "keyPoints": [
            "Sputnik 1 (1957) was the first artificial satellite placed into orbit.",
            "The Apollo 11 mission successfully landed humans on the Moon in 1969.",
            "Modern reusable rockets have reduced orbital launch costs by over 70%.",
        ],
        "videoUrl": "https://www.youtube.com/watch?v=aY-0uBIYYKk",
    },
    "politics": {
        "summary": "Political systems structure societal power distribution, governing constitutional rights, laws, and public representation.",
        "keyPoints": [
            "Representative democracies elect officials to legislate on citizens' behalf.",
            "Checks and balances prevent consolidation of authority in one branch.",
            "Electoral mechanisms directly influence political outcomes and stability.",
        ],
        "videoUrl": "https://www.youtube.com/watch?v=pZnOdkDXKvk",
    },
    "history": {
        "summary": "Ancient civilizations developed the foundational legal codes, writing scripts, and technologies supporting modern life.",
        "keyPoints": [
            "Mesopotamian cuneiform (c. 3500 BCE) was history's first known writing system.",
            "The Code of Hammurabi established standardized written legal retribution.",
            "Ancient engineering built trade routes spanning multiple continents.",
        ],
        "videoUrl": "https://www.youtube.com/watch?v=ub4lVXhT0Mk",
    },
}

DEFAULT_FEED_ITEM = {
    "summary": "A core introductory overview highlighting key developments and concepts within this field.",
    "keyPoints": [
        "Foundational principles established by pioneering researchers.",
        "Rapid technological and conceptual evolution over the past decade.",
        "Significant implications for ongoing research and real-world application.",
    ],
    "videoUrl": None,
}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "mindvault-ai",
        "model": MODEL_NAME,
        "mock_mode": MOCK_MODE,
    }


@app.post("/simplify", response_model=List[SimplifiedFeedItem])
def simplify_topics(req: SimplifyRequest):
    """
    Given an array of topics, generate simplified feed cards matching the
    exact schema expected by Backend/src/services/pythonService.js.
    """
    if not req.topics:
        return []

    results = []
    for topic in req.topics:
        clean_topic = topic.strip()
        lower_topic = clean_topic.lower()

        if MOCK_MODE:
            fixture = MOCK_FEED_ITEMS.get(lower_topic, DEFAULT_FEED_ITEM)
            results.append(
                SimplifiedFeedItem(
                    topic=clean_topic,
                    summary=fixture["summary"],
                    keyPoints=fixture["keyPoints"],
                    videoUrl=fixture.get("videoUrl"),
                )
            )
            continue

        try:
            # 1. Search for a top article related to this topic
            suggestions = suggest_articles_for_interest(clean_topic, max_results=1)
            if suggestions:
                article = suggestions[0]
                scraped = scrape_article(article["url"])
                text = scraped["text"] or article.get("snippet", "")
                simplified = simplify_text(text, title=article.get("title", clean_topic))

                summary = simplified.get("summary", "")
                key_points = simplified.get("key_points", [])
                image_or_video = scraped.get("image_url")

                results.append(
                    SimplifiedFeedItem(
                        topic=clean_topic,
                        summary=summary or f"Overview of {clean_topic}.",
                        keyPoints=key_points if len(key_points) >= 2 else [
                            f"Key insight regarding {clean_topic}.",
                            f"Major principles and foundational context.",
                            f"Practical implications and applications.",
                        ],
                        videoUrl=image_or_video,
                    )
                )
            else:
                # Fallback to direct AI generation if search returns empty
                res = simplify_text(f"Key overview and fundamentals of {clean_topic}.", title=clean_topic)
                results.append(
                    SimplifiedFeedItem(
                        topic=clean_topic,
                        summary=res.get("summary", f"Introduction to {clean_topic}."),
                        keyPoints=res.get("key_points") or [
                            f"Foundations of {clean_topic}.",
                            f"Modern developments in {clean_topic}.",
                            f"Key takeaways for practical understanding.",
                        ],
                        videoUrl=None,
                    )
                )
        except Exception as e:
            print(f"[api.py /simplify] Error processing topic '{clean_topic}': {e}")
            fixture = MOCK_FEED_ITEMS.get(lower_topic, DEFAULT_FEED_ITEM)
            results.append(
                SimplifiedFeedItem(
                    topic=clean_topic,
                    summary=fixture["summary"],
                    keyPoints=fixture["keyPoints"],
                    videoUrl=fixture.get("videoUrl"),
                )
            )

    return results


@app.post("/deepdive", response_model=DeepDiveResponse)
def deep_dive(req: DeepDiveRequest):
    """
    Generate an in-depth crash course on a topic, including summary, key facts,
    and 3 comprehension quiz questions for testing knowledge mastery.
    """
    clean_topic = req.topic.strip()
    if not clean_topic:
        raise HTTPException(status_code=400, detail="`topic` must not be empty.")

    video_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(clean_topic + ' explained')}"

    if MOCK_MODE:
        return DeepDiveResponse(
            topic=clean_topic,
            summary=f"A comprehensive deep-dive into {clean_topic}, examining its fundamental theories, historical evolution, and modern applications.",
            keyFacts=[
                f"{clean_topic} represents a transformative domain in modern science and inquiry.",
                f"Core principles governing {clean_topic} were established through rigorous empirical experimentation.",
                f"Contemporary research continues to unlock novel insights and practical capabilities.",
                f"Understanding {clean_topic} provides essential context for interdisciplinary problem solving.",
            ],
            videoUrl=video_url,
            questions=[
                f"What is the foundational principle underlying {clean_topic}?",
                f"How do recent developments in {clean_topic} impact its field?",
                f"What is one common misconception regarding {clean_topic}, and what does evidence show?",
            ],
        )

    system_prompt = (
        "You are an expert tutor creating a comprehensive deep-dive learning module and quiz for a student.\n\n"
        "Return ONLY a JSON object with this exact schema:\n"
        "{\n"
        '  "summary": "3-4 concise, educational sentences explaining the core mechanics and significance.",\n'
        '  "keyFacts": ["Fact 1 with concrete specifics", "Fact 2", "Fact 3", "Fact 4", "Fact 5"],\n'
        '  "questions": ["Open-ended question 1 testing comprehension", "Question 2", "Question 3"]\n'
        "}\n\n"
        "Rules:\n"
        "- Respond with ONLY the raw JSON. No markdown code blocks, no ```json, no extra text.\n"
        "- Questions must test conceptual understanding, not trivial recall."
    )

    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Topic for deep dive: {clean_topic}"},
            ],
        )
        content = response["message"]["content"].strip()
        if content.startswith("```"):
            content = content.strip("`")
            content = content.replace("json", "", 1).strip()

        data = json.loads(content)
        return DeepDiveResponse(
            topic=clean_topic,
            summary=data.get("summary", f"Detailed exploration of {clean_topic}."),
            keyFacts=data.get("keyFacts", [
                f"{clean_topic} forms a cornerstone concept in its area of study.",
                f"Early discoveries laid the groundwork for systematic analysis of {clean_topic}.",
                f"Modern methodologies have dramatically refined how we model {clean_topic}.",
                f"Cross-disciplinary applications continue to expand rapidly.",
            ]),
            videoUrl=video_url,
            questions=data.get("questions", [
                f"What primary mechanism defines {clean_topic}?",
                f"How has our understanding of {clean_topic} shifted over time?",
                f"Why is {clean_topic} significant to broader systems?",
            ]),
        )
    except Exception as e:
        print(f"[api.py /deepdive] Error generating deep dive for '{clean_topic}': {e}")
        return DeepDiveResponse(
            topic=clean_topic,
            summary=f"A comprehensive deep-dive into {clean_topic}, examining its fundamental mechanisms and impact.",
            keyFacts=[
                f"{clean_topic} is a foundational pillar of its subject area.",
                f"Key research has established measurable laws and behaviors for {clean_topic}.",
                f"Recent innovations have introduced new applications and perspectives.",
                f"Mastering {clean_topic} helps contextualize related phenomena.",
            ],
            videoUrl=video_url,
            questions=[
                f"What core concept defines {clean_topic}?",
                f"What evidence supports the primary theory of {clean_topic}?",
                f"How does {clean_topic} relate to real-world applications?",
            ],
        )


@app.post("/grade", response_model=GradeResponse)
def grade_quiz(req: GradeRequest):
    """
    Evaluate student quiz answers for a given topic and return whether they passed
    along with actionable, encouraging feedback.
    """
    if not req.questions or not req.answers or len(req.questions) != len(req.answers):
        raise HTTPException(
            status_code=400,
            detail="Questions and answers must be non-empty arrays of identical length.",
        )

    # Basic completeness check
    valid_answers = [a.strip() for a in req.answers if a and len(a.strip()) > 3]
    if len(valid_answers) == 0:
        return GradeResponse(
            passed=False,
            feedback="Your answers were too short or empty. Try elaborating on the core concepts in your own words.",
        )

    if MOCK_MODE:
        return GradeResponse(
            passed=True,
            feedback="Excellent work! Your answers demonstrate a solid grasp of the core principles.",
        )

    system_prompt = (
        "You are an encouraging, insightful academic instructor grading a student's open-ended answers.\n\n"
        "Return ONLY a JSON object with this exact schema:\n"
        "{\n"
        '  "passed": true,\n'
        '  "feedback": "2-3 sentences praising strong explanations and clarifying any minor gaps."\n'
        "}\n\n"
        "Rules:\n"
        "- Respond with ONLY raw JSON. No markdown code blocks, no ```json.\n"
        "- If the answers show honest engagement with the topic, give a passing score (passed=true) with constructive praise."
    )

    qa_formatted = "\n\n".join(
        f"Question {i+1}: {q}\nStudent Answer: {a}"
        for i, (q, a) in enumerate(zip(req.questions, req.answers))
    )

    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Topic: {req.topic}\n\n{qa_formatted}"},
            ],
        )
        content = response["message"]["content"].strip()
        if content.startswith("```"):
            content = content.strip("`")
            content = content.replace("json", "", 1).strip()

        data = json.loads(content)
        return GradeResponse(
            passed=bool(data.get("passed", True)),
            feedback=str(data.get("feedback", "Good effort demonstrating conceptual understanding.")),
        )
    except Exception as e:
        print(f"[api.py /grade] LLM grading failed: {e}. Falling back to default evaluation.")
        # Generous fallback: if user provided answers to all questions, grant pass
        has_substantive_answers = len(valid_answers) == len(req.questions)
        return GradeResponse(
            passed=has_substantive_answers,
            feedback="Great job engaging with the material! Review the key facts to deepen your understanding."
            if has_substantive_answers
            else "Some answers were brief. Elaborate further to lock in your mastery of this topic.",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
