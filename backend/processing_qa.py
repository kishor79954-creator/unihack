import os
import sys
import io
import time
import json
import requests
from datetime import datetime

BASE_URL = os.getenv("API_BASE_URL", "https://nexus-pi-backend.onrender.com")
WS_ID = f"ws_qa_test_{int(time.time())}"
HEADERS = {"X-Workspace-Id": WS_ID}

# Sample Fresh Arbitrary Industrial Catalog (Tools, Sensors, Valves)
SAMPLE_CSV = """item_title,part_code,vendor_name,specs_category,description,operating_voltage,pressure_range,accuracy_rating,housing_material,ingress_protection,cost_usd,product_url
Digital Pressure Transmitter,PTX-5000-A,Sensata Technologies,Pressure Sensors,High precision piezoresistive pressure transmitter with 4-20mA analog output,24V DC,0-100 bar,±0.25% FS,Stainless Steel 316L,IP67,185.50,https://example.com/ptx5000
Ultrasonic Flow Meter,UFM-800-Pro,Emerson Process,Flow Meters,Non-invasive clamp-on ultrasonic flow meter for industrial water lines,110-240V AC,0-16 bar,±1.0% of reading,Anodized Aluminum,IP65,850.00,https://example.com/ufm800
Optical Rotary Encoder,ENC-1024-B,Sick AG,Encoders,Industrial incremental encoder with 1024 pulses per revolution,5-30V DC,,1024 PPR,Die-cast Zinc,IP64,120.00,https://example.com/enc1024
Pneumatic Solenoid Valve,PSV-24V-02,Festo,Pneumatics,Direct-operated 3/2-way solenoid valve for compressed air automation,24V DC,0.5-10 bar,,Brass / NBR,IP65,45.00,https://example.com/psv24
Laser Distance Sensor,LDS-50M-Prec,Keyence,Optical Sensors,High-accuracy laser distance sensor with digital IO-Link interface,18-30V DC,,±1.0 mm,Polycarbonate / PBT,IP67,490.00,https://example.com/lds50
Digital Pressure Transmitter,PTX-5000-A,Sensata Technologies,Pressure Sensors,Duplicate part test row to verify conflict detection,24V DC,0-100 bar,±0.25% FS,Stainless Steel 316L,IP67,185.50,https://example.com/ptx5000-dup
"""

def wait_for_api_ready(max_attempts=15, delay=5):
    print(f"[INIT] Waiting for backend at {BASE_URL} to be ready...")
    for i in range(max_attempts):
        try:
            r = requests.get(f"{BASE_URL}/", timeout=10)
            if r.status_code == 200:
                print(f"[INIT] Backend is online and ready (Attempt {i+1}). Response: {r.json()}")
                return True
        except Exception as e:
            print(f"[INIT] Waiting for deployment (Attempt {i+1}/{max_attempts})...")
        time.sleep(delay)
    return False

