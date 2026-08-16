# NEXUS PI: Judge Questions & Defenses

This document prepares the team to answer the most common technical and business questions from judges.

### 1. Why is this different from standard RAG (Retrieval-Augmented Generation)?
**Answer:** Standard RAG retrieves chunks of text and feeds them to an LLM. It generates language, but it doesn't guarantee structural truth. NEXUS PI combines RAG with a **deterministic validation layer, an Evidence Graph, and Human-in-the-loop review**. We extract structured facts, grade their confidence, tie them explicitly to bounding boxes in PDFs, and prevent publishing if conflicts exist. It's built for data governance, not just chat.

### 2. Why use a Knowledge Graph (Neo4j)?
**Answer:** Industrial commerce is highly relational. A vector database can tell you what products have similar descriptions, but it can't definitively tell you that Product A is a replacement part for Assembly B, manufactured by Company C. A Knowledge Graph allows the AI to traverse hard, verified relationships (Compatibility, Alternatives, Supersessions) with 100% accuracy, which is critical for B2B procurement.

### 3. How do you prevent hallucinations?
**Answer:** By design, the AI is constrained. We use a three-tier system:
1. **Source Grounding:** AI output is strictly tied to uploaded source documents.
2. **Confidence Thresholds:** Extractions below a 90% confidence score are immediately quarantined in the "Review Center".
3. **Publishing Preflight:** The system physically blocks publishing if there are unresolved data conflicts (e.g., Supplier A says 10V, Supplier B says 12V).

### 4. How does the bulk processing scale?
**Answer:** The architecture is decoupled. The FastAPI backend delegates heavy document intelligence and AI extraction tasks to asynchronous background workers (via Celery/Redis). This allows a user to upload a 10,000-product catalog CSV, and the workers will churn through the queue horizontally without blocking the main UI or database threads.

### 5. How do you measure accuracy?
**Answer:** We measure two specific metrics: **Extraction Accuracy** (did the system correctly identify the value from the PDF) and **Citation Coverage** (what percentage of our published database has a verified source link). In our demo testing, citation coverage is over 95%.

### 6. What happens if the AI Provider (OpenAI/Anthropic) fails or rate limits?
**Answer:** We built NEXUS PI with production reliability in mind. We have wrapped external AI calls in robust try/except blocks that return structured 503 HTTP errors rather than crashing the system. Our asynchronous queue will simply retry the extraction jobs with exponential backoff.

### 7. How does this make money or save money for an enterprise?
**Answer:** It radically reduces the "Time-to-Site" for new products. Currently, B2B distributors employ teams of data stewards to manually read PDFs and copy-paste specs into a PIM (Product Information Management system). NEXUS PI automates this with high precision, saving thousands of manual hours while simultaneously improving the buyer experience by ensuring data is complete and accurate.
