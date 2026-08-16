"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Sparkles, ShieldCheck, AlertTriangle, CheckCircle, XCircle, 
  ArrowRight, FileText, RefreshCw, Check, X, Box, Upload
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EvidenceDrawer } from "@/components/ui/EvidenceDrawer";
import { apiFetch } from "@/lib/api";

export default function EnrichmentWorkspacePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [impact, setImpact] = useState<any>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiFetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          setSelectedProductId(data[0].id);
        } else {
          setProducts([]);
          setSelectedProductId(null);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const runAnalysis = (pId: number) => {
    setLoading(true);
    apiFetch(`/api/enrichment/analyze/${pId}`)
      .then((res) => res.json())
      .then((data) => {
        setOpportunities(data.opportunities || []);
        setImpact(data.impact || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (selectedProductId) {
      runAnalysis(selectedProductId);
    } else {
      setOpportunities([]);
      setImpact(null);
    }
  }, [selectedProductId]);

  const handleApprove = (id: string) => {
    setApprovedIds((prev) => new Set([...prev, id]));
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Workspace Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-[#263449] p-6 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#60A5FA]/30 to-transparent"></div>
          <div>
            <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight">
              Catalog Enrichment Operations
            </h1>
            <p className="text-xs text-[#A8B3C2] mt-1">
              AI-assisted discovery of missing specifications, description enhancements, and SEO titles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {products.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A8B3C2] font-semibold">Target Product:</span>
                <select
                  value={selectedProductId || ""}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="bg-[#070B12] border border-[#263449] text-xs font-semibold text-[#F3F6FA] rounded-md px-3 py-1.5 focus:outline-none focus:border-[#3B82F6]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedProductId && (
              <button
                onClick={() => runAnalysis(selectedProductId)}
                disabled={loading}
                className="px-3.5 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-all shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Run AI Analysis
              </button>
            )}
          </div>
        </div>

        {/* Impact Bar */}
        {impact && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#111827] border border-[#263449] rounded-xl">
              <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">OPPORTUNITIES FOUND</span>
              <span className="text-2xl font-extrabold text-[#60A5FA] block mt-1">{opportunities.length}</span>
            </div>
            <div className="p-4 bg-[#111827] border border-[#263449] rounded-xl">
              <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">QUALITY SCORE BEFORE</span>
              <span className="text-2xl font-extrabold text-[#A8B3C2] block mt-1">{impact.quality_before}%</span>
            </div>
            <div className="p-4 bg-[#111827] border border-[#263449] rounded-xl">
              <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">ESTIMATED AFTER</span>
              <span className="text-2xl font-extrabold text-[#22C55E] block mt-1">{impact.quality_after}%</span>
            </div>
            <div className="p-4 bg-[#111827] border border-[#263449] rounded-xl">
              <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">COMMERCE READINESS</span>
              <span className="text-2xl font-extrabold text-[#22C55E] block mt-1">{impact.commerce_readiness_after}%</span>
            </div>
          </div>
        )}

        {/* Proposals List */}
        {products.length === 0 ? (
          <div className="p-12 text-center border border-[#263449] rounded-xl bg-[#111827] space-y-3">
            <Box className="w-10 h-10 text-[#667085] mx-auto" />
            <h3 className="font-bold text-sm text-[#F3F6FA]">No products to enrich</h3>
            <p className="text-xs text-[#A8B3C2] max-w-sm mx-auto">
              Upload datasheets or import CSV catalog datasets to discover missing attribute proposals and SEO suggestions.
            </p>
            <Link
              href="/ingestion"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> Import Catalog
            </Link>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#263449] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#F3F6FA]">AI Proposed Catalog Enrichments</h3>

            {loading ? (
              <div className="p-12 text-center text-xs text-[#A8B3C2]">Analyzing catalog via Gemini AI engine...</div>
            ) : opportunities.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#A8B3C2]">No pending enrichment opportunities for this product.</div>
            ) : (
              <div className="space-y-4">
                {opportunities.map((opp, idx) => {
                  const isApproved = approvedIds.has(opp.id);
                  return (
                    <div 
                      key={opp.id || idx}
                      className="p-4 rounded-xl border border-[#263449] bg-[#070B12] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider bg-[#3B82F6]/10 px-2 py-0.5 rounded border border-[#3B82F6]/30">
                            {opp.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-[#667085] font-mono">Confidence: {opp.confidence}%</span>
                        </div>
                        <h4 className="font-bold text-sm text-[#F3F6FA]">{opp.attribute}</h4>
                        <p className="text-xs text-[#A8B3C2]">
                          Proposed: <span className="text-[#60A5FA] font-medium font-mono">{opp.proposed_value}</span>
                        </p>
                        {opp.reason && (
                          <p className="text-[11px] text-[#667085] italic">{opp.reason}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isApproved ? (
                          <span className="px-3 py-1.5 bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold rounded-lg flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApprove(opp.id)}
                            className="px-3.5 py-1.5 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept Suggestion
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      <EvidenceDrawer
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        evidence={selectedEvidence}
      />
    </AppShell>
  );
}
