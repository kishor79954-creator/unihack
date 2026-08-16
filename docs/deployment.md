# NEXUS PI Deployment Guide

## Architecture Overview
NEXUS PI is a multi-tier AI Product Intelligence Platform designed for high-availability.

- **Frontend**: Next.js 14 (React) with Tailwind CSS
- **Backend**: Python FastAPI with async support
- **Database**: PostgreSQL (via SQLAlchemy)
- **Vector Search**: pgvector / ChromaDB
- **Knowledge Graph**: Neo4j (Graph Database)
- **Queue/Workers**: Celery + Redis

## Infrastructure Requirements

### Development (Local)
- Node.js v18+
- Python 3.11+
- SQLite (Local dev only)

### Production
- Vercel / AWS Amplify (Frontend)
- AWS ECS / Kubernetes (Backend API)
- AWS RDS (PostgreSQL 15+)
- Redis Cluster (Message Broker)
- Neo4j AuraDB Enterprise

## Environment Configuration
Do NOT commit `.env` files. Ensure the following variables are injected into the production environment.

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/nexus_pi

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=nexus-pi-docs

# Security
SECRET_KEY=generate-a-strong-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Deployment Checklist
- [ ] **1. Secrets Management**: Verify no API keys are hardcoded in the codebase.
- [ ] **2. Database Migrations**: Run `alembic upgrade head`. Do not manually alter production tables.
- [ ] **3. Security Headers**: Ensure API gateways enforce CORS policies restricting traffic to the frontend domain.
- [ ] **4. Observability Setup**: Integrate Datadog or AWS CloudWatch using the `/api/system/health` metrics endpoint.
- [ ] **5. Backup Strategy**: Verify RDS automated snapshots are configured for 7-day retention.

## Rollback Procedure
If a deployment fails:
1. Revert backend traffic routing in the load balancer to the previous stable container image.
2. If database schema was changed, do NOT roll back the code without also running the corresponding `alembic downgrade` script, or restoring from the pre-deployment snapshot if data corruption occurred.
3. Verify system health at `/system/health`.
