import requests
import json
import time

BASE_URL = "http://localhost:8000"
RESULTS = []

def record(test_id, category, test, expected, actual, status, evidence, notes=""):
    RESULTS.append({
        "TEST ID": test_id,
        "CATEGORY": category,
        "TEST": test,
        "EXPECTED": expected,
        "ACTUAL": actual,
        "STATUS": status,
        "EVIDENCE": evidence,
        "NOTES": notes
    })

def test_api(test_id, category, desc, method, endpoint, expected_status, payload=None, extract_json=False):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            res = requests.get(url, timeout=40)
        elif method == "POST":
            res = requests.post(url, json=payload, timeout=40)
        
        actual_status = res.status_code
        status = "PASS" if actual_status == expected_status else "FAIL"
        
        evidence = f"Status Code: {actual_status}"
        if extract_json and status == "PASS":
            try:
                evidence += f" | Response: {str(res.json())[:100]}..."
            except:
                pass
                
        record(test_id, category, desc, f"HTTP {expected_status}", f"HTTP {actual_status}", status, evidence)
        return res
    except Exception as e:
        record(test_id, category, desc, f"HTTP {expected_status}", "Exception", "BLOCKED", str(e))
        return None

def run_audit():
    print("Starting Nexus PI Final API Audit...")
    
    # Health Checks
    test_api("API-01", "OBSERVABILITY", "Liveness Check", "GET", "/health/live", 200, extract_json=True)
    test_api("API-02", "OBSERVABILITY", "Readiness Check", "GET", "/health/ready", 200, extract_json=True)
    test_api("API-03", "OBSERVABILITY", "System Health", "GET", "/api/system/health", 200, extract_json=True)
    
    # Products CRUD
    res = test_api("API-04", "PRODUCTS", "Get Products List", "GET", "/api/products", 200, extract_json=True)
    if res and res.status_code == 200:
        data = res.json()
        if len(data) > 0:
            pid = data[0].get('id', 1)
            test_api("API-05", "PRODUCTS", f"Get Product {pid}", "GET", f"/api/products/{pid}", 200, extract_json=True)
        else:
            record("API-05", "PRODUCTS", "Get Product", "HTTP 200", "No Data", "BLOCKED", "No products in DB")

    # Document / Upload
    test_api("API-06", "DOCUMENTS", "Upload missing file", "POST", "/api/catalog/upload", 422) # Should reject cleanly

    # Enrichment
    test_api("API-07", "ENRICHMENT", "Analyze gaps", "GET", "/api/enrichment/analyze/1", 200, extract_json=True)

    # AI Copilot
    test_api("API-08", "AI", "Empty Chat Query", "POST", "/api/chat", 422) # Validation failure

    # Publishing
    test_api("API-09", "PUBLISHING", "Publish Product", "POST", "/api/publish/1", 200, extract_json=True)
    
    # Generate Report
    print(f"\nCompleted {len(RESULTS)} tests. Writing report...")
    with open("qa_results.json", "w") as f:
        json.dump(RESULTS, f, indent=2)

if __name__ == "__main__":
    time.sleep(2)
    run_audit()
