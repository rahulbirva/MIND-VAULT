# MindVault — Interest & Saved (IS) Feed AI Agent 🧠

The **Interest & Saved (IS) Feed AI Agent** generates personalized educational feed posts specifically tailored to each user's declared interests, previous vault-saved items, and high-signal semantic tags stored in MongoDB.

It powers a hybrid feed engine delivering:
- **40% Discovery Posts** from the Standard Feed Agent (`mindvault-ai/feed/`) — broad exploratory content across user interests.
- **60% Deep-Dive Posts** from this IS Feed Agent (`mindvault-ai/IS feed/`) — hyper-personalized synthesis derived from tags of articles saved by the user.

---

## 🏗️ Architecture & Pipeline Flow

```
                                  ┌───────────────────────────┐
                                  │      MongoDB Atlas        │
                                  │  - users (interests)      │
                                  │  - vaultitems / saved     │
                                  │  - user_tag_affinity      │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │    saved_analyzer.py      │
                                  │  (Weights tags from saved │
                                  │   feed items + interests) │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │ is_topic_synthesizer.py   │
                                  │   (Qwen 2.5:7b synthesizes│
                                  │   deep-dive topics & tags)│
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │   article_suggester.py    │
                                  │   (DuckDuckGo search)     │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │       simplifier.py       │
                                  │   (Qwen 2.5 creates cards │
                                  │   with tags & match why)  │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                        ┌───────────────────────────────────────────┐
                        │               pipeline.py                 │
                        │ 40% Standard Feed  +  60% IS Feed Blend   │
                        └─────────────────────┬─────────────────────┘
                                              │
                       ┌──────────────────────┴──────────────────────┐
                       ▼                                             ▼
          FastAPI Microservice (Port 8002)              Streamlit UI (Port 8503)
```

---

## 📁 File Structure

| File | Purpose |
|------|---------|
| [`db.py`](file:///d:/mindvault-AI/mindvault-ai/IS%20feed/db.py) | MongoDB Atlas connection, state caching, `user_tag_affinity`, `is_feed_posts`, and subtopic deduplication. |
| [`tag_extractor.py`](file:///d:/mindvault-AI/mindvault-ai/IS%20feed/tag_extractor.py) | Qwen 2.5:7b semantic tag extractor with regex heuristic fallback. Produces normalized slugs like `quantum-computing`. |
| [`saved_analyzer.py`](file:///d:/mindvault-AI/mindvault-ai/IS%20feed/saved_analyzer.py) | Aggregates user saved items, counts tag frequency, and updates `user_tag_affinity` in DB. |
| [`is_topic_synthesizer.py`](file:///d:/mindvault-AI/mindvault-ai/IS%20feed/is_topic_synthesizer.py) | Uses Qwen 2.5:7b to synthesize tailored subtopics at the intersection of user interests and saved tags. |
| [`tools.py`](file:///d:/mindvault-AI/mindvault-ai/IS%20feed/tools.py) | DuckDuckGo search utilities and domain deduplication. |
| [`scraper.py`](file:///d:/mindvault-AI/mindvault-ai/IS%20feed/scraper.py) | Article body scraper and `og:image` metadata extractor. |
| [`article_suggester.py`](file:///d:/mindvault-AI/mindvault-ai/IS%20feed/article_suggester.py) | Searches and ranks articles for synthesized topic plans. |
| [`simplifier.py`](file:///d:/mindvault-AI/mindvault-ai/IS%20feed/simplifier.py) | Qwen 2.5:7b summarizer outputting summary, key points, why it matches saved tastes, and semantic tags. |
| [`pipeline.py`](file:///d:/mindvault-AI/mindvault-ai/IS%20feed/pipeline.py) | Orchestrates feed generation and interleaves the **40% Standard / 60% IS** blended feed stream. |
| [`api.py`](file:///d:/mindvault-AI/mindvault-ai/IS%20feed/api.py) | FastAPI service running on `http://localhost:8002`. |
| [`app.py`](file:///d:/mindvault-AI/mindvault-ai/IS%20feed/app.py) | Interactive Streamlit dashboard running on `http://localhost:8503`. |

---

## 🚀 Running the Services

### 1. Interactive Streamlit Dashboard
```bash
streamlit run "mindvault-ai/IS feed/app.py" --server.port 8503
```
Access at: **`http://localhost:8503`**

### 2. FastAPI Microservice
```bash
python "mindvault-ai/IS feed/api.py"
```
Access at: **`http://localhost:8002`** (Swagger docs at `http://localhost:8002/docs`)

---

## 📡 API Endpoints

- `GET /health` — Service health and ratio check.
- `GET /api/is-feed/profile/{user_id}` — Analyzes saved items, top tags, and tag affinity map in MongoDB.
- `POST /api/is-feed/generate` — Generates personalized IS feed posts (`{ "user_id": "...", "count": 6 }`).
- `POST /api/is-feed/blended` — Generates blended feed respecting custom ratios (`{ "user_id": "...", "total_posts": 10, "standard_ratio": 0.4, "is_ratio": 0.6 }`).
- `GET /api/is-feed/posts/{user_id}` — Retrieves previously persisted IS posts from MongoDB.
- `POST /api/is-feed/extract-tags` — Extracts semantic tags from any article title and body text.
