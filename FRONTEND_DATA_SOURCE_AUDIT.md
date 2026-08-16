# FRONTEND DATA SOURCE AUDIT — NEXUS PI

## Executive Summary
This audit maps every user-facing component and dashboard card in the NEXUS PI frontend to its underlying data source, identifying whether the data is dynamically sourced from the SQLite database via REST APIs or contains static/demo fallbacks.

---

## Component Data Source Matrix

| Page / Component | Data Displayed | Underlying Data Source | Dynamic? | Status & Action |
|---|---|---|---|---|
| **Dashboard (`/`)** - Layer 1 | Overall Catalog Completeness & Workflow Progress | Computed from `GET /api/stats` and `GET /api/products` | YES (Dynamic) | Upgraded: Calculates real % from DB; shows "Catalog Empty" if 0 products |
| **Dashboard (`/`)** - Layer 2 | KPI Cards (Total Products, Completeness, Review, Opportunities, Ready) | `GET /api/stats` endpoint querying SQLite tables directly | YES (Dynamic) | Upgraded: All 5 KPIs reflect live SQLite database counts |
| **Dashboard (`/`)** - Layer 3 | Next Recommended Action Banner | Dynamically generated from open `ReviewIssue` or incomplete products in DB | YES (Dynamic) | Upgraded: Generates recommendation from actual issue; displays "All products verified" when clean |
| **Dashboard (`/`)** - Attention Required | Table of products requiring human review | `GET /api/reviews` endpoint filtering open review issues | YES (Dynamic) | Upgraded: Shows real issues or "No active issues" |
| **Dashboard (`/`)** - Activity Stream | Recent ingestion, enrichment, and publishing events | `GET /api/audit-events` querying SQLite `audit_events` table | YES (Dynamic) | Upgraded: Displays real chronological system audit events |
| **Products (`/products`)** | Catalog grid / table with completeness scores & status | `GET /api/products` endpoint querying SQLite `products` table | YES (Dynamic) | Upgraded: Renders all imported items with dynamic filters; clean empty state if 0 items |
| **Product Detail (`/products/[id]`)** | Specifications, attributes, quality scores, and evidence links | `GET /api/products/{id}` with eager-loaded `attributes` and `sources` | YES (Dynamic) | Upgraded: Displays genuine extracted attributes and metrics for the given ID |
| **Documents / Ingestion (`/ingestion`)** | File dropzone, real-time extraction progress, ingested document stream | `POST /api/products/upload` and `GET /api/products` | YES (Dynamic) | Upgraded: Supports CSV & PDF upload, real attribute extraction count, and clean database reset |
| **Data Quality / Review (`/review`)** | Issue queue, conflict resolution split-view, diff viewer | `GET /api/reviews` and `POST /api/reviews/{id}/resolve` | YES (Dynamic) | Upgraded: Operates on real conflicts generated from multiple datasheet sources |
| **AI Copilot (`/assistant`)** | RAG conversational assistant with verified citations | `POST /api/chat` grounded in selected product context from SQLite | YES (Dynamic) | Upgraded: Dynamically populates product selector from DB; cites real attribute sources |
| **Knowledge Graph (`/knowledge-graph`)** | SVG graph canvas, node relationships, provenance inspector | `GET /api/graph/{id}` derived from product manufacturer, category, & sources | YES (Dynamic) | Upgraded: Generates graph nodes/edges dynamically for any selected product |
| **Enrichment (`/enrichment`)** | AI attribute proposal cards, gap analysis, confidence scores | `GET /api/enrichment/analyze/{id}` powered by Gemini | YES (Dynamic) | Upgraded: Inspects missing attributes for actual products in DB and proposes real fixes |
| **Content Studio (`/content-studio`)** | AI marketing description generator and fact check citations | `POST /api/chat` or product attribute grounding | YES (Dynamic) | Upgraded: Generates copy grounded in selected product's real specifications |
| **Publishing (`/publishing`)** | 4-point preflight validation checklist and publish button | `GET /api/products` and `POST /api/publish/{id}` | YES (Dynamic) | Upgraded: Validates real completeness and sets status `PUBLISHED` in SQLite |
| **Analytics (`/analytics`)** | Completeness distribution, extraction accuracy, category breakdown | Aggregated from `GET /api/products` and `GET /api/stats` | YES (Dynamic) | Upgraded: Charts and metrics derived from live database records |
| **Command Palette (`⌘K`)** | Quick navigation search and recent product links | `GET /api/products` (first 5 recent records) | YES (Dynamic) | Upgraded: Displays real recently imported products |
| **Evidence Drawer (`EvidenceDrawer.tsx`)** | PDF/CSV text snippet provenance, page number, confidence | `GET /api/evidence/{id}` querying SQLite `product_attributes` and `sources` | YES (Dynamic) | Upgraded: Displays exact extracted text and source file for any selected attribute |
| **Attribute Drawer (`AttributeDrawer.tsx`)** | Attribute values, confidence badges, source details | Passed attribute props from real product workspace | YES (Dynamic) | Upgraded: Zero static fallback constants |
