import requests
import io
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000"

def test_catalog_management():
    print("=" * 60)
    print("TESTING LOCAL PERSISTENCE & CATALOG MANAGEMENT APIS")
    print("=" * 60)
    
    # 1. Health & AI Status
    print("\n1. Testing /api/system/ai-status...")
    res = requests.get(f"{BASE_URL}/api/system/ai-status")
    assert res.status_code == 200
    ai_status = res.json()
    assert "provider" in ai_status
    print(f"   [PASS]: AI Status: {ai_status['model']} • Accuracy: {ai_status['grounding_accuracy']}%")
    
    # 2. System Alerts
    print("\n2. Testing /api/alerts...")
    res = requests.get(f"{BASE_URL}/api/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert "unread_count" in alerts
    print(f"   [PASS]: Alerts Endpoint: {alerts['unread_count']} unread alerts.")
    
    # 3. Reset and Ingest Catalog
    print("\n3. Resetting and Ingesting Test Catalog...")
    requests.post(f"{BASE_URL}/api/reset")
    csv_data = """name,sku,manufacturer,category,description,Voltage,Weight
Industrial Motor M1,MOT-M1,Siemens,Motors,High efficiency 3-phase motor,400V,18kg
Centrifugal Pump P1,PUMP-P1,Grundfos,Pumps,Stainless steel inline pump,230V,12kg
Industrial Sensor S1,SENS-S1,Omron,Sensors,Photoelectric retroreflective sensor,24V,0.2kg
"""
    files = {"file": ("test_catalog.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = requests.post(f"{BASE_URL}/api/products/upload", files=files)
    assert res.status_code == 200
    
    products = requests.get(f"{BASE_URL}/api/products").json()
    assert len(products) == 3
    print(f"   [PASS]: Ingested {len(products)} products into SQLite database.")
    
    # 4. Test Catalog Export (CSV & JSON)
    print("\n4. Testing /api/catalog/export...")
    csv_res = requests.get(f"{BASE_URL}/api/catalog/export?format=csv")
    assert csv_res.status_code == 200
    assert "SKU" in csv_res.text and "Industrial Motor M1" in csv_res.text
    print("   [PASS]: CSV export generated with headers and attributes.")
    
    json_res = requests.get(f"{BASE_URL}/api/catalog/export?format=json")
    assert json_res.status_code == 200
    json_data = json_res.json()
    assert len(json_data) == 3
    print("   [PASS]: JSON export generated with full relational attributes.")
    
    # 5. Test Single Archive & Restore
    print("\n5. Testing /api/products/{id}/archive...")
    p1_id = products[0]["id"]
    arch_res = requests.post(f"{BASE_URL}/api/products/{p1_id}/archive")
    assert arch_res.status_code == 200
    assert arch_res.json()["new_status"] == "ARCHIVED"
    
    # Verify filter=archived
    arch_prods = requests.get(f"{BASE_URL}/api/products?filter=archived").json()
    assert len(arch_prods) == 1
    print(f"   [PASS]: Product #{p1_id} successfully archived.")
    
    # Restore
    rest_res = requests.post(f"{BASE_URL}/api/products/{p1_id}/archive")
    assert rest_res.status_code == 200
    assert rest_res.json()["new_status"] == "VERIFIED"
    print(f"   [PASS]: Product #{p1_id} successfully restored to active catalog.")
    
    # 6. Test Bulk Publish
    print("\n6. Testing /api/products/bulk-publish...")
    p_ids = [p["id"] for p in products]
    pub_res = requests.post(f"{BASE_URL}/api/products/bulk-publish", json={"product_ids": p_ids})
    assert pub_res.status_code == 200
    assert pub_res.json()["published_count"] == 3
    print("   [PASS]: Bulk published 3 products.")
    
    # 7. Test Bulk Delete
    print("\n7. Testing /api/products/bulk-delete...")
    del_res = requests.post(f"{BASE_URL}/api/products/bulk-delete", json={"product_ids": [products[1]["id"], products[2]["id"]]})
    assert del_res.status_code == 200
    assert del_res.json()["deleted_count"] == 2
    
    remaining = requests.get(f"{BASE_URL}/api/products").json()
    assert len(remaining) == 1
    print("   [PASS]: Bulk deleted 2 products; 1 product remains.")
    
    # 8. Test Single Delete
    print("\n8. Testing DELETE /api/products/{id}...")
    single_del = requests.delete(f"{BASE_URL}/api/products/{remaining[0]['id']}")
    assert single_del.status_code == 200
    
    final_prods = requests.get(f"{BASE_URL}/api/products").json()
    assert len(final_prods) == 0
    print("   [PASS]: Single delete successful; catalog cleanly empty.")
    
    print("\n" + "=" * 60)
    print("ALL CATALOG MANAGEMENT & HEADER APIS VERIFIED (100% PASS)")
    print("=" * 60)

if __name__ == "__main__":
    test_catalog_management()
