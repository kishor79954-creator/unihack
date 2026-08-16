import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Product, ProductAttribute, Source, Evidence, SourceType, ConfidenceLevel, ValidationStatus
from database import DATABASE_URL
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_database():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    print("Seeding NEXUS PI Demo Database...")

    # Clear existing demo data safely
    db.query(Evidence).delete()
    db.query(ProductAttribute).delete()
    db.query(Source).delete()
    db.query(Product).delete()
    db.commit()

    # 1. Create Hero Product
    hero_product = Product(
        id=1,
        sku="SKF-6205-2RS",
        name="SKF 6205-2RS Deep Groove Ball Bearing",
        description="High-performance deep-groove ball bearing designed for industrial applications.",
        manufacturer="SKF",
        category="Industrial Bearings",
        status="NEEDS_REVIEW",
        quality_score=82,
        completeness_score=75,
        ai_confidence=92
    )
    db.add(hero_product)
    
    # Alternative Product
    alt_product = Product(
        id=2,
        sku="NTN-6205-LLU",
        name="NTN 6205 LLU Bearing",
        description="NTN equivalent deep groove bearing.",
        manufacturer="NTN",
        category="Industrial Bearings",
        status="PUBLISHED",
        quality_score=95,
        completeness_score=98,
        ai_confidence=97
    )
    db.add(alt_product)
    db.commit()

    # 2. Create Source Documents
    skf_doc = Source(
        id=1,
        product_id=hero_product.id,
        name="SKF_Datasheet_6200_Series.pdf",
        source_type=SourceType.PDF,
        authority_score=98
    )
    db.add(skf_doc)
    db.commit()

    # 3. Add Verified Attributes
    attrs = [
        ("Bore Diameter", "25", "25", "mm", 99, True),
        ("Outer Diameter", "52", "52", "mm", 99, True),
        ("Width", "15", "15", "mm", 99, True),
        ("Seal Type", "2RS (Rubber Seal)", "2RS", None, 95, True)
    ]
    
    for key, raw, norm, unit, conf, is_passed in attrs:
        attr = ProductAttribute(
            product_id=hero_product.id,
            key=key,
            raw_value=raw,
            normalized_value=norm,
            unit=unit,
            confidence_score=conf,
            confidence_level=ConfidenceLevel.HIGH_CONFIDENCE if conf > 90 else ConfidenceLevel.VERIFIED,
            validation_status=ValidationStatus.VALID
        )
        db.add(attr)
    
    db.commit()

    print("Demo Data Seeded Successfully!")
    print("Hero Product: SKF 6205-2RS")
    print("Run frontend and check /products/1")

if __name__ == "__main__":
    seed_database()
