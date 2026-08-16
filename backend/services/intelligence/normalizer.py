import re

class AttributeNormalizer:
    @staticmethod
    def normalize_length(raw_value: str, raw_unit: str):
        if not raw_value:
            return None, None
            
        try:
            val = float(raw_value)
            if raw_unit in ["in", "inch", "\"", "inches"]:
                return str(round(val * 25.4, 2)), "mm"
            elif raw_unit in ["mm", "millimeter", "millimeters"]:
                return str(val), "mm"
            elif raw_unit in ["cm", "centimeter"]:
                return str(round(val * 10, 2)), "mm"
            elif raw_unit in ["m", "meter"]:
                return str(round(val * 1000, 2)), "mm"
        except ValueError:
            pass
            
        return raw_value, raw_unit

    @staticmethod
    def normalize_weight(raw_value: str, raw_unit: str):
        if not raw_value:
            return None, None
            
        try:
            val = float(raw_value)
            if raw_unit in ["lb", "lbs", "pound", "pounds"]:
                return str(round(val * 0.453592, 3)), "kg"
            elif raw_unit in ["g", "gram", "grams"]:
                return str(round(val / 1000, 3)), "kg"
            elif raw_unit in ["kg", "kilogram"]:
                return str(val), "kg"
        except ValueError:
            pass
            
        return raw_value, raw_unit
        
    @classmethod
    def normalize(cls, key: str, raw_value: str, raw_unit: str = None):
        key_lower = key.lower()
        if any(x in key_lower for x in ["diameter", "width", "length", "thickness"]):
            return cls.normalize_length(raw_value, raw_unit)
        elif "weight" in key_lower:
            return cls.normalize_weight(raw_value, raw_unit)
        
        return raw_value, raw_unit
