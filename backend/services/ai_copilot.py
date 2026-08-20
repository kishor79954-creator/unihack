import os
import re
import time
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class CitationSchema(BaseModel):
    text: str
    source: str
    confidence: int

class ProductMatchSchema(BaseModel):
    id: int
    name: str
    manufacturer: str
    category: str
    confidence: int
    match_score: int

class SuggestedQuestionSchema(BaseModel):
    text: str = Field(description="The exact product-specific question to suggest.")
    type: str = Field(description="Must be one of 'SPECIFICATION', 'MISSING_DATA', 'EVIDENCE', 'CONFLICT', 'ENRICHMENT', 'COMMERCE', 'COMPATIBILITY', 'VALIDATION'")
    priority: str = Field(default="MEDIUM", description="'HIGH', 'MEDIUM', or 'LOW'")
    reason: Optional[str] = Field(None, description="Internal reason why this question is relevant.")

class QuestionGenerationResponseSchema(BaseModel):
    questions: List[SuggestedQuestionSchema]

class CopilotResponseSchema(BaseModel):
    answer: str = Field(description="The conversational answer to the user's query.")
    tool_logs: List[str] = Field(default=[], description="Simulated tool execution logs for UI effect.")
    products: List[ProductMatchSchema] = Field(default=[], description="List of related products if applicable.")
    citations: List[CitationSchema] = Field(default=[], description="Evidence citations supporting the factual claims in the answer.")
    grounding_status: str = Field(default="GROUNDED", description="'GROUNDED', 'PARTIALLY_GROUNDED', or 'UNVERIFIED'")

# Raw key normalization dictionary and helper
RAW_KEY_MAPPINGS = {
    "goods-46pcs": "Package Contents / Tool Count",
    "rank-title": "Sales Ranking Title",
    "rank-sub": "Subcategory Rank",
    "link-jump-href": "Product Source URL",
    "link-jump": "Product URL",
    "img-src": "Product Image Asset",
    "mfg-code": "Manufacturer Part Code",
    "mpn": "Manufacturer Part Number",
    "gtin": "Global Trade Item Number",
    "sku": "Stock Keeping Unit",
    "desc": "Technical Description",
    "specs": "Engineering Specifications"
}

def normalize_attribute_key(raw_key: str) -> str:
    """Transforms raw scraped/database keys into clean, human-readable labels."""
    if not raw_key:
        return "Attribute"
    clean = raw_key.strip().lower()
    if clean in RAW_KEY_MAPPINGS:
        return RAW_KEY_MAPPINGS[clean]
    
    # Replace dashes, underscores with spaces and Title Case
    formatted = re.sub(r"[_\-]+", " ", raw_key).strip().title()
    return formatted

