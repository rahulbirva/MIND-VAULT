# MindVault 🧠

MindVault is an AI-powered personal learning platform designed to help curious learners understand and retain complex topics through intelligent content discovery, AI-driven simplification, interactive deep dives, and knowledge mastery quizzes.

---

## 📁 Repository Structure

```
MIND-VAULT/
├── Backend/              # Node.js & Express API server (port 5000)
│   ├── src/              # Routes, Mongoose models, and services
│   └── package.json
│
├── Frontend/             # React + Vite web client (port 5173)
│   ├── src/              # Pages (Feed, Discovery, DeepDive, Vault), components
│   └── package.json
│
└── mindvault-ai/         # Python AI microservice & pipelines (port 8000 / 8501)
    ├── api.py            # FastAPI bridge consumed by Backend
    ├── app.py            # Standalone Streamlit exploration UI
    ├── pipeline.py       # End-to-end interest expansion & simplification pipeline
    ├── simplifier.py     # Qwen 2.5 / Ollama simplification engine
    ├── scraper.py        # Web text & OpenGraph image extraction
    ├── article_suggester.py # Search & topic suggestion
    ├── requirements.txt  # Python dependencies
    └── .env.example      # AI environment variable template
```

---

## 🏗️ Architecture

```
                      ┌─────────────────────────┐
                      │  Frontend (Vite / React) │  port 5173
                      └───────────┬─────────────┘
                                  │ HTTP / REST
                                  ▼
                      ┌─────────────────────────┐
                      │ Express Backend (Node)  │  port 5000
                      └───────────┬─────────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
      ┌─────────────────────┐           ┌─────────────────────┐
      │  MongoDB Database   │           │   mindvault-ai/     │  port 8000
      │  (Atlas / Local)    │           │ (FastAPI + Ollama)  │
      └─────────────────────┘           └─────────────────────┘
                                                   │
                                        ┌──────────┴──────────┐
                                        ▼                     ▼
                             ┌───────────────────┐  ┌───────────────────┐
                             │ DuckDuckGo Search │  │ Streamlit Testing │ port 8501
                             │ & Web Scraper     │  │ App (app.py)      │
                             └───────────────────┘  └───────────────────┘
```

---

## 🚀 Getting Started

### 1. Python AI Microservice (`mindvault-ai/`)

```bash
# Navigate to the AI service directory
cd mindvault-ai

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# (Optional) Run Ollama locally
ollama run qwen2.5:7b

# Start the FastAPI service (port 8000)
python -m uvicorn api:app --port 8000 --reload

# Or run the standalone Streamlit testing UI (port 8501)
streamlit run app.py
```

### 2. Node.js Express Backend (`Backend/`)

```bash
cd Backend
npm install
cp .env.example .env
npm run dev
# Running on http://localhost:5000
```

### 3. Frontend (`Frontend/`)

```bash
cd Frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 📡 API Contract (Python AI Microservice on `:8000`)

| Endpoint | Method | Input Body | Description |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | — | Health check & active model metadata |
| `/simplify` | `POST` | `{ "topics": ["space", "politics"] }` | Generates simplified feed cards (`summary`, `keyPoints`, `videoUrl`) |
| `/deepdive` | `POST` | `{ "topic": "Black Holes" }` | In-depth crash course, key facts, and 3 open-ended quiz questions |
| `/grade` | `POST` | `{ "topic": "...", "questions": [...], "answers": [...] }` | Evaluates student quiz answers for conceptual mastery |

---

## 🛡️ License

ISC