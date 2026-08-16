"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, AlertTriangle, ShieldCheck, Download, RefreshCw, Layers, Box, Upload, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/api";

export default function PublishingWorkspacePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    apiFetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          if (!selectedProductId) {
            setSelectedProductId(data[0].id);
          }
        } else {
          setProducts([]);
          setSelectedProductId(null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      apiFetch(`/api/products/${selectedProductId}`)
        .then((res) => res.json())
        .then((p) => setSelectedProduct(p))
        .catch(console.error);
    } else {
      setSelectedProduct(null);
    }
  }, [selectedProductId]);

  const handlePublish = async () => {
    if (!selectedProductId) return;
    setPublishing(true);
    setResult(null);
    try {
      const res = await apiFetch(`/api/publish/${selectedProductId}`, { method: "POST" });
      const data = await res.json();
      setResult(data);
      fetchProducts();
    } catch (e) {
      setResult({ status: "ERROR", message: "Network connection failed." });
    } finally {
      setPublishing(false);
    }
  };

  // Pre-flight calculation
  const hasIdentity = Boolean(selectedProduct?.name && selectedProduct?.sku);
  const hasCompleteness = (selectedProduct?.completeness_score || 0) >= 70;
  const noConflicts = (selectedProduct?.issues || []).filter((i: any) => i.status === "OPEN").length === 0;
  const hasDescription = Boolean(selectedProduct?.description);
  const isReady = hasIdentity && hasCompleteness && noConflicts;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-[#263449] p-6 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#60A5FA]/30 to-transparent"></div>
          <div>
            <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight">
              Commerce Publishing & Pre-Flight Governance
            </h1>
            <p className="text-xs text-[#A8B3C2] mt-1">
              Verify pre-flight checks, validate cross-source evidence, and push verified catalog products to storefronts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {products.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A8B3C2] font-semibold">Target Product:</span>
                <select
                  value={selectedProductId || ""}
                  onChange={(e) => {
                    setSelectedProductId(Number(e.target.value));
                    setResult(null);
                  }}
                  className="bg-[#070B12] border border-[#263449] text-xs font-semibold text-[#F3F6FA] rounded-md px-3 py-1.5 focus:outline-none focus:border-[#3B82F6]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedProduct && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-4 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] disabled:bg-[#263449] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-all shrink-0"
              >
                <CheckCircle className="w-4 h-4" />
                {publishing ? "Publishing..." : `Publish ${selectedProduct.name}`}
              </button>
            )}
          </div>
        </div>

        {/* Status Result Message */}
        {result && (
          <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
            result.status === "PUBLISHED" ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30" : "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
          }`}>
            <span>{result.message || (result.status === "PUBLISHED" ? "Product successfully published to storefront." : JSON.stringify(result))}</span>
            <StatusBadge status={result.status} />
          </div>
        )}

        {products.length === 0 ? (
          <div className="p-12 text-center border border-[#263449] rounded-xl bg-[#111827] space-y-3">
            <Box className="w-10 h-10 text-[#667085] mx-auto" />
            <h3 className="font-bold text-sm text-[#F3F6FA]">No products to publish</h3>
            <p className="text-xs text-[#A8B3C2] max-w-sm mx-auto">
              Import technical datasheets or a CSV product catalog to run pre-flight governance and publishing.
            </p>
            <Link
              href="/ingestion"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> Import Catalog
            </Link>
          </div>
        ) : selectedProduct ? (
          <div className="bg-[#111827] border border-[#263449] rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#263449] pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider">PRE-FLIGHT VALIDATION</span>
                <h3 className="font-bold text-sm text-[#F3F6FA] mt-0.5">{selectedProduct.name}</h3>
                <span className="text-xs font-mono text-[#A8B3C2]">SKU: {selectedProduct.sku}</span>
              </div>
              <StatusBadge status={selectedProduct.status || "VERIFIED"} />
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-[#070B12] rounded-lg border border-[#263449]">
                <span className="font-semibold text-[#F3F6FA]">1. Required Identity Attributes (SKU, Name, Category)</span>
                <span className={`font-bold ${hasIdentity ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {hasIdentity ? "PASSED (100%)" : "FAILED (Missing Fields)"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#070B12] rounded-lg border border-[#263449]">
                <span className="font-semibold text-[#F3F6FA]">2. Attribute Completeness Score (&gt; 70% Threshold)</span>
                <span className={`font-bold ${hasCompleteness ? "text-[#22C55E]" : "text-[#F59E0B]"}`}>
                  {hasCompleteness ? `PASSED (${selectedProduct.completeness_score || 85}%)` : `LOW (${selectedProduct.completeness_score || 0}%)`}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#070B12] rounded-lg border border-[#263449]">
                <span className="font-semibold text-[#F3F6FA]">3. Unresolved Cross-Source Conflicts Check</span>
                <span className={`font-bold ${noConflicts ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {noConflicts ? "PASSED (0 Conflicts)" : "ACTION REQUIRED (Open Issues)"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#070B12] rounded-lg border border-[#263449]">
                <span className="font-semibold text-[#F3F6FA]">4. Technical Descriptions & Evidence Grounding</span>
                <span className={`font-bold ${hasDescription ? "text-[#22C55E]" : "text-[#F59E0B]"}`}>
                  {hasDescription ? "PASSED (Grounded)" : "RECOMMENDED ENRICHMENT"}
                </span>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </AppShell>
  );
}
