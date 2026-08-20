from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class ConfidenceLevel(enum.Enum):
    VERIFIED = "Verified"
    HIGH_CONFIDENCE = "High Confidence"
    REVIEW_REQUIRED = "Review Required"
    UNVERIFIED = "Unverified"

class ValidationStatus(enum.Enum):
    VALID = "Valid"
    INVALID = "Invalid"
    CONFLICT = "Conflict"
    PENDING = "Pending"

class SourceType(enum.Enum):
    PDF = "PDF"
    WEBSITE = "Website"
    IMAGE = "Image"
    MANUAL = "Manual"

# Phase 4 Enums
class IssueType(enum.Enum):
    MISSING_ATTRIBUTE = "MISSING_ATTRIBUTE"
    INVALID_VALUE = "INVALID_VALUE"
    UNIT_CONFLICT = "UNIT_CONFLICT"
    SOURCE_CONFLICT = "SOURCE_CONFLICT"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    DUPLICATE = "DUPLICATE"
    TAXONOMY_MISMATCH = "TAXONOMY_MISMATCH"
    SEMANTIC_INCONSISTENCY = "SEMANTIC_INCONSISTENCY"
    STALE_SOURCE = "STALE_SOURCE"
    UNSUPPORTED_VALUE = "UNSUPPORTED_VALUE"
    SKU_IDENTITY_CONFLICT = "SKU_IDENTITY_CONFLICT"

