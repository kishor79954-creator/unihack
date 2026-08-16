# DEMO DATA DEPENDENCY AUDIT — NEXUS PI

## Executive Summary
This audit inspects every file in the NEXUS PI codebase to identify any hardcoded demo strings, constants, fallback objects, or static demonstration data (e.g. `SKF 6205-2RS`, `ABB M3BP`, `87.6%`, hardcoded review conflicts, mock enrichment arrays).

All identified demo references in production runtime code are cataloged below with the required architectural correction to ensure 100% end-to-end data-driven execution across arbitrary user datasets.

---

## Complete Audit Table

| File | Line(s) | Demo Dependency | Classification | Runtime Impact | Action Required |
|---|---|---|---|---|---|
| `backend/seed.py` | 20-90 | SKF 6205-2RS and ABB M3BP seed data records | Seed Script (2) | Isolated to manual DB seeding; does not affect clean runtime imports | Retain as optional development test fixture; do not auto-seed on clean start |
| `backend/services/document_ai.py` | 140-210 | `_mock_llm_extraction` hardcoded SKF 6205-2RS bearing attributes and ABB conflicts | Backend Production Logic (3) / Runtime Dependency (7) | If Gemini fails or mock mode is active, arbitrary PDFs/CSVs fall back to SKF bearing data | Replace with generic text/CSV parser that dynamically derives attributes, product names, and SKUs from uploaded text |
| `backend/services/enrichment_engine.py` | 33-43 | `analyze_catalog` returns hardcoded numbers (`1248`, `3402`, `1840`, `920`) | Backend Production Logic (3) / Runtime Dependency (7) | `/api/enrichment/catalog` returns fake statistics regardless of imported data | Update `analyze_catalog` to calculate counts dynamically from SQLite `products` and `product_attributes` |
| `backend/main.py` | 77, 515, 579 | Fallback constants (`ai_confidence: 92.5`, `SKF Technical Datasheet`, `SKF Corporate DB`) | Backend Production Logic (3) | Unlinked product queries fell back to SKF strings | Update endpoints to dynamically derive metadata from actual product sources and attributes |
| `frontend/src/app/page.tsx` | 23, 45, 115, 159, 204, 252, 263 | Fallback `heroProduct`, hardcoded `87.6%`, hardcoded ABB voltage conflict banner, hardcoded attention required rows, hardcoded activity stream | Frontend Production Logic (4) / Runtime Dependency (7) | Dashboard displays SKF/ABB cards and fake review issues even when DB is empty or has a new dataset | Completely refactor to query `/api/stats`, `/api/products`, `/api/reviews`, `/api/audit-events` dynamically with clean empty state |
| `frontend/src/app/products/page.tsx` | 143 | Fallback manufacturer `"SKF"` | Frontend Production Logic (4) | Missing manufacturer displays "SKF" | Display `p.manufacturer || "Unspecified"` |
| `frontend/src/app/products/[id]/page.tsx` | 174, 207 | Fallback description `"deep groove ball bearing"` and source `"SKF Datasheet"` | Frontend Production Logic (4) | Product detail shows bearing description for non-bearing items | Use actual `product.description` and dynamic source names from `product.sources` |
| `frontend/src/app/content-studio/page.tsx` | 11-20 | Hardcoded `SKF 6205-2RS` text copy and fact check claims | Frontend Production Logic (4) | Content Studio only generates SKF ball bearing content | Connect to selected product in database and generate commerce copy from its real attributes |
| `frontend/src/app/publishing/page.tsx` | 47 | Hardcoded button text `"Publish Hero Product (SKF 6205-2RS)"` | Frontend Production Logic (4) | Publishing button implies only SKF product is published | Update to dynamic product selector and preflight check from DB |
| `frontend/src/app/assistant/page.tsx` | 56-59, 88, 211 | Hardcoded sample questions `"What are the verified specs of SKF 6205-2RS?"` and static dropdown option | Frontend Production Logic (4) | Copilot dropdown only lists SKF 6205-2RS | Populate product dropdown dynamically from `/api/products` and generate generic industrial queries |
| `frontend/src/app/catalog/duplicates/page.tsx` | 68, 73, 77, 93 | Hardcoded SKF duplicate comparison card | Frontend Production Logic (4) | Duplicate detector shows hardcoded SKF duplicate | Connect to `/api/catalog/duplicates` or database products |
| `frontend/src/components/layout/AppShell.tsx` | 107, 293-301 | Static workspace name `"SKF Industrial Group"` and hardcoded recent products in `⌘K` | Frontend Production Logic (4) | Command palette and header assume SKF tenant | Dynamically populate recent products from `/api/products` and generic workspace branding |
| `frontend/src/components/ui/AttributeDrawer.tsx` | 80 | Fallback source `"SKF Technical Manual, Page 2"` | Frontend Production Logic (4) | Attribute inspection falls back to SKF source | Display dynamic attribute source or `"Source Document"` |
| `frontend/src/components/ui/EvidenceDrawer.tsx` | 95, 103 | Fallback source `"SKF Technical Datasheet"` and document snippet | Frontend Production Logic (4) | Evidence drawer displays ball bearing text snippet | Display dynamic extracted text snippet and source name from backend |

---

## Architectural Resolution Plan
1. **Multi-Format Document Ingestion Engine (`backend/services/document_ai.py`)**:
   - Extract text from PDF, CSV, JSON, and XLSX.
   - For multi-row CSV datasets, parse all rows into individual catalog product records with dynamic attribute schemas.
   - Ground Gemini extraction in the actual document stream with zero hardcoded bearing fallbacks.
2. **Dynamic Backend Intelligence & Stats (`backend/main.py`, `backend/services/enrichment_engine.py`)**:
   - Compute all stats (`total_products`, `completeness`, `needs_review`, `conflicts`, `enrichment_opportunities`, `publishing_ready`) dynamically from SQLite tables.
   - Add `AuditEvent` audit logging to track real ingestion, enrichment, review, and publishing events.
3. **Dynamic Frontend Pages (`src/app/**`)**:
   - Every page fetches its data dynamically from REST endpoints (`/api/products`, `/api/stats`, `/api/reviews`, `/api/evidence/{id}`, `/api/graph/{id}`).
   - Render clean empty states when 0 products exist, and render 100% genuine product attributes when an arbitrary dataset (e.g. consumer electronics, automotive parts, industrial pumps) is imported.