def run_tests():
    print("=" * 70)
    print("NEXUS PI - REAL-TIME CATALOG PROCESSING REGRESSION TEST SUITE")
    print(f"Target: {BASE_URL} | Workspace: {WS_ID}")
    print("=" * 70)

    if not wait_for_api_ready():
        print("[FAIL] Backend did not become healthy within timeout.")
        return {"api_readiness": "FAIL"}

    results = {}

    # --- TEST 1: Health & API Availability ---
    print("\n[TEST 1] Checking API Health & Endpoints...")
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200, f"Status code {r.status_code}"
        print("[PASS] API health endpoint verified.")
        results["api_health"] = "PASS"
    except Exception as e:
        print(f"[FAIL] API Health Failed: {e}")
        results["api_health"] = "FAIL"
        return results

    # --- TEST 2: Reset Workspace ---
    print("\n[TEST 2] Resetting Test Workspace...")
    try:
        r = requests.post(f"{BASE_URL}/api/reset", headers=HEADERS)
        assert r.status_code == 200
        stats = requests.get(f"{BASE_URL}/api/stats", headers=HEADERS).json()
        assert stats.get("total_products") == 0
        print("[PASS] Workspace is clean (0 products).")
        results["workspace_isolation_init"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Workspace Reset Failed: {e}")
        results["workspace_isolation_init"] = "FAIL"

    # --- TEST 3: Upload & Job Creation ---
    print("\n[TEST 3] Uploading Arbitrary Industrial Dataset (CSV) to /api/catalog/import...")
    job_id = None
    try:
        files = {"file": ("industrial_catalog.csv", io.StringIO(SAMPLE_CSV), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/catalog/import", headers=HEADERS, files=files)
        assert r.status_code == 200, f"Upload status: {r.status_code}, response: {r.text}"
        data = r.json()
        job_id = data.get("job_id")
        assert job_id and job_id.startswith("CAT-"), f"Invalid job_id: {job_id}"
        assert data.get("status") == "queued"
        print(f"[PASS] Job created successfully: {job_id}")
        results["job_creation"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Job Creation Failed: {e}")
        results["job_creation"] = "FAIL"
        return results

    # --- TEST 4: Real-time Polling & Stage Tracking ---
    print("\n[TEST 4] Polling Job Status & Tracking Real-time Progression...")
    seen_stages = set()
    final_job = None
    
    start_time = time.time()
    while time.time() - start_time < 45: # 45s timeout
        r = requests.get(f"{BASE_URL}/api/catalog/jobs/{job_id}", headers=HEADERS)
        assert r.status_code == 200
        j_data = r.json()
        
        stage = j_data.get("stage")
        status = j_data.get("status")
        prog = j_data.get("progress", 0)
        seen_stages.add(stage)
        
        print(f"  [{datetime.utcnow().strftime('%H:%M:%S')}] Status: {status.upper()} | Stage: {j_data.get('stage_label')} | Progress: {prog}% | Products: {j_data.get('processed_products')}/{j_data.get('total_products')} | Current: {j_data.get('current_product', {}).get('name')}")
        
        if status in ["completed", "failed", "cancelled"]:
            final_job = j_data
            break
        time.sleep(0.8)

    try:
        assert final_job is not None, "Job timed out before completion."
        assert final_job.get("status") == "completed", f"Job failed: {final_job.get('error_message')}"
        assert final_job.get("progress") == 100.0, f"Expected 100% progress, got {final_job.get('progress')}"
        assert final_job.get("processed_products") == 6, f"Expected 6 processed products, got {final_job.get('processed_products')}"
        assert final_job.get("attributes_extracted") > 15, f"Expected >15 attributes, got {final_job.get('attributes_extracted')}"
        assert final_job.get("conflicts_detected") >= 1, f"Expected duplicate SKU conflict, got {final_job.get('conflicts_detected')}"
        assert len(final_job.get("activity_stream", [])) > 5, "Activity stream missing events"
        print(f"[PASS] Job completed successfully with {len(seen_stages)} stages observed: {seen_stages}")
        results["realtime_pipeline_execution"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Pipeline Execution Failed: {e}")
        results["realtime_pipeline_execution"] = "FAIL"

    # --- TEST 5: Database Persistence Verification ---
    print("\n[TEST 5] Verifying Imported Products & Attributes Persistence...")
    try:
        prods_res = requests.get(f"{BASE_URL}/api/products", headers=HEADERS).json()
        assert len(prods_res) >= 5, f"Expected at least 5 products, got {len(prods_res)}"
        
        p_names = [p["name"] for p in prods_res]
        print(f"  Persisted Products: {p_names}")
        assert any("Pressure" in n for n in p_names)
        assert any("Flow" in n for n in p_names)
        
        first_prod_id = prods_res[0]["id"]
        detail = requests.get(f"{BASE_URL}/api/products/{first_prod_id}", headers=HEADERS).json()
        assert len(detail.get("attributes", [])) > 0, "Attributes not saved"
        print(f"  Sample Product Attributes: {[a['key'] + ': ' + a['raw_value'] for a in detail['attributes'][:3]]}")
        results["data_persistence"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Persistence Verification Failed: {e}")
        results["data_persistence"] = "FAIL"

    # --- TEST 6: Dynamic AI Copilot Suggestions ---
    print("\n[TEST 6] Verifying Dynamic AI Suggestions for Imported Product...")
    try:
        prods_res = requests.get(f"{BASE_URL}/api/products", headers=HEADERS).json()
        test_prod_id = prods_res[0]["id"]
        sug_res = requests.get(f"{BASE_URL}/api/copilot/suggestions/{test_prod_id}", headers=HEADERS).json()
        questions = [q["text"] for q in sug_res.get("questions", [])]
        print(f"  Dynamic Questions Generated: {questions}")
        assert len(questions) > 0, "No dynamic suggestions returned"
        assert any(prods_res[0]["name"] in q or prods_res[0]["category"] in q or "specification" in q.lower() for q in questions)
        results["ai_dynamic_grounding"] = "PASS"
    except Exception as e:
        print(f"[FAIL] AI Suggestions Verification Failed: {e}")
        results["ai_dynamic_grounding"] = "FAIL"

    # --- TEST 7: Review Issues & Conflict Detection ---
    print("\n[TEST 7] Verifying Conflict Detection & Review Queue...")
    try:
        issues = requests.get(f"{BASE_URL}/api/reviews", headers=HEADERS).json()
        print(f"  Review Issues Detected: {len(issues)}")
        assert len(issues) >= 1, "Expected duplicate SKU conflict in review queue"
        print(f"  Top Issue: {issues[0].get('description')}")
        results["conflict_detection"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Review Conflict Verification Failed: {e}")
        results["conflict_detection"] = "FAIL"

    # --- TEST 8: Error & Failure Handling ---
    print("\n[TEST 8] Verifying Corrupt/Empty File Failure Handling...")
    try:
        empty_file = {"file": ("empty.csv", io.StringIO(""), "text/csv")}
        r = requests.post(f"{BASE_URL}/api/catalog/import", headers=HEADERS, files=empty_file)
        err_job_id = r.json().get("job_id")
        
        time.sleep(3)
        err_job = requests.get(f"{BASE_URL}/api/catalog/jobs/{err_job_id}", headers=HEADERS).json()
        assert err_job.get("status") == "failed", f"Expected failed status, got {err_job.get('status')}"
        assert err_job.get("error_message") is not None
        print(f"[PASS] Error handled cleanly: {err_job.get('error_message')}")
        results["failure_handling"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Failure Handling Test Failed: {e}")
        results["failure_handling"] = "FAIL"

    # --- TEST 9: Multi-Tenant Workspace Isolation ---
    print("\n[TEST 9] Verifying Strict Multi-Tenant Isolation...")
    try:
        other_headers = {"X-Workspace-Id": f"ws_isolated_{int(time.time())}"}
        other_stats = requests.get(f"{BASE_URL}/api/stats", headers=other_headers).json()
        assert other_stats.get("total_products") == 0, f"Data leaked to another workspace! Count: {other_stats.get('total_products')}"
        print("[PASS] Strict multi-tenant isolation verified (0 products in unassociated workspace).")
        results["multi_tenant_isolation"] = "PASS"
    except Exception as e:
        print(f"[FAIL] Isolation Test Failed: {e}")
        results["multi_tenant_isolation"] = "FAIL"

    print("\n" + "=" * 70)
    print("FINAL TEST RESULTS SUMMARY:")
    print("=" * 70)
    all_pass = True
    for test_name, res in results.items():
        print(f"  {test_name.upper():<35}: {res}")
        if res != "PASS":
            all_pass = False

    print("=" * 70)
    print(f"OVERALL VERDICT: {'ALL TESTS PASSED' if all_pass else 'FAILURES DETECTED'}")
    print("=" * 70)
    return results

if __name__ == "__main__":
    run_tests()
