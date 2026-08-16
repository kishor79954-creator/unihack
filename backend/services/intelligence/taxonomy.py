class TaxonomyEngine:
    # In a real database, this would be queried from TaxonomyCategory
    TAXONOMY_DB = {
        "Bearings > Deep Groove Ball Bearings": {
            "required": ["Bore Diameter", "Outer Diameter", "Width", "Seal Type"],
            "optional": ["Material", "Weight", "Static Load Rating", "Dynamic Load Rating", "Max RPM"]
        }
    }
    
    @classmethod
    def get_requirements(cls, category: str):
        # Fuzzy match for demo
        for cat, data in cls.TAXONOMY_DB.items():
            if "bearing" in category.lower() and "bearing" in cat.lower():
                return data
        return {"required": [], "optional": []}
        
    @classmethod
    def calculate_completeness(cls, category: str, extracted_keys: set) -> float:
        reqs = cls.get_requirements(category)
        required = set([k.lower() for k in reqs["required"]])
        
        if not required:
            return 100.0
            
        extracted_lower = set([k.lower() for k in extracted_keys])
        
        matches = len(required.intersection(extracted_lower))
        return round((matches / len(required)) * 100, 1)
        
    @classmethod
    def get_missing_attributes(cls, category: str, extracted_keys: set) -> list:
        reqs = cls.get_requirements(category)
        required = set([k.lower() for k in reqs["required"]])
        extracted_lower = set([k.lower() for k in extracted_keys])
        
        missing = required - extracted_lower
        
        # Return actual casing from schema
        return [k for k in reqs["required"] if k.lower() in missing]
