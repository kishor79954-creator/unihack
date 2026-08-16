class ConfidenceEngine:
    @classmethod
    def calculate_confidence(cls, source_authority: int, evidence_quality: int, cross_source_agreement: int, semantic_validation: int) -> tuple[float, str]:
        """
        Weights:
        Source authority: 35%
        Evidence quality: 25%
        Cross-source agreement: 20%
        Schema validity/Semantic validation: 20%
        """
        
        score = (
            (source_authority * 0.35) +
            (evidence_quality * 0.25) +
            (cross_source_agreement * 0.20) +
            (semantic_validation * 0.20)
        )
        
        score = round(score, 1)
        
        if score >= 95:
            level = "Verified"
        elif score >= 80:
            level = "High Confidence"
        elif score >= 60:
            level = "Review Required"
        else:
            level = "Unverified"
            
        return score, level
        
    @classmethod
    def calculate_product_quality(cls, completeness: float, consistency: float, evidence: float, validation: float, taxonomy: float) -> float:
        score = (
            (completeness * 0.20) +
            (consistency * 0.20) +
            (evidence * 0.20) +
            (validation * 0.20) +
            (taxonomy * 0.20)
        )
        return round(score, 1)
