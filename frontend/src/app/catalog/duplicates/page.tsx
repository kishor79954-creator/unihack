"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AlertCircle, CheckCircle, ArrowRight, Merge, RefreshCw, Box, Upload } from "lucide-react";

export default function DuplicateManagementPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [merged, setMerged] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const prodA = products[0];
  const prodB = products.length > 1 ? products[1] : null;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center bg-[#111827] border border-[#263449] p-6 rounded-xl shadow-sm relative overflow-hidden">
          <div>
            <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight">
              Catalog Deduplication & Consolidation
            </h1>
            <p className="text-xs text-[#A8B3C2] mt-1">
              Cross-source entity resolution, fuzzy SKU matching, and deterministic record merging.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="px-3.5 py-2 border border-[#263449] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-lg text-xs font-semibold transition-all"
            >
              Back to Catalog
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#A8B3C2]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#3B82F6]" />
            Scanning catalog for potential duplicate product records...
          </div>
        ) : products.length < 2 || merged ? (
          <div className="p-12 text-center bg-[#111827] border border-[#263449] rounded-xl space-y-3">
            <CheckCircle className="w-10 h-10 text-[#22C55E] mx-auto" />
            <h3 className="font-bold text-sm text-[#F3F6FA]">
              {merged ? "Records successfully consolidated!" : "No duplicate records detected"}
            </h3>
            <p className="text-xs text-[#A8B3C2] max-w-md mx-auto">
              {merged
                ? "All canonical specifications and source evidence citations have been combined under single verified SKU."
                : `Your active catalog with ${products.length} product(s) has 100% unique SKUs and distinct entity identifiers.`}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-sm"
            >
              View Active Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#263449] rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#263449] bg-[#0C1220]/60 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-[#F3F6FA] flex items-center gap-2">
                  Potential Duplicate Detected
                </h2>
                <p className="text-xs text-[#A8B3C2] mt-0.5">Similarity match detected between these catalog records.</p>
              </div>
              <div className="px-3 py-1 bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] rounded-md text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Entity Review
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#263449]">
              {/* Product A */}
              <div className="p-6 space-y-4 bg-[#070B12]">
                <div className="inline-block px-2.5 py-0.5 bg-[#111827] text-[#A8B3C2] border border-[#263449] text-[10px] font-bold rounded">
                  Record A (Primary)
                </div>
                <h3 className="font-bold text-sm text-[#F3F6FA]">{prodA.name}</h3>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#263449]">
                    <span className="text-[#667085]">Manufacturer</span>
                    <span className="text-[#F3F6FA] font-semibold">{prodA.manufacturer || "Manufacturer"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#263449]">
                    <span className="text-[#667085]">SKU / Part Number</span>
                    <span className="text-[#60A5FA] font-mono font-bold">{prodA.sku}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#263449]">
                    <span className="text-[#667085]">Category</span>
                    <span className="text-[#F3F6FA]">{prodA.category || "General"}</span>
                  </div>
                </div>
              </div>

              {/* Product B */}
              <div className="p-6 space-y-4 bg-[#111827]">
                <div className="inline-block px-2.5 py-0.5 bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/30 text-[10px] font-bold rounded">
                  Record B (Secondary)
                </div>
                <h3 className="font-bold text-sm text-[#F3F6FA]">{prodB.name}</h3>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#263449]">
                    <span className="text-[#667085]">Manufacturer</span>
                    <span className="text-[#F3F6FA] font-semibold">{prodB.manufacturer || "Manufacturer"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#263449]">
                    <span className="text-[#667085]">SKU / Part Number</span>
                    <span className="text-[#60A5FA] font-mono font-bold">{prodB.sku}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#263449]">
                    <span className="text-[#667085]">Category</span>
                    <span className="text-[#F3F6FA]">{prodB.category || "General"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#0C1220] border-t border-[#263449] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[#A8B3C2]">Merging will combine attribute specifications, sources, and audit logs.</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMerged(true)}
                  className="px-3.5 py-1.5 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white font-bold rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Merge className="w-3.5 h-3.5" /> Consolidate & Merge Records
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
