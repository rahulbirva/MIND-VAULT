# 🧭 MindVault — Proactive Discovery Engine

Autonomous practical knowledge discovery engine for MindVault (DSU DevHack 3.0, team Cosmic Coders).

Instead of relying on user-declared interests, this engine surfaces practically useful knowledge (laws, consumer rights, financial mechanics, health facts, and civic systems) from a dynamically refreshed AI pool, scrapes real-world articles, and simplifies them using local Qwen 2.5 (`qwen2.5:7b`) into memorable 5-field summaries.

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────────┐
│               Category Generator (Weekly: 7 Days)             │
│  category_generator.py ──> Ollama (qwen2.5:7b)                │
│  Outputs: practical, real-world categories (no trivia)        │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                 Topic Generator (Daily: 24 Hours)             │
│  discovery_generator.py ──> Ollama (qwen2.5:7b)               │
│  Outputs: actionable claim/question search queries            │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                   Discovery Topics Selector                   │
│  discovery_topics.py ──> get_random_topic(exclude=used_topics)│
│  Picks unshown topic from active pool; auto-cycles on empty   │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                    Discovery Post Assembly                    │
│  discovery.py ──> suggest_articles_for_interest               │
│               ──> has_seen_url dedup check                    │
│               ──> scrape_article (real body text)             │
│               ──> simplify_text (5-field post dict)           │
│               ──> save_post + mark_discovery_topic_used       │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔌 Connecting with Backend & Frontend

### 1. Start the Discovery REST API Server
```bash
# From the discovery folder:
uvicorn api:app --host 0.0.0.0 --port 8000 --reload

# Or directly with python:
python api.py
```

### 2. Available API Endpoints

| Method | Endpoint | Description | Sample Request / Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/discovery/daily-post` | Generates a fresh discovery post for a user | `{"userId": "user_123"}` -> Full Post JSON |
| `GET` | `/api/discovery/random-topic` | Returns a random unshown topic | `{"topic": "how credit scores are calculated"}` |
| `GET` | `/api/discovery/categories` | Returns all active refreshed categories | `{"categories": ["rights & law", ...], "count": 5}` |
| `GET` | `/api/discovery/feed/{userId}` | Returns saved discovery posts for a user | `{"userId": "user_123", "posts": [...]}` |
| `GET` | `/api/discovery/health` | Healthcheck & system status | `{"status": "ok", "db_online": true}` |

---

## 💻 Integration Code Snippets

### In Node.js / Express Backend:
```javascript
const axios = require('axios');
const DISCOVERY_API = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

async function getDailyDiscovery(userId) {
  const { data } = await axios.post(`${DISCOVERY_API}/api/discovery/daily-post`, {
    userId: userId || 'default_user'
  });
  return data;
}
```

### In React Frontend:
```javascript
export async function fetchDiscoveryPost(userId = 'default_user') {
  const res = await fetch('http://localhost:5000/api/discovery/daily-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}
```

---

## 🖥️ Running the Interactive Streamlit Demo App

To test all engine layers interactively:
```bash
streamlit run demo_app.py
```
Visit: `http://localhost:8502`
