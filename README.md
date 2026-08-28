# Enterprise AI Research Agent ⚡

> An enterprise-grade, zero-cost semantic research and compliance workbench powered by local vector embeddings, deterministic schema validation, and a multi-agent governance board.

## 🌟 Key Features

* 🔒 100% Local & Sovereign Embeddings:** Powered by `sentence-transformers/all-MiniLM-L6-v2` and `ChromaDB`. Embeddings, vector storage, and kNN retrievals run entirely in-memory and on-disk with zero external API calls or data leaks.
* 🤖 Multi-Agent Tri-Persona Consensus Matrix:** Evaluates policy queries across three parallel governance micro-agents:
  * 🛡️ Security Auditor:** Evaluates RBAC, tenant isolation (`tenant_id`), and zero-trust safeguards.
  * ⚖️ Compliance Officer:** Checks adherence to regulatory standards (**ISO/IEC 27001**, **HIPAA Omnibus Rule 164.312**, **SEC Rule 17a-4 / FINRA**).
  * ⚡ Cloud Architect:** Evaluates retrieval latency, Redis caching layers, and PostgreSQL `pgvector` index sizing.
* 🔍 Interactive Vector Chunk Inspector:** Citation tags link directly to vector chunks in ChromaDB with an interactive modal displaying raw text snippets, similarity metrics, and metadata.
* 🎙️ Voice Executive Briefing:** Browser-native Text-to-Speech via the Web Speech API with a synchronized audio wave visualizer.
* 🎨 Live Multi-Theme Engine:** Toggle between **Blueprint** (Default Cyan), **Matrix** (Emerald Neon), **Amber** (Bloomberg Terminal), and **Linear** (Obsidian Matte) design modes.
* 📄 One-Click Markdown Export:** Generates and downloads structured `.md` executive reports with citations, risk analyses, and consensus scores.

## 🏗️ Architecture & Data Flow

```text
[ Document Ingestion (.TXT / .PDF) ]
                 │
                 ▼
[ Sliding Window Semantic Chunking ]
                 │
                 ▼
[ all-MiniLM-L6-v2 Vector Embeddings (In-Memory Singleton) ]
                 │
                 ▼
[ ChromaDB Persistent Vector Index (Local SQLite Storage) ]
                 │
       (Cosine Similarity Search)
                 │
                 ▼
[ FastAPI Research Agent + Domain Heuristics Engine ]
                 │
                 ▼
[ Strict Pydantic Schema Validation (Zero Hallucination) ]
                 │
                 ▼
[ Reactive Dashboard UI (Vite + Vanilla JS + CSS Tokens) ]

```

## 📁 Repository Structure

```text
enterprise-ai-research-agent/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   └── research_agent.py   # Multi-agent synthesis & scoring logic
│   │   ├── rag/
│   │   │   └── indexer.py          # Vector embedding & ChromaDB ingestion
│   │   ├── schemas/
│   │   │   └── models.py           # Pydantic deterministic response models
│   │   └── main.py                 # FastAPI application routes
│   ├── chroma_db/                  # Local vector database storage (git-ignored)
│   └── requirements.txt            # Python backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── main.js                 # UI logic, Web Speech API & modal handlers
│   │   └── style.css               # Design system & CSS theme tokens
│   ├── index.html                  # Main application markup
│   └── package.json                # Frontend dependencies & scripts
│
├── company_policy.txt              # Sample enterprise policy document
├── .gitignore                      # Git exclusion rules
└── README.md                       # Project documentation

```

## 🚀 Getting Started

### Prerequisites

* **Python**: `3.10` or higher
* **Node.js**: `18.x` or higher
* **Package Managers**: `pip` and `npm`

### 1. Backend Setup (FastAPI & ChromaDB)

Open a terminal and navigate to the `backend` folder:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn chromadb sentence-transformers pydantic python-multipart pypdf
uvicorn app.main:app --reload --port 8000

```

* **Swagger API Docs:** `http://127.0.0.1:8000/docs`
* **API Health Check:** `http://127.0.0.1:8000/api/health`

### 2. Frontend Setup (Vite Dashboard)

Open a second terminal and navigate to the `frontend` folder:

```powershell
cd frontend
npm install
npm run dev

```

* Live Application: `http://localhost:5173`

## 📡 API Reference

### Vector Document Ingestion

* Endpoint: `POST /api/upload`
* Content-Type: `multipart/form-data`
* Payload: `file: UploadFile`

```json
{
  "status": "success",
  "filename": "company_policy.txt",
  "chunks_indexed": 1
}

```

### Deterministic Research Synthesis

* Endpoint: `POST /api/research`
* Content-Type: `application/json`

Request Payload:

```json
{
  "query": "What are the microservices security and tenant isolation guidelines?",
  "target_industry": "Enterprise IT"
}

```

Response Payload:

```json
{
  "topic": "What are the microservices security and tenant isolation guidelines?",
  "executive_summary": "Enterprise IT architecture evaluation focusing on microservice scalability...",
  "confidence_score": 94.6,
  "findings": [
    {
      "title": "Insight from company_policy.txt",
      "analysis": "Acme Corp requires all microservices to use PostgreSQL with pgvector...",
      "citations": [
        {
          "source_id": "company_policy.txt",
          "quote": "Acme Corp requires all microservices to use PostgreSQL..."
        }
      ]
    }
  ],
  "agent_consensus": [
    {
      "role": "Security Auditor",
      "icon": "🛡️",
      "verdict": "VERIFIED",
      "score": 96.2,
      "rationale": "Tenant isolation and RBAC verified against Kubernetes microservices architecture."
    }
  ],
  "strategic_recommendations": [
    "Standardize API-first data ingestion pipelines across distributed Kubernetes microservices."
  ],
  "identified_risks_or_gaps": [
    "Data fragmentation across legacy relational databases and unstructured vector silos."
  ]
}

```

---

## 🛡️ Deterministic Validation & Guardrails

All research synthesis outputs are mapped through strict Pydantic schemas before reaching the client layer. This architecture ensures complete structural predictability, type safety, and verifiable citation lineage across enterprise integration pipelines.

```
