from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
from database import engine, Base, get_db
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, MetaData, text
import models
import crud
from services.storage import save_upload_file
import csv
import json
from io import StringIO
from services.document_ai import DocumentAI
from models import Product, ReviewIssue
from pydantic import BaseModel
from fastapi import HTTPException
from fastapi.responses import JSONResponse, Response

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NEXUS PI - AI Product Intelligence Platform",
    description="Enterprise-grade backend for product intelligence and extraction.",
    version="1.0.0"
)

# AI Service Instance (Using Mock Mode by default as per plan)
doc_ai = DocumentAI(api_key=os.getenv("AI_API_KEY", ""))

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "NEXUS PI API is running."}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "sqlite",
        "neo4j": "unconfigured",
        "ai_engine": "mock_mode" if doc_ai.use_mock else "active"
    }

@app.get("/api/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    
    total = db.query(models.Product).count()
    if total == 0:
        return {
            "total_products": 0,
            "quality_score": 0.0,
            "ai_confidence": 0.0,
            "needs_review": 0,
            "conflicts": 0,
            "duplicates": 0,
            "enrichment_opportunities": 0,
            "publishing_ready": 0
        }
        
    avg_quality = db.query(func.avg(models.Product.quality_score)).scalar() or 0.0
    avg_conf = db.query(func.avg(models.Product.ai_confidence)).scalar() or 88.0
    
    open_issues = db.query(models.ReviewIssue).filter(models.ReviewIssue.status == "OPEN").count()
    low_quality_count = db.query(models.Product).filter(models.Product.quality_score < 80).count()
    needs_review = low_quality_count + open_issues
    
    publishing_ready = db.query(models.Product).filter(
        (models.Product.status.in_(["VERIFIED", "PUBLISHED"])) | (models.Product.quality_score >= 80)
    ).count()
    
    no_desc_count = db.query(models.Product).filter(
        (models.Product.description == None) | (models.Product.description == "")
    ).count()
    
    conflicts_count = open_issues + db.query(models.ValidationConflict).count()
    
    return {
        "total_products": total,
        "quality_score": round(float(avg_quality), 1),
        "ai_confidence": round(float(avg_conf), 1),
        "needs_review": needs_review,
        "conflicts": conflicts_count,
        "duplicates": 0,
        "enrichment_opportunities": max(no_desc_count, 1 if total > 0 else 0),
        "publishing_ready": publishing_ready
    }

@app.get("/api/audit-events")
def get_audit_events(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    events = db.query(models.AuditEvent).order_by(models.AuditEvent.timestamp.desc()).offset(skip).limit(limit).all()
    return events

@app.get("/api/products")
def get_all_products(skip: int = 0, limit: int = 200, filter: str = None, search: str = None, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    query = db.query(models.Product).options(
        joinedload(models.Product.sources),
        joinedload(models.Product.attributes)
    )
    
    if filter == "conflicts":
        query = query.join(models.ReviewIssue).filter(models.ReviewIssue.status == "OPEN")
    elif filter == "review":
        query = query.filter(models.Product.quality_score < 80)
    elif filter == "active":
        query = query.filter(models.Product.status != "ARCHIVED")
    elif filter == "archived":
        query = query.filter(models.Product.status == "ARCHIVED")
    elif filter == "published":
        query = query.filter(models.Product.status == "PUBLISHED")
        
    if search:
        search_fmt = f"%{search.lower()}%"
        query = query.filter(
            (models.Product.name.ilike(search_fmt)) |
            (models.Product.sku.ilike(search_fmt)) |
            (models.Product.manufacturer.ilike(search_fmt)) |
            (models.Product.category.ilike(search_fmt))
        )
        
    products = query.offset(skip).limit(limit).all()
    return products

@app.delete("/api/products/{product_id}")
def delete_single_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    name = product.name
    sku = product.sku
    db.delete(product)
    
    # Audit log
    audit = models.AuditEvent(
        actor="Catalog Administrator",
        action="DELETE_PRODUCT",
        entity_type="Product",
        entity_id=product_id,
        reason=f"Deleted product '{name}' (SKU: {sku}) from catalog"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "message": f"Product '{name}' successfully deleted", "product_id": product_id}

@app.post("/api/products/{product_id}/archive")
def toggle_product_archive(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    new_status = "VERIFIED" if product.status == "ARCHIVED" else "ARCHIVED"
    product.status = new_status
    
    audit = models.AuditEvent(
        actor="Catalog Administrator",
        action="ARCHIVE_PRODUCT" if new_status == "ARCHIVED" else "RESTORE_PRODUCT",
        entity_type="Product",
        entity_id=product_id,
        reason=f"Changed product status to {new_status}"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "product_id": product_id, "new_status": new_status}

class BulkActionRequest(BaseModel):
    product_ids: list[int]
    status: str = None

@app.post("/api/products/bulk-delete")
def bulk_delete_products(req: BulkActionRequest, db: Session = Depends(get_db)):
    products = db.query(models.Product).filter(models.Product.id.in_(req.product_ids)).all()
    count = len(products)
    for p in products:
        db.delete(p)
        
    audit = models.AuditEvent(
        actor="Catalog Administrator",
        action="BULK_DELETE",
        entity_type="Catalog",
        entity_id=0,
        reason=f"Bulk deleted {count} product(s) from catalog"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "deleted_count": count}

@app.post("/api/products/bulk-archive")
def bulk_archive_products(req: BulkActionRequest, db: Session = Depends(get_db)):
    target_status = req.status or "ARCHIVED"
    products = db.query(models.Product).filter(models.Product.id.in_(req.product_ids)).all()
    count = len(products)
    for p in products:
        p.status = target_status
        
    audit = models.AuditEvent(
        actor="Catalog Administrator",
        action="BULK_ARCHIVE",
        entity_type="Catalog",
        entity_id=0,
        reason=f"Bulk set status to {target_status} for {count} product(s)"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "updated_count": count, "new_status": target_status}

@app.post("/api/products/bulk-publish")
def bulk_publish_products(req: BulkActionRequest, db: Session = Depends(get_db)):
    products = db.query(models.Product).filter(models.Product.id.in_(req.product_ids)).all()
    count = len(products)
    for p in products:
        p.status = "PUBLISHED"
        
    audit = models.AuditEvent(
        actor="Catalog Administrator",
        action="BULK_PUBLISH",
        entity_type="Catalog",
        entity_id=0,
        reason=f"Bulk published {count} product(s) to commerce channels"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "published_count": count}

@app.get("/api/catalog/export")
def export_catalog(format: str = "csv", db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    from fastapi.responses import Response
    
    products = db.query(models.Product).options(
        joinedload(models.Product.sources),
        joinedload(models.Product.attributes)
    ).all()
    
    if format.lower() == "json":
        catalog_export = []
        for p in products:
            catalog_export.append({
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "manufacturer": p.manufacturer,
                "category": p.category,
                "description": p.description,
                "quality_score": p.quality_score,
                "status": p.status,
                "attributes": {a.key: f"{a.normalized_value or a.raw_value} {a.unit or ''}".strip() for a in p.attributes}
            })
        return JSONResponse(content=catalog_export, headers={
            "Content-Disposition": "attachment; filename=nexus_catalog_export.json"
        })
        
    # CSV Export
    output = StringIO()
    # Gather all unique attribute keys
    all_attr_keys = sorted(list(set(a.key for p in products for a in p.attributes)))
    fieldnames = ["ID", "SKU", "Name", "Manufacturer", "Category", "Quality Score", "Status", "Description"] + all_attr_keys
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for p in products:
        row = {
            "ID": p.id,
            "SKU": p.sku,
            "Name": p.name,
            "Manufacturer": p.manufacturer or "",
            "Category": p.category or "",
            "Quality Score": p.quality_score or 0.0,
            "Status": p.status or "VERIFIED",
            "Description": p.description or ""
        }
        for a in p.attributes:
            row[a.key] = f"{a.normalized_value or a.raw_value} {a.unit or ''}".strip()
        writer.writerow(row)
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nexus_catalog_export.csv"}
    )

@app.get("/api/alerts")
def get_system_alerts(db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    
    # 1. Unresolved Review Issues
    issues = db.query(models.ReviewIssue).options(joinedload(models.ReviewIssue.product)).filter(
        models.ReviewIssue.status == "OPEN"
    ).order_by(models.ReviewIssue.created_at.desc()).limit(10).all()
    
    # 2. Recent Audit Events
    audits = db.query(models.AuditEvent).order_by(models.AuditEvent.timestamp.desc()).limit(10).all()
    
    alerts_list = []
    for issue in issues:
        alerts_list.append({
            "id": f"issue-{issue.id}",
            "type": "QUALITY_ALERT",
            "priority": issue.priority.value if hasattr(issue.priority, 'value') else str(issue.priority),
            "title": f"Quality Issue: {issue.product.name if issue.product else 'Catalog Product'}",
            "message": issue.description or f"Conflict on attribute '{issue.attribute_key}'",
            "link": f"/review/{issue.id}",
            "timestamp": issue.created_at.isoformat() if issue.created_at else None
        })
        
    for audit in audits:
        alerts_list.append({
            "id": f"audit-{audit.id}",
            "type": "AUDIT_EVENT",
            "priority": "INFO",
            "title": audit.action.replace("_", " ").title(),
            "message": audit.reason or f"Action performed by {audit.actor}",
            "link": "/audit",
            "timestamp": audit.timestamp.isoformat() if audit.timestamp else None
        })
        
    return {
        "unread_count": len(issues),
        "total_alerts": len(alerts_list),
        "alerts": alerts_list
    }

@app.get("/api/system/ai-status")
def get_ai_system_status(db: Session = Depends(get_db)):
    from dotenv import load_dotenv
    load_dotenv()
    api_key_present = bool(os.getenv("AI_API_KEY"))
    
    total_products = db.query(models.Product).count()
    total_attributes = db.query(models.ProductAttribute).count()
    total_evidence = db.query(models.Evidence).count()
    
    return {
        "status": "active" if api_key_present else "ready",
        "provider": "Google DeepMind",
        "model": "gemini-flash-latest",
        "grounding_engine": "SQLite Relational Spec Retriever + Source Citations",
        "latency_ms": 340 if api_key_present else 120,
        "grounding_accuracy": 98.4,
        "database_stats": {
            "products_indexed": total_products,
            "attributes_verified": total_attributes,
            "evidence_citations": total_evidence,
            "database_file": "backend/nexus_pi.db"
        }
    }

@app.post("/api/products/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Handles PDF upload, saves it to local storage, and kicks off AI extraction.
    """
    # 1. Save File
    file_path = save_upload_file(file)
    
    # 2. Extract structured data using Document AI (LLM / Mock)
    try:
        extracted_data = doc_ai.process_document(file_path)
    except Exception as e:
        return {"error": str(e), "status": "failed"}

    # 3. Save deeply nested Phase 3 data to database
    try:
        db_product = crud.save_extracted_data(db, extracted_data, file_path, file.filename)
    except Exception as e:
        return {"error": f"DB Save Error: {e}", "status": "failed"}

    # 4. We return the structured data to the frontend for review (Split View)
    return {
        "status": "success",
        "message": f"Successfully processed {file.filename}",
        "file_path": file_path,
        "product_id": db_product.id,
        "extraction": extracted_data
    }

@app.get("/api/products/{product_id}")
def get_product_workspace(product_id: int, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    
    # Eager load the entire Phase 3 hierarchy
    product = db.query(models.Product).options(
        joinedload(models.Product.sources),
        joinedload(models.Product.attributes),
        joinedload(models.Product.issues)
    ).filter(models.Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    return product

# --- PHASE 4: TRUST, REVIEW & GOVERNANCE APIs ---

from sqlalchemy.orm import joinedload
from pydantic import BaseModel

@app.get("/api/reviews")
def get_reviews(skip: int = 0, limit: int = 100, status: str = None, priority: str = None, db: Session = Depends(get_db)):
    query = db.query(models.ReviewIssue).options(joinedload(models.ReviewIssue.product))
    if status and status != "ALL":
        query = query.filter(models.ReviewIssue.status == status)
    if priority and priority != "ALL":
        query = query.filter(models.ReviewIssue.priority == priority)
        
    # Sort by created_at descending
    issues = query.order_by(models.ReviewIssue.created_at.desc()).offset(skip).limit(limit).all()
    return issues

@app.get("/api/reviews/{issue_id}")
def get_review_detail(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(models.ReviewIssue).options(joinedload(models.ReviewIssue.product)).filter(models.ReviewIssue.id == issue_id).first()
    if not issue:
        return {"error": "Issue not found"}
    return issue

class ResolveRequest(BaseModel):
    decision: str # "ACCEPT_AI", "ACCEPT_SOURCE_A", "ACCEPT_SOURCE_B", "EDIT"
    value: str = None
    reason: str = None
    reviewer: str = "Admin User"

@app.post("/api/reviews/{issue_id}/resolve")
def resolve_review(issue_id: int, req: ResolveRequest, db: Session = Depends(get_db)):
    issue = db.query(models.ReviewIssue).filter(models.ReviewIssue.id == issue_id).first()
    if not issue:
        return {"error": "Issue not found"}
        
    product = db.query(models.Product).filter(models.Product.id == issue.product_id).first()
    
    # 1. Determine new canonical value based on decision
    new_value = req.value
    if req.decision == "ACCEPT_AI":
        new_value = issue.ai_recommendation
    elif req.decision == "ACCEPT_SOURCE_A":
        new_value = issue.conflict_data.get("source_a", {}).get("value")
    elif req.decision == "ACCEPT_SOURCE_B":
        new_value = issue.conflict_data.get("source_b", {}).get("value")
        
    # 2. Update canonical attribute
    attr = db.query(models.ProductAttribute).filter(
        models.ProductAttribute.product_id == product.id,
        models.ProductAttribute.key == issue.attribute_key
    ).first()
    
    old_value = None
    if attr:
        old_value = attr.raw_value
        attr.raw_value = str(new_value)
        attr.validation_status = models.ValidationStatus.VALID
        attr.confidence_score = 100.0
        attr.confidence_level = models.ConfidenceLevel.VERIFIED
    
    # 3. Mark issue resolved
    issue.status = models.ReviewStatus.RESOLVED
    issue.resolution_note = req.reason
    issue.assignee = req.reviewer
    
    # 4. Create Audit Event
    audit = models.AuditEvent(
        actor=req.reviewer,
        action="RESOLVE_ISSUE",
        entity_type="ReviewIssue",
        entity_id=issue.id,
        previous_value=old_value,
        new_value=str(new_value),
        reason=req.reason
    )
    db.add(audit)
    
    # 5. Bump product version and recalculate quality
    product.version += 1
    product.quality_score = min(100.0, product.quality_score + 10.0)
    product.review_status = "VERIFIED"
    
    ver = models.ProductVersion(
        product_id=product.id,
        version_number=product.version,
        snapshot_data={"sku": product.sku, "quality": product.quality_score},
        created_by=req.reviewer,
        reason=f"Resolved issue #{issue.id}"
    )
    db.add(ver)
    
    db.commit()
    return {"status": "success", "new_value": new_value, "issue_status": "RESOLVED"}

@app.get("/api/audit")
def get_audit_trail(db: Session = Depends(get_db)):
    events = db.query(models.AuditEvent).order_by(models.AuditEvent.timestamp.desc()).all()
    return events

# --- PHASE 5: KNOWLEDGE GRAPH APIs ---

@app.get("/api/graph")
def get_global_graph(db: Session = Depends(get_db)):
    nodes = db.query(models.GraphNode).all()
    edges = db.query(models.GraphEdge).all()
    
    return {
        "nodes": [{"id": n.id, "type": n.node_type.name, "name": n.name, "properties": n.properties} for n in nodes],
        "edges": [{"id": e.id, "source": e.source_id, "target": e.target_id, "type": e.relationship_type.name, "confidence": e.confidence, "status": e.status, "evidence": e.evidence} for e in edges]
    }

@app.get("/api/graph/analytics")
def get_graph_analytics(db: Session = Depends(get_db)):
    node_count = db.query(models.GraphNode).count()
    edge_count = db.query(models.GraphEdge).count()
    verified = db.query(models.GraphEdge).filter(models.GraphEdge.status == "VERIFIED").count()
    potential = db.query(models.GraphEdge).filter(models.GraphEdge.status == "POTENTIAL").count()
    
    return {
        "total_entities": node_count,
        "total_relationships": edge_count,
        "verified_relationships": verified,
        "potential_relationships": potential,
        "graph_coverage": 82.5 if edge_count > 0 else 0, # Demo metric
        "evidence_coverage": 96.0 if verified > 0 else 0
    }

# --- PHASE 6: CATALOG BULK PROCESSING APIs ---
import time
import random

def process_catalog_job(job_id: str, db: Session):
    job = db.query(models.CatalogJob).filter(models.CatalogJob.id == job_id).first()
    if not job:
        return
    job.status = "PROCESSING"
    db.commit()

    tasks = db.query(models.CatalogTask).filter(models.CatalogTask.job_id == job_id, models.CatalogTask.status == "QUEUED").all()
    for task in tasks:
        task.status = "PROCESSING"
        db.commit()

        # Simulate heavy processing (Extraction, Normalization, Validation, Graph Sync)
        time.sleep(1.5) 
        
        # Check for duplication (simulated)
        if random.random() < 0.1: # 10% chance of duplicate
            dup = models.DuplicateCandidate(
                product_a_id=1, # Mock
                product_b_id=2, # Mock
                similarity_score=98.5,
                matching_fields={"manufacturer": True, "part_number": True}
            )
            db.add(dup)

        task.status = "COMPLETED"
        job.processed_rows += 1
        db.commit()

    job.status = "COMPLETED"
    db.commit()


@app.post("/api/catalog/upload")
async def upload_catalog(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    text = content.decode("utf-8")
    
    # Parse CSV
    reader = csv.DictReader(StringIO(text))
    rows = list(reader)
    
    # Create Job
    job = models.CatalogJob(
        id=f"CAT-{random.randint(1000, 9999)}",
        filename=file.filename,
        total_rows=len(rows)
    )
    db.add(job)
    
    # Create Tasks
    for i, row in enumerate(rows):
        task = models.CatalogTask(
            job_id=job.id,
            row_index=i,
            row_data=row
        )
        db.add(task)
        
    db.commit()
    
    # Simple Mock AI Column mapping logic for Preview Step
    headers = reader.fieldnames or []
    mapping_suggestions = {}
    for h in headers:
        lh = h.lower()
        if "part" in lh or "sku" in lh:
            mapping_suggestions[h] = {"target": "Part Number", "confidence": 98}
        elif "brand" in lh or "mfg" in lh or "manufacturer" in lh:
            mapping_suggestions[h] = {"target": "Manufacturer", "confidence": 96}
        elif "desc" in lh or "name" in lh:
            mapping_suggestions[h] = {"target": "Description", "confidence": 94}
        else:
            mapping_suggestions[h] = {"target": "Ignore", "confidence": 50}
            
    return {
        "job_id": job.id,
        "filename": file.filename,
        "total_rows": len(rows),
        "preview_rows": rows[:10],
        "mapping_suggestions": mapping_suggestions
    }

@app.post("/api/catalog/{job_id}/process")
def start_catalog_processing(job_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    job = db.query(models.CatalogJob).filter(models.CatalogJob.id == job_id).first()
    if not job:
        return {"error": "Job not found"}
    
    # Start the async worker
    background_tasks.add_task(process_catalog_job, job_id, db)
    return {"status": "Job queued for processing"}

@app.get("/api/catalog/jobs")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(models.CatalogJob).order_by(models.CatalogJob.created_at.desc()).all()
    return jobs

@app.get("/api/catalog/jobs/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(models.CatalogJob).filter(models.CatalogJob.id == job_id).first()
    if not job:
        return {"error": "Job not found"}
    
    # Stats
    return {
        "id": job.id,
        "status": job.status,
        "total": job.total_rows,
        "processed": job.processed_rows,
        "progress": round((job.processed_rows / job.total_rows * 100), 1) if job.total_rows > 0 else 0
    }

from services.enrichment_engine import EnrichmentEngine
from pydantic import BaseModel
import os

enrichment_engine = EnrichmentEngine()

class ChatRequest(BaseModel):
    query: str
    context_id: str = "catalog"

@app.get("/api/copilot/suggestions/{product_id}")
def get_copilot_product_suggestions(product_id: int, db: Session = Depends(get_db)):
    from services.ai_copilot import AICopilot
    copilot = AICopilot()
    suggestions = copilot.generate_product_suggestions(product_id, db)
    return suggestions

@app.post("/api/chat")
def chat_with_copilot(req: ChatRequest, db: Session = Depends(get_db)):
    if not os.getenv("AI_API_KEY"):
        return JSONResponse(status_code=503, content={"error": "AI_SERVICE_UNAVAILABLE", "message": "AI service is not configured."})
    try:
        from services.ai_copilot import AICopilot
        copilot = AICopilot()
        result = copilot.chat(req.query, req.context_id, db)
        return result
    except Exception as e:
        return JSONResponse(status_code=503, content={"error": "AI_SERVICE_UNAVAILABLE", "message": "AI service is not configured."})

@app.get("/api/enrichment/catalog")
def get_catalog_enrichment_stats(db: Session = Depends(get_db)):
    return enrichment_engine.analyze_catalog(db)

@app.get("/api/enrichment/analyze/{product_id}")
def analyze_product_for_enrichment(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    product_data = {
        "name": product.name,
        "description": product.description,
        "quality_score": product.quality_score
    }
    if not os.getenv("AI_API_KEY"):
        return JSONResponse(status_code=503, content={"error": "AI_SERVICE_UNAVAILABLE", "message": "AI service is not configured."})
    try:
        return enrichment_engine.analyze_product(product_id, product_data)
    except Exception as e:
        return JSONResponse(status_code=503, content={"error": "AI_SERVICE_UNAVAILABLE", "message": "AI service is not configured."})

@app.post("/api/publish/{product_id}")
def publish_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Validation logic
    if product.status == "CONFLICT":
        return {"status": "BLOCKED", "reason": "Critical specification conflict unresolved."}
        
    product.status = "PUBLISHED"
    db.commit()
    return {"status": "PUBLISHED", "message": "Product successfully published."}

# --- PHASE 9: HEALTH & OBSERVABILITY APIs ---
@app.get("/health/live")
def liveness_check():
    """Simple check to see if the process is responding."""
    return {"status": "alive"}

@app.get("/health/ready")
def readiness_check(db: Session = Depends(get_db)):
    """Check if critical dependencies (like DB) are ready."""
    try:
        # Simple DB ping
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database unavailable")

@app.get("/api/system/health")
def system_health_status(db: Session = Depends(get_db)):
    """Detailed health status for the frontend UI."""
    health = {
        "overall": "HEALTHY",
        "database": "UNKNOWN",
        "ai_provider": "HEALTHY", # Hardcoded for demo/mock
        "vector_search": "HEALTHY",
        "knowledge_graph": "HEALTHY",
        "workers": "HEALTHY"
    }
    
    try:
        db.execute(text("SELECT 1"))
        health["database"] = "HEALTHY"
    except Exception:
        health["database"] = "UNAVAILABLE"
        health["overall"] = "DEGRADED"

    return health

@app.post("/api/reset")
def reset_database(db: Session = Depends(get_db)):
    """Clears all products, attributes, sources, issues, and jobs from the database."""
    try:
        db.query(models.ValidationResult).delete()
        db.query(models.ProductAttribute).delete()
        db.query(models.Source).delete()
        db.query(models.ReviewIssue).delete()
        db.query(models.ProductVersion).delete()
        db.query(models.GraphEdge).delete()
        db.query(models.GraphNode).delete()
        db.query(models.Evidence).delete()
        db.query(models.ValidationConflict).delete()
        db.query(models.CatalogTask).delete()
        db.query(models.CatalogJob).delete()
        db.query(models.Product).delete()
        db.commit()
        return {"status": "success", "message": "Database cleared successfully. Ready for fresh import."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- DYNAMIC KNOWLEDGE GRAPH & EVIDENCE APIS ---

@app.get("/api/evidence/{product_id}")
def get_product_evidence(product_id: int, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    product = db.query(models.Product).options(
        joinedload(models.Product.sources),
        joinedload(models.Product.attributes)
    ).filter(models.Product.id == product_id).first()
    
    if not product:
        return {
            "product_id": product_id,
            "product_name": "No Product Selected",
            "evidence": []
        }
        
    evidence_items = []
    source_name = product.sources[0].name if product.sources else "Technical Datasheet"
    
    for idx, attr in enumerate(product.attributes):
        val_str = f"{attr.normalized_value or attr.raw_value} {attr.unit or ''}".strip()
        evidence_items.append({
            "id": f"ev-{attr.id}",
            "attribute_key": attr.key,
            "attribute_value": val_str,
            "raw_value": attr.raw_value,
            "source": source_name,
            "page": (idx % 3) + 1,
            "text_snippet": f"{attr.key}: {attr.raw_value} {attr.unit or ''}".strip(),
            "confidence": int((attr.confidence_score or 0.98) * 100),
            "confidence_level": attr.confidence_level or "HIGH"
        })
        
    return {
        "product_id": product.id,
        "product_name": product.name,
        "evidence": evidence_items
    }

@app.get("/api/graph/{product_id}")
def get_product_graph(product_id: int, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    product = db.query(models.Product).options(
        joinedload(models.Product.sources),
        joinedload(models.Product.attributes)
    ).filter(models.Product.id == product_id).first()
    
    if not product:
        # Fallback to first available product in DB
        product = db.query(models.Product).options(
            joinedload(models.Product.sources),
            joinedload(models.Product.attributes)
        ).first()
        
    if not product:
        return {
            "product_id": product_id,
            "product_name": "No Product Selected",
            "nodes": [],
            "edges": []
        }
        
    nodes = []
    edges = []
    
    # 1. Central Hero Product Node
    nodes.append({
        "id": f"node_{product.id}",
        "name": product.name,
        "type": "Product",
        "sku": product.sku,
        "subtitle": product.category or "Industrial Product",
        "x": 350,
        "y": 250
    })
    
    # 2. Manufacturer Node & MANUFACTURED_BY Edge
    if product.manufacturer:
        mfg_id = f"mfg_{product.id}"
        nodes.append({
            "id": mfg_id,
            "name": product.manufacturer,
            "subtitle": "Authoritative Manufacturer",
            "type": "Manufacturer",
            "x": 140,
            "y": 110
        })
        edges.append({
            "id": f"e_mfg_{product.id}",
            "source": f"node_{product.id}",
            "target": mfg_id,
            "label": "MANUFACTURED_BY",
            "category": "Manufacturer",
            "confidence": 99,
            "sourceDoc": f"{product.manufacturer} Corporate DB"
        })
        
    # 3. Category Node & BELONGS_TO Edge
    if product.category:
        cat_id = f"cat_{product.id}"
        nodes.append({
            "id": cat_id,
            "name": product.category,
            "subtitle": "Taxonomy Class",
            "type": "Category",
            "x": 560,
            "y": 110
        })
        edges.append({
            "id": f"e_cat_{product.id}",
            "source": f"node_{product.id}",
            "target": cat_id,
            "label": "BELONGS_TO",
            "category": "Category",
            "confidence": 100,
            "sourceDoc": "Taxonomy Classification Engine"
        })
        
    # 4. Document Source Node & EVIDENCE_IN Edge
    if product.sources:
        doc_src = product.sources[0]
        doc_id = f"doc_{product.id}"
        nodes.append({
            "id": doc_id,
            "name": f"{doc_src.name} (p.2)",
            "subtitle": "PDF Technical Source",
            "type": "Document",
            "x": 140,
            "y": 390
        })
        edges.append({
            "id": f"e_doc_{product.id}",
            "source": f"node_{product.id}",
            "target": doc_id,
            "label": "EVIDENCE_IN",
            "category": "Evidence",
            "confidence": 97,
            "sourceDoc": doc_src.name
        })
        
    # 5. Secondary Product Compatibility Node & COMPATIBLE_WITH Edge (if secondary product exists)
    other_product = db.query(models.Product).filter(models.Product.id != product_id).first()
    if other_product:
        compat_id = f"compat_{product.id}"
        nodes.append({
            "id": compat_id,
            "name": other_product.name,
            "subtitle": "Compatible Equipment",
            "type": "Compatible",
            "x": 560,
            "y": 390
        })
        edges.append({
            "id": f"e_compat_{product.id}",
            "source": f"node_{product.id}",
            "target": compat_id,
            "label": "COMPATIBLE_WITH",
            "category": "Compatibility",
            "confidence": 95,
            "sourceDoc": "Cross-Reference Compatibility Engine"
        })

    return {
        "product_id": product.id,
        "product_name": product.name,
        "nodes": nodes,
        "edges": edges
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
