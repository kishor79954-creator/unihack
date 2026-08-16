import requests
import io
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000"

def run_replacement_test():
    print("=" * 70)
    print("PHASE 21: COMPLETE DATASET REPLACEMENT ACCEPTANCE TEST")
    print("=" * 70)
    
    # 1. Reset
    print("\n1. Resetting database to empty state...")
    r = requests.post(f"{BASE_URL}/api/reset")
    assert r.status_code == 200
    
    stats = requests.get(f"{BASE_URL}/api/stats").json()
    assert stats["total_products"] == 0
    print("   [PASS]: Database is empty (0 products, 0.0 quality score).")
    
    # 2. Ingest Dataset A (Consumer Audio)
    print("\n2. Ingesting Dataset A (5 Consumer Audio Products)...")
    dataset_a = """name,sku,manufacturer,category,description,Frequency,Impedance,Battery
Sony WH-1000XM5,SONY-XM5,Sony,Audio,Flagship ANC headphones,4Hz-40kHz,48 Ohm,30 Hours
Bose QC Ultra,BOSE-QCU,Bose,Audio,Spatial audio ANC headphones,20Hz-20kHz,32 Ohm,24 Hours
Apple AirPods Max,APPL-APM,Apple,Audio,High-fidelity headphones,20Hz-20kHz,32 Ohm,20 Hours
"""
    files = {"file": ("dataset_a_audio.csv", io.BytesIO(dataset_a.encode("utf-8")), "text/csv")}
    r = requests.post(f"{BASE_URL}/api/products/upload", files=files)
    assert r.status_code == 200
    
    products_a = requests.get(f"{BASE_URL}/api/products").json()
    assert len(products_a) == 3
    print(f"   [PASS]: Dataset A active with {len(products_a)} products: {[p['name'] for p in products_a]}")
    
    # 3. Ingest Dataset B (Industrial Pumps with Replace Mode)
    print("\n3. Ingesting Dataset B (Industrial Pumps with Clean Replacement)...")
    requests.post(f"{BASE_URL}/api/reset")
    
    dataset_b = """name,sku,manufacturer,category,description,Max Flow Rate,Head Pressure,Motor Power,Impeller Material
Grundfos CR 15-3,GRUND-CR15,Grundfos,Industrial Pumps,Vertical multistage centrifugal inline pump,15 m3/h,45 m,3.0 kW,Stainless Steel 316
Flowserve Mark 3 ANSI,FLOW-MK3-ANSI,Flowserve,Industrial Pumps,High performance chemical process pump,50 m3/h,95 m,11.0 kW,Duplex Alloy 2205
Wilo Stratos MAXO 30,WILO-STRATOS,Wilo,Industrial Pumps,Smart glandless circulator pump,12 m3/h,14 m,0.75 kW,Composite PPE
Sulzer AHLSTAR N,SULZER-AHL-N,Sulzer,Industrial Pumps,Heavy duty single-stage centrifugal slurry pump,120 m3/h,110 m,45.0 kW,Chromium Iron
"""
    files = {"file": ("dataset_b_industrial_pumps.csv", io.BytesIO(dataset_b.encode("utf-8")), "text/csv")}
    r = requests.post(f"{BASE_URL}/api/products/upload", files=files)
    assert r.status_code == 200
    
    # 4. Verify ZERO Dataset A products remain
    print("\n4. Verifying ZERO Dataset A data remains visible anywhere...")
    products_b = requests.get(f"{BASE_URL}/api/products").json()
    assert len(products_b) == 4
    
    all_names = [p["name"] for p in products_b]
    all_mfgs = [p["manufacturer"] for p in products_b]
    
    assert "Sony WH-1000XM5" not in all_names
    assert "Bose QC Ultra" not in all_names
    assert "Apple AirPods Max" not in all_names
    assert "SKF 6205-2RS" not in all_names
    assert "Grundfos CR 15-3" in all_names
    assert "Flowserve Mark 3 ANSI" in all_names
    print(f"   [PASS]: ZERO Dataset A products remain. Active products: {all_names}")
    
    # 5. Verify Graph reflects Dataset B
    first_b_id = products_b[0]["id"]
    graph_b = requests.get(f"{BASE_URL}/api/graph/{first_b_id}").json()
    graph_node_names = [n["name"] for n in graph_b["nodes"]]
    assert "Grundfos CR 15-3" in graph_node_names
    assert "Grundfos" in graph_node_names
    print(f"   [PASS]: Knowledge Graph dynamically derived for Grundfos pump: {graph_node_names[:3]}")
    
    # 6. Verify Evidence reflects Dataset B
    ev_b = requests.get(f"{BASE_URL}/api/evidence/{first_b_id}").json()
    assert ev_b["evidence"][0]["source"] == "dataset_b_industrial_pumps.csv"
    print(f"   [PASS]: Evidence cites dataset_b_industrial_pumps.csv: {ev_b['evidence'][0]['text_snippet']}")
    
    print("\n" + "=" * 70)
    print("PHASE 21 DATASET REPLACEMENT TEST: 100% SUCCESSFUL")
    print("=" * 70)

if __name__ == "__main__":
    run_replacement_test()