class IssuePriority(enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class ReviewStatus(enum.Enum):
    OPEN = "OPEN"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    UNRESOLVED = "UNRESOLVED"
    DEFERRED = "DEFERRED"

# 1. TAXONOMY
class TaxonomyCategory(Base):
    __tablename__ = "taxonomy_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    parent_id = Column(Integer, ForeignKey("taxonomy_categories.id"), nullable=True)
    required_attributes = Column(JSON, default=list)
    optional_attributes = Column(JSON, default=list)
    
    products = relationship("Product", back_populates="taxonomy")

# 2. PRODUCT
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(String, default="default", index=True)
    sku = Column(String, index=True)
    name = Column(String, index=True)
    description = Column(String)
    manufacturer = Column(String, index=True)
    category = Column(String, index=True)
    status = Column(String, default="DRAFT", index=True)
    
    taxonomy_id = Column(Integer, ForeignKey("taxonomy_categories.id"), nullable=True)
    taxonomy = relationship("TaxonomyCategory", back_populates="products")
    
    # Intelligence composite scores
    quality_score = Column(Float, default=0.0, index=True)
    completeness_score = Column(Float, default=0.0)
    ai_confidence = Column(Float, default=0.0)
    
    # Phase 4
    review_status = Column(String, default="NOT_REVIEWED")
    version = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sources = relationship("Source", back_populates="product", cascade="all, delete-orphan")
    attributes = relationship("ProductAttribute", back_populates="product", cascade="all, delete-orphan")
    issues = relationship("ReviewIssue", back_populates="product", cascade="all, delete-orphan")
    versions = relationship("ProductVersion", back_populates="product", cascade="all, delete-orphan")

# 3. SOURCES
class Source(Base):
    __tablename__ = "sources"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(String, default="default", index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    
    source_type = Column(Enum(SourceType))
    name = Column(String)
    file_path = Column(String, nullable=True)
    url = Column(String, nullable=True)
    authority_score = Column(Integer, default=50)
    
    product = relationship("Product", back_populates="sources")
    evidence = relationship("Evidence", back_populates="source", cascade="all, delete-orphan")

# 4. EVIDENCE
class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id"))
    
    page_number = Column(Integer, nullable=True)
    text_snippet = Column(Text, nullable=True)
    bounding_box = Column(JSON, nullable=True)
    
    source = relationship("Source", back_populates="evidence")

# 5. ATTRIBUTES
class ProductAttribute(Base):
    __tablename__ = "product_attributes"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=True)
    evidence_id = Column(Integer, ForeignKey("evidence.id"), nullable=True)
    
    key = Column(String, index=True)
    raw_value = Column(String)
    normalized_value = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    original_unit = Column(String, nullable=True)
    normalization_method = Column(String, nullable=True)
    
    confidence_score = Column(Float)
    confidence_level = Column(Enum(ConfidenceLevel))
    validation_status = Column(Enum(ValidationStatus), default=ValidationStatus.PENDING)
    
    product = relationship("Product", back_populates="attributes")

# 6. VALIDATIONS & CONFLICTS
class ValidationResult(Base):
    __tablename__ = "validation_results"
    
    id = Column(Integer, primary_key=True, index=True)
    attribute_id = Column(Integer, ForeignKey("product_attributes.id"))
    rule_name = Column(String, nullable=True)
    is_passed = Column(Integer, default=1)
    message = Column(String, nullable=True)

class ValidationConflict(Base):
    __tablename__ = "validation_conflicts"
    
    id = Column(Integer, primary_key=True, index=True)
    attribute_id = Column(Integer, ForeignKey("product_attributes.id"), nullable=True)
    description = Column(String, nullable=True)

# PHASE 4: TRUST & REVIEW ENGINE

class ReviewIssue(Base):
    __tablename__ = "review_issues"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(String, default="default", index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    
    issue_type = Column(Enum(IssueType))
    priority = Column(Enum(IssuePriority))
    status = Column(Enum(ReviewStatus), default=ReviewStatus.OPEN)
    
    attribute_key = Column(String, nullable=True)
    description = Column(Text)
    
    # Conflict data (JSON handles complex source A vs B data)
    conflict_data = Column(JSON, nullable=True)
    
    ai_recommendation = Column(String, nullable=True)
    ai_reasoning = Column(Text, nullable=True)
    
    assignee = Column(String, nullable=True)
    resolution_note = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    product = relationship("Product", back_populates="issues")

class AuditEvent(Base):
    __tablename__ = "audit_events"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(String, default="default", index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    actor = Column(String) # "System", "AI", or User Name
    action = Column(String) # "CREATE", "UPDATE", "MANUAL_OVERRIDE", "RESOLVE_ISSUE"
    entity_type = Column(String) # "Product", "ReviewIssue", "Attribute"
    entity_id = Column(Integer)
    
    previous_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    reason = Column(Text, nullable=True)
    evidence_ref = Column(String, nullable=True)

class ProductVersion(Base):
    __tablename__ = "product_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    version_number = Column(Integer)
    
    snapshot_data = Column(JSON) # Store entire product state
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    reason = Column(Text)
    product = relationship("Product", back_populates="versions")

# --- PHASE 5: KNOWLEDGE GRAPH ABSTRACTION LAYER ---

class GraphNodeType(enum.Enum):
    PRODUCT = "PRODUCT"
    MANUFACTURER = "MANUFACTURER"
    CATEGORY = "CATEGORY"
    APPLICATION = "APPLICATION"
    COMPONENT = "COMPONENT"
    DOCUMENT = "DOCUMENT"

class GraphEdgeType(enum.Enum):
    MANUFACTURED_BY = "MANUFACTURED_BY"
    BELONGS_TO = "BELONGS_TO"
    HAS_ATTRIBUTE = "HAS_ATTRIBUTE"
    USED_IN = "USED_IN"
    CONTAINS_COMPONENT = "CONTAINS_COMPONENT"
    COMPATIBLE_WITH = "COMPATIBLE_WITH"
    REPLACEMENT_FOR = "REPLACEMENT_FOR"
    ALTERNATIVE_TO = "ALTERNATIVE_TO"
    DOCUMENTED_BY = "DOCUMENTED_BY"

class GraphNode(Base):
    __tablename__ = "graph_nodes"
    id = Column(String, primary_key=True, index=True) # E.g., "PROD_1", "MFG_SKF"
    workspace_id = Column(String, default="default", index=True)
    node_type = Column(Enum(GraphNodeType))
    name = Column(String, index=True)
    properties = Column(JSON, nullable=True)

class GraphEdge(Base):
    __tablename__ = "graph_edges"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(String, default="default", index=True)
    source_id = Column(String, ForeignKey("graph_nodes.id"))
    target_id = Column(String, ForeignKey("graph_nodes.id"))
    relationship_type = Column(Enum(GraphEdgeType))
    
    confidence = Column(Float, default=100.0)
    status = Column(String, default="VERIFIED") # VERIFIED, POTENTIAL
    evidence = Column(String, nullable=True)
    
    target_node = relationship("GraphNode", foreign_keys=[target_id])

# --- PHASE 6: BULK CATALOG PROCESSING AND SCALABILITY ---

class CatalogJob(Base):
    __tablename__ = "catalog_jobs"
    id = Column(String, primary_key=True, index=True) # e.g. "CAT-2026-1028"
    workspace_id = Column(String, default="default", index=True)
    filename = Column(String)
    file_type = Column(String, default="CSV")
    file_path = Column(String, nullable=True)
    
    # Lifecycle: queued, processing, completed, failed, cancelled
    status = Column(String, default="queued", index=True)
    
    # Stages: upload, parsing, product_detection, attribute_extraction, classification, validation, conflict_detection, evidence_mapping, ai_enrichment, quality_scoring, finalization
    stage = Column(String, default="upload")
    stage_label = Column(String, default="Upload")
    progress = Column(Float, default=0.0) # 0.0 to 100.0
    
    # Real-time Metrics
    total_products = Column(Integer, default=0)
    processed_products = Column(Integer, default=0)
    products_detected = Column(Integer, default=0)
    attributes_extracted = Column(Integer, default=0)
    issues_detected = Column(Integer, default=0)
    conflicts_detected = Column(Integer, default=0)
    enrichment_proposals = Column(Integer, default=0)
    evidence_links = Column(Integer, default=0)
    failed_rows = Column(Integer, default=0)
    quality_score = Column(Float, default=0.0)
    
    # Active Product Being Processed
    current_product_name = Column(String, nullable=True)
    current_product_sku = Column(String, nullable=True)
    current_product_stage = Column(String, nullable=True)
    
    # Column mapping & logs
    column_mapping = Column(JSON, nullable=True)
    activity_logs = Column(JSON, default=list) # List of {"time": str, "message": str, "type": str, "stage": str}
    error_message = Column(Text, nullable=True)
    warning_details = Column(JSON, nullable=True) # List of failed/warning row summaries
    
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    tasks = relationship("CatalogTask", back_populates="job", cascade="all, delete-orphan")

class CatalogTask(Base):
    __tablename__ = "catalog_tasks"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("catalog_jobs.id"))
    workspace_id = Column(String, default="default", index=True)
    row_index = Column(Integer)
    row_data = Column(JSON)
    status = Column(String, default="QUEUED") # QUEUED, PROCESSING, COMPLETED, FAILED, WARNING
    stage = Column(String, default="queued")
    error_message = Column(Text, nullable=True)
    extracted_attributes_count = Column(Integer, default=0)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    
    job = relationship("CatalogJob", back_populates="tasks")

class DuplicateCandidate(Base):
    __tablename__ = "duplicate_candidates"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(String, default="default", index=True)
    product_a_id = Column(Integer, ForeignKey("products.id"))
    product_b_id = Column(Integer, ForeignKey("products.id"))
    similarity_score = Column(Float)
    matching_fields = Column(JSON) # e.g. {"manufacturer": true, "part_number": true}
    status = Column(String, default="PENDING") # PENDING, MERGED, SEPARATE