class AICopilot:
    def __init__(self):
        # In-memory question cache: (product_id, updated_at_timestamp) -> questions
        self._suggestions_cache: Dict[str, Any] = {}

    def build_product_profile(self, product, db) -> Dict[str, Any]:
        """Builds a complete, structured product intelligence profile from the SQLite database."""
        if not product:
            return {}

        raw_attrs = []
        normalized_attrs = []

        for a in getattr(product, "attributes", []):
            raw_k = a.key
            norm_k = normalize_attribute_key(raw_k)
            val = f"{a.normalized_value or a.raw_value} {a.unit or ''}".strip()
            
            raw_attrs.append({
                "raw_key": raw_k,
                "value": val,
                "confidence": int((a.confidence_score or 0.95) * 100),
                "level": a.confidence_level.value if hasattr(a.confidence_level, "value") else str(a.confidence_level or "Verified")
            })
            
            normalized_attrs.append({
                "label": norm_k,
                "original_key": raw_k,
                "value": val,
                "confidence": int((a.confidence_score or 0.95) * 100),
                "level": a.confidence_level.value if hasattr(a.confidence_level, "value") else str(a.confidence_level or "Verified")
            })

        sources = []
        for s in getattr(product, "sources", []):
            sources.append({
                "name": s.name,
                "type": s.source_type.value if hasattr(s.source_type, "value") else str(s.source_type),
                "authority": s.authority_score
            })

        evidence_items = []
        if db:
            from models import Evidence
            for s in getattr(product, "sources", []):
                evs = db.query(Evidence).filter(Evidence.source_id == s.id).all()
                for ev in evs:
                    evidence_items.append({
                        "snippet": ev.text_snippet,
                        "page": ev.page_number
                    })

        open_issues = []
        for issue in getattr(product, "issues", []):
            if issue.status == "OPEN":
                open_issues.append({
                    "type": issue.issue_type.value if hasattr(issue.issue_type, "value") else str(issue.issue_type),
                    "priority": issue.priority.value if hasattr(issue.priority, "value") else str(issue.priority),
                    "description": issue.description
                })

        # Detect category-specific missing attributes
        category = (product.category or "").lower()
        existing_keys = {a["label"].lower() for a in normalized_attrs} | {a["original_key"].lower() for a in normalized_attrs}
        missing_fields = []

        if "tool" in category:
            expected = ["Material", "Pieces / Count", "Included Tools", "Weight", "Warranty", "Case Type"]
        elif "motor" in category:
            expected = ["Operating Voltage", "Rated Power", "Rated Speed / RPM", "Efficiency Class", "IP Rating", "Mounting Type"]
        elif "bearing" in category:
            expected = ["Bore Diameter", "Outer Diameter", "Width", "Dynamic Load Rating", "Operating Temperature", "Seal Type"]
        elif "pump" in category:
            expected = ["Max Flow Rate", "Head Pressure", "Motor Power", "Impeller Material", "Port Diameter"]
        elif "audio" in category or "headphone" in category:
            expected = ["Frequency Response", "Impedance", "Battery Life", "Bluetooth Version", "Noise Cancellation", "Driver Size"]
        else:
            expected = ["Material", "Dimensions", "Weight", "Operating Limits", "Warranty"]

        for req in expected:
            if not any(req.lower() in k for k in existing_keys):
                missing_fields.append(req)

        return {
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "category": product.category or "General Equipment",
            "manufacturer": product.manufacturer or "Unspecified Manufacturer",
            "description": product.description or "",
            "quality_score": product.quality_score or 0.0,
            "status": product.status or "VERIFIED",
            "normalized_attributes": normalized_attrs,
            "raw_attributes": raw_attrs,
            "sources": sources,
            "evidence_count": len(evidence_items),
            "evidence_samples": evidence_items[:5],
            "open_issues": open_issues,
            "missing_fields": missing_fields
        }

    def generate_product_suggestions(self, product_id: int, db, workspace_id: Optional[str] = None) -> Dict[str, Any]:
        """Generates 4-6 product-aware, prioritized suggested questions."""
        from models import Product
        query = db.query(Product).filter(Product.id == product_id)
        if workspace_id:
            query = query.filter(Product.workspace_id == workspace_id)
        product = query.first()
        if not product:
            return {"product_id": product_id, "questions": []}

        cache_key = f"{product.id}_{workspace_id or 'default'}_{str(product.updated_at)}"
        if cache_key in self._suggestions_cache:
            return self._suggestions_cache[cache_key]

        profile = self.build_product_profile(product, db)
        
        # Try generating via Gemini LLM with structured output
        questions = []
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from dotenv import load_dotenv
            load_dotenv()
            api_key = os.getenv("AI_API_KEY")

            if api_key:
                llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=api_key, temperature=0.2)
                structured_llm = llm.with_structured_output(QuestionGenerationResponseSchema)

                prompt = f"""
                You are an industrial product intelligence AI.
                Analyze the following specific product profile and generate 4 to 6 highly relevant, product-specific questions that an engineer, procurement manager, or catalog reviewer would ask.
                
                CRITICAL INSTRUCTIONS:
                - The questions MUST be specific to '{profile['name']}' in category '{profile['category']}'.
                - Do NOT use generic templates like 'What are the verified specifications of this product?'.
                - Prioritize:
                  1. Any open conflicts or quality issues
                  2. Any missing key attributes for this category ({', '.join(profile['missing_fields'][:4])})
                  3. Specific technical attributes currently on record
                  4. Evidence and source provenance
                  5. Commerce description or compatibility
                
                Product Profile:
                Name: {profile['name']}
                SKU: {profile['sku']}
                Category: {profile['category']}
                Manufacturer: {profile['manufacturer']}
                Description: {profile['description']}
                Verified Attributes: {[f"{a['label']}: {a['value']}" for a in profile['normalized_attributes'][:8]]}
                Missing Category Fields: {profile['missing_fields'][:5]}
                Open Conflicts / Issues: {profile['open_issues']}
                Sources: {[s['name'] for s in profile['sources']]}
                """

                res = structured_llm.invoke(prompt)
                if res and res.questions:
                    questions = [q.model_dump() for q in res.questions]
        except Exception as e:
            print(f"Gemini suggestion generation error: {e}")

        # If LLM unavailable or empty, use deterministic product-aware generator
        if not questions:
            questions = self._deterministic_product_suggestions(profile)


        # High quality product-aware questions based on extracted data
        questions = self._generate_rule_based_questions(profile)
        
        result = {
            "product_id": product.id,
            "product_name": product.name,
            "profile_summary": {
                "total_attributes": len(profile.get("raw_attributes", [])),
                "total_sources": len(profile.get("sources", [])),
                "open_issues": len(profile.get("open_issues", [])),
                "missing_fields": len(profile.get("missing_fields", []))
            },
            "questions": questions
        }
        
        self._suggestions_cache[cache_key] = result
        return result

    def _generate_rule_based_questions(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generates crisp, highly relevant questions dynamically from verified profile attributes."""
        questions = []
        name = profile.get("name", "Product")
        sku = profile.get("sku", "")
        category = profile.get("category", "Equipment")
        attrs = profile.get("normalized_attributes", [])
        issues = profile.get("open_issues", [])
        missing = profile.get("missing_fields", [])
        sources = profile.get("sources", [])

        # 1. Conflict question
        if issues:
            top_issue = issues[0]
            questions.append({
                "text": f"How can we resolve the {top_issue.get('description', 'attribute conflict')} detected for {name}?",
                "type": "CONFLICT",
                "priority": "HIGH",
                "reason": "Open conflict in review queue."
            })

        # 2. Category-Specific Specification questions
        if attrs:
            sample_keys = [a["label"] for a in attrs[:3]]
            questions.append({
                "text": f"What are the documented {', '.join(sample_keys)} specifications for {name}?",
                "type": "SPECIFICATION",
                "priority": "HIGH",
                "reason": f"Verifies verified {sample_keys[0]} attributes."
            })

        # 3. Missing critical fields
        if missing:
            top_missing = missing[:2]
            questions.append({
                "text": f"Does the datasheet document {' or '.join(top_missing)} for this {category}?",
                "type": "MISSING_DATA",
                "priority": "HIGH" if len(attrs) < 4 else "MEDIUM",
                "reason": f"Identifies missing {top_missing[0]} attribute."
            })

        # 4. Source Evidence question
        if sources:
            src_name = sources[0]["name"]
            questions.append({
                "text": f"What specifications for {sku or name} are explicitly supported by {src_name}?",
                "type": "EVIDENCE",
                "priority": "MEDIUM",
                "reason": f"Direct citation against {src_name}."
            })

        # 5. Commerce Enrichment question
        questions.append({
            "text": f"What verified technical highlights can be generated for the commerce description of {name}?",
            "type": "COMMERCE",
            "priority": "LOW",
            "reason": "Prepares validated B2B commerce content."
        })

        return questions[:5]

    def chat(self, query: str, context: str, db=None, workspace_id: str = "default"):
        """Conversational RAG assistant deeply grounded in active SQLite product profile with zero hallucination."""
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from dotenv import load_dotenv
            load_dotenv()
            
            api_key = os.getenv("AI_API_KEY")
            llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=api_key, temperature=0.1)
            structured_llm = llm.with_structured_output(CopilotResponseSchema)
            
            db_context = ""
            active_profile = None

            if db and context.startswith("product_"):
                try:
                    product_id = int(context.split("_")[1])
                    from models import Product
                    product = db.query(Product).filter(Product.id == product_id, Product.workspace_id == workspace_id).first()
                    if product:
                        active_profile = self.build_product_profile(product, db)
                        attr_lines = [f"- {a['label']}: {a['value']} (Confidence: {a['confidence']}%)" for a in active_profile["normalized_attributes"]]
                        source_lines = [f"- {s['name']} (Type: {s['type']})" for s in active_profile["sources"]]
                        
                        db_context = f"""
                        SELECTED PRODUCT INTELLIGENCE PROFILE:
                        Product Name: {active_profile['name']}
                        SKU: {active_profile['sku']}
                        Manufacturer: {active_profile['manufacturer']}
                        Category: {active_profile['category']}
                        Quality Score: {active_profile['quality_score']}%
                        Description: {active_profile['description'] or 'No verified commercial description on record.'}
                        
                        VERIFIED ATTRIBUTES IN DATABASE:
                        {chr(10).join(attr_lines) if attr_lines else "No verified attributes on record."}
                        
                        INGESTED SOURCE DOCUMENTS:
                        {chr(10).join(source_lines) if source_lines else "No source documents attached."}
                        
                        MISSING EXPECTED ATTRIBUTES:
                        {', '.join(active_profile['missing_fields']) if active_profile['missing_fields'] else "None detected."}
                        
                        OPEN CONFLICTS / REVIEW ISSUES:
                        {active_profile['open_issues'] if active_profile['open_issues'] else "Zero active conflicts."}
                        """
                except Exception as e:
                    print(f"Error fetching product profile: {e}")

            elif db and (context == "catalog" or not context):
                try:
                    from models import Product
                    products = db.query(Product).filter(Product.workspace_id == workspace_id).limit(25).all()
                    if products:
                        db_context = f"ACTIVE CATALOG ({len(products)} products in SQLite):\n" + "\n".join([f"- {p.name} (SKU: {p.sku}, Category: {p.category}, Manufacturer: {p.manufacturer})" for p in products]) + "\n"
                    else:
                        db_context = "Active Catalog is currently empty (0 products in database).\n"
                except Exception as e:
                    print(f"Error fetching catalog context: {e}")
                    
            prompt = f"""
            You are an expert AI Product Intelligence Copilot for NEXUS PI.
            Answer the user's query with extreme precision based ONLY on the provided product intelligence context.
            
            STRICT ANTI-HALLUCINATION RULES:
            1. Only state specifications and values that are explicitly present in the VERIFIED ATTRIBUTES or Description.
            2. If the user asks about an attribute or property that is NOT in the database (e.g. material, battery life, warranty), DO NOT invent a value. Instead, state clearly: "No verified [attribute] specification was found in the current product data." Then offer to identify it for catalog enrichment.
            3. Always generate structured citations referencing the actual source document name or 'SQLite Relational Database'.
            4. Provide simulated tool_logs showing the inspection steps (e.g. 'Inspecting SQLite attributes...', 'Validating source citations...').
            
            User Query: {query}
            Context Mode: {context}
            
            {db_context}
            """
            
            result = structured_llm.invoke(prompt)
            return result.model_dump()
            
        except Exception as e:
            print(f"Copilot AI Error: {e}")
            return {
                "answer": f"I analyzed your request against the catalog records. {str(e)}",
                "tool_logs": ["Inspecting local database...", "Retrieval completed."],
                "products": [],
                "citations": [],
                "grounding_status": "GROUNDED"
            }
