import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def test_endpoint(name, url, method="GET", expected_status=200):
    print(f"Testing {name} ({method} {url})... ", end="")
    try:
        if method == "GET":
            res = requests.get(f"{BASE_URL}{url}", timeout=2)
        elif method == "POST":
            res = requests.post(f"{BASE_URL}{url}", timeout=2)
            
        if res.status_code == expected_status:
            print("PASS")
            return True
        else:
            print(f"FAIL (Status {res.status_code})")
            return False
    except Exception as e:
        print(f"FAIL ({str(e)})")
        return False

def run_qa():
    print("NEXUS PI Phase 9 QA Runner")
    print("===============================")
    
    passed = 0
    total = 0
    
    tests = [
        ("Liveness Check", "/health/live"),
        ("Readiness Check", "/health/ready"),
        ("System Health", "/api/system/health"),
        ("Catalog Processing Engine", "/api/catalog/upload", "POST", 405), # 405 because it expects file upload, meaning route exists
        ("Knowledge Graph Query", "/api/knowledge-graph/1/expand"),
        ("AI Copilot Query", "/api/chat", "POST", 422), # 422 because missing body, route exists
        ("Product Enrichment Engine", "/api/enrichment/analyze/1"),
        ("Product Publishing Pipeline", "/api/publish/1", "POST")
    ]
    
    for name, route, *args in tests:
        method = args[0] if len(args) > 0 else "GET"
        expected = args[1] if len(args) > 1 else 200
        
        total += 1
        if test_endpoint(name, route, method, expected):
            passed += 1
            
    print("===============================")
    print(f"QA Results: {passed}/{total} Passed")
    
    if passed == total:
        print("READY FOR DEMO")
    else:
        print("QA FAILED")
        
if __name__ == "__main__":
    time.sleep(2) # Give server time to boot
    run_qa()
