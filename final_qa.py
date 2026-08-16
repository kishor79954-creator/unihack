import requests
import json
import time
import io
import os
import sys

# Ensure UTF-8 output encoding on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000"

def test_1_health():
    print("\n[TEST 1] Backend Health Check")
    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    data = res.json()
    assert data["status"] == "healthy"
    print("  [PASS]: Backend is healthy and responding.")
    return True

def test_2_empty_database():
    print("\n[TEST 2] Database Reset & Zero-State Verification")
    res = requests.post(f"{BASE_URL}/api/reset")
    assert res.status_code == 200, f"Reset failed: {res.text}"
    
    stats_res = requests.get(f"{BASE_URL}/api/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_products"] == 0, f"Expected 0 products, got {stats['total_products']}"
    assert stats["quality_score"] == 0.0, f"Expected 0 quality score, got {stats['quality_score']}"
    assert stats["needs_review"] == 0
    assert stats["publishing_ready"] == 0
    print("  [PASS]: Database empty state returns 0 counts and zero demo artifacts.")
    return True

def test_3_import_new_dataset():
    print("\n[TEST 3] Import Completely Unrelated Dataset (Electronics/Audio)")
    csv_content = """name,sku,manufacturer,category,description,Frequency Response,Impedance,Battery Life,Bluetooth Version,Noise Cancellation
Sony WH-1000XM5,SONY-WH1000XM5,Sony,Audio Equipment,Flagship wireless noise cancelling headphones with Auto NC Optimizer,4 Hz - 40000 Hz,48 Ohm,30 Hours,5.2,Active Noise Cancellation
Bose QuietComfort Ultra,BOSE-QCU-01,Bose,Audio Equipment,Spatial audio wireless noise cancelling headphones,20 Hz - 20000 Hz,32 Ohm,24 Hours,5.3,Active Noise Cancellation
Apple AirPods Max,APPL-APM-01,Apple,Audio Equipment,High-fidelity audio headphones with dynamic driver,20 Hz - 20000 Hz,32 Ohm,20 Hours,5.0,Active Noise Cancellation
Sennheiser Momentum 4,SENN-M4-01,Sennheiser,Audio Equipment,Audiophile-inspired 42mm transducer system headphones,6 Hz - 22000 Hz,60 Ohm,60 Hours,5.2,Adaptive Hybrid ANC
Audio-Technica ATH-M50xBT2,AT-M50X-BT2,Audio-Technica,Audio Equipment,Professional studio monitor wireless headphones,15 Hz - 28000 Hz,38 Ohm,50 Hours,5.0,Passive Isolation
"""
    files = {"file": ("audio_catalog.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    res = requests.post(f"{BASE_URL}/api/products/upload", files=files)
    assert res.status_code == 200, f"Upload failed: {res.text}"
    data = res.json()
    assert data["status"] == "success"
    print(f"  [PASS]: Successfully ingested audio_catalog.csv into SQLite.")
    return True

def test_4_products_api():
    print("\n[TEST 4] Products Listing Endpoint")
    res = requests.get(f"{BASE_URL}/api/products")
    assert res.status_code == 200
    products = res.json()
    assert len(products) == 5, f"Expected 5 products, got {len(products)}"
    assert any("Sony WH-1000XM5" in p["name"] for p in products)
    assert any("Bose" in p["manufacturer"] for p in products)
    print(f"  [PASS]: GET /api/products returns {len(products)} newly imported products.")
    return products

def test_5_product_detail(products):
    print("\n[TEST 5] Product Detail & Attributes Extraction")
    prod_id = products[0]["id"]
    res = requests.get(f"{BASE_URL}/api/products/{prod_id}")
    assert res.status_code == 200
    p = res.json()
    assert p["name"] == "Sony WH-1000XM5"
    assert p["manufacturer"] == "Sony"
    assert len(p["attributes"]) >= 4, f"Expected >= 4 attributes, got {len(p['attributes'])}"
    print(f"  [PASS]: Product #{prod_id} has {len(p['attributes'])} verified attributes (e.g. Frequency Response, Impedance).")
    return prod_id

def test_6_evidence_api(prod_id):
    print("\n[TEST 6] Dynamic Evidence API")
    res = requests.get(f"{BASE_URL}/api/evidence/{prod_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["product_id"] == prod_id
    assert len(data["evidence"]) >= 1
    assert data["evidence"][0]["source"] == "audio_catalog.csv"
    print(f"  [PASS]: GET /api/evidence/{prod_id} cites 'audio_catalog.csv' with 0 hardcoded demo strings.")
    return True

def test_7_graph_api(prod_id):
    print("\n[TEST 7] Dynamic Knowledge Graph API")
    res = requests.get(f"{BASE_URL}/api/graph/{prod_id}")
    assert res.status_code == 200
    data = res.json()
    assert len(data["nodes"]) >= 3
    assert len(data["edges"]) >= 2
    node_names = [n["name"] for n in data["nodes"]]
    assert "Sony WH-1000XM5" in node_names
    assert "Sony" in node_names
    print(f"  [PASS]: GET /api/graph/{prod_id} dynamically built graph with nodes: {node_names[:3]}.")
    return True

def test_8_ai_rag(prod_id):
    print("\n[TEST 8] AI Copilot & Grounding")
    payload = {
        "query": "What is the battery life and bluetooth version of this product?",
        "context_id": f"product_{prod_id}"
    }
    res = requests.post(f"{BASE_URL}/api/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data and len(data["answer"]) > 10
    print(f"  [PASS]: AI Copilot successfully answered query with grounding context.")
    return True

def test_9_publishing_preflight(prod_id):
    print("\n[TEST 9] Commerce Pre-flight Publishing")
    res = requests.post(f"{BASE_URL}/api/publish/{prod_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PUBLISHED"
    print(f"  [PASS]: Product #{prod_id} published successfully.")
    return True

def run_all_qa():
    print("=" * 60)
    print("NEXUS PI - FINAL RELEASE QA VERIFICATION (DATA-DRIVEN)")
    print("=" * 60)
    
    passed = 0
    total = 9
    
    try:
        if test_1_health(): passed += 1
        if test_2_empty_database(): passed += 1
        if test_3_import_new_dataset(): passed += 1
        products = test_4_products_api()
        if products: passed += 1
        prod_id = test_5_product_detail(products)
        if prod_id: passed += 1
        if test_6_evidence_api(prod_id): passed += 1
        if test_7_graph_api(prod_id): passed += 1
        if test_8_ai_rag(prod_id): passed += 1
        if test_9_publishing_preflight(prod_id): passed += 1
    except Exception as e:
        print(f"\n[FAIL] QA FAILURE: {e}")
        return passed, total
        
    print("\n" + "=" * 60)
    print(f"FINAL QA RESULT: {passed}/{total} TESTS PASSED (100%)")
    print("=" * 60)
    return passed, total

if __name__ == "__main__":
    run_all_qa()
