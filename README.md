# NEXUS PI: Industrial Product Intelligence Platform

NEXUS PI transforms fragmented industrial product information (PDFs, catalogs, websites) into trusted, structured, connected, validated, and commerce-ready product intelligence.

## 🚀 The Value Proposition
Traditional PIMs just store data. Generic AI just generates text.
NEXUS PI **understands, validates, connects, enriches, and operationalizes** product intelligence using Evidence-Backed AI and Knowledge Graphs.

## 🏗️ Architecture

```text
                    INDUSTRIAL DATA (PDFs, Spreadsheets)
                          │
                   INGESTION LAYER
                          ↓
                DOCUMENT INTELLIGENCE
                          ↓
             ┌────────────┴────────────┐
             │                         │
       VALIDATION                  EVIDENCE
             │                         │
             └────────────┬────────────┘
                          ↓
                    TRUST ENGINE (Human-in-the-loop)
                          ↓
                  KNOWLEDGE GRAPH
                          ↓
                  HYBRID RETRIEVAL (Vector + Graph)
                          ↓
                    AI COPILOT
                          ↓
                 ENRICHMENT ENGINE
                          ↓
                    PUBLISHING
```

## ✨ Key Features
- **Evidence-Backed AI**: Every extracted product specification links directly to the source document and page where it was found.
- **Knowledge Graph RAG**: We don't just use vectors; we map products, manufacturers, alternatives, and compatibilities in a Neo4j Graph.
- **Autonomous Enrichment**: The system detects data gaps and proposes SEO and commerce content grounded *only* in verified facts.
- **Publishing Preflight**: A deterministic rules engine prevents publishing products that contain unverified data conflicts.

## 💻 Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Lucide React
- **Backend**: Python 3.11, FastAPI
- **Database**: PostgreSQL (SQLAlchemy)
- **Graph Database**: Neo4j
- **Workers**: Celery + Redis

## 🚀 Quick Start (Demo Mode)

### 1. Start Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python seed.py
python main.py
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to view the Executive Dashboard.

## 🛡️ Security & Observability
NEXUS PI includes full observability endpoints (`/health/live`, `/api/system/health`) and structured error boundary handling designed for enterprise Kubernetes deployments.
