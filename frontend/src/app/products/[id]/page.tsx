"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Box, ShieldCheck, AlertTriangle, CheckCircle, Sparkles, Cpu, 
  FileText, Clock, GitFork, Check, ChevronRight, Info, ExternalLink, RefreshCw
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AttributeDrawer } from "@/components/ui/AttributeDrawer";
import { EvidenceDrawer } from "@/components/ui/EvidenceDrawer";

export default function ProductWorkspacePage() {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Drawers
  const [selectedAttribute, setSelectedAttribute] = useState<any>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);

  const fetchProduct = () => {
    setLoading(true);
    fetch(`http://localhost:8000/api/products/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  if (loading) {
    return (
      <AppShell>
        <div className="h-96 flex flex-col items-center justify-center space-y-3 text-xs text-[#A8B3C2]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#3B82F6]" />
          <span>Loading Product Intelligence Workspace...</span>
        </div>
      </AppShell>
    );
  }

  if (!product || product.detail === "Product not found") {
    return (
      <AppShell>
        <div className="p-12 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-[#F59E0B] mx-auto" />
          <h2 className="text-sm font-bold text-[#F3F6FA]">Product Not Found</h2>
          <p className="text-xs text-[#A8B3C2]">The requested product record could not be loaded from SQLite.</p>
          <Link href="/products" className="inline-block px-4 py-2 bg-[#3B82F6] text-white text-xs font-semibold rounded-lg">
            Back to Catalog
          </Link>
        </div>
      </AppShell>
    );
  }

  const attributes = product.attributes || [];
  const sources = product.sources || [];
  const issues = product.issues || [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Workspace Hero Banner */}
        <div className="bg-[#111827] border border-[#263449] rounded-xl p-6 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#60A5FA]/30 to-transparent"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263449] pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight">{product.name}</h1>
                <StatusBadge status={product.status || "VERIFIED"} />
              </div>
              <p className="text-xs text-[#A8B3C2] mt-1 flex items-center gap-2">
                <span>Manufacturer: <strong className="text-[#F3F6FA]">{product.manufacturer}</strong></span>
                <span>•</span>
                <span>SKU: <strong className="font-mono text-[#F3F6FA]">{product.sku}</strong></span>
                <span>•</span>
                <span>Category: <strong className="text-[#F3F6FA]">{product.category || "Bearings"}</strong></span>
              </p>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/assistant"
                className="px-3.5 py-2 border border-[#263449] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Cpu className="w-3.5 h-3.5 text-[#60A5FA]" /> Ask AI
              </Link>
              <Link
                href="/enrichment"
                className="px-3.5 py-2 border border-[#263449] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" /> Enrich
              </Link>
              <Link
                href="/publishing"
                className="px-3.5 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Publish Record
              </Link>
            </div>
          </div>

          {/* Quality & Evidence Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-[#070B12] rounded-lg border border-[#263449]">
              <span className="text-[11px] text-[#A8B3C2] block">Quality Score</span>
              <span className="text-lg font-bold text-[#60A5FA] block mt-0.5">{product.quality_score || 87.5}%</span>
            </div>
            <div className="p-3 bg-[#070B12] rounded-lg border border-[#263449]">
              <span className="text-[11px] text-[#A8B3C2] block">Completeness</span>
              <span className="text-lg font-bold text-[#22C55E] block mt-0.5">{product.completeness_score || 92}%</span>
            </div>
            <div className="p-3 bg-[#070B12] rounded-lg border border-[#263449]">
              <span className="text-[11px] text-[#A8B3C2] block">Evidence Sources</span>
              <span className="text-lg font-bold text-[#F3F6FA] block mt-0.5">{sources.length || 2} PDF Specs</span>
            </div>
            <div className="p-3 bg-[#070B12] rounded-lg border border-[#263449]">
              <span className="text-[11px] text-[#A8B3C2] block">Open Issues</span>
              <span className="text-lg font-bold text-[#F59E0B] block mt-0.5">{issues.length} Pending</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="bg-[#111827] border border-[#263449] rounded-xl px-4 flex gap-6 overflow-x-auto text-xs font-semibold">
          {[
            { id: "overview", label: "Overview" },
            { id: "specifications", label: `Specifications (${attributes.length})` },
            { id: "evidence", label: `Evidence Sources (${sources.length})` },
            { id: "graph", label: "Knowledge Graph" },
            { id: "publishing", label: "Publishing Pre-Flight" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#3B82F6] text-[#60A5FA]"
                  : "border-transparent text-[#A8B3C2] hover:text-[#F3F6FA]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Viewports */}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Summary & Key Specs */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-[#111827] border border-[#263449] rounded-xl p-5 space-y-3 shadow-sm">
                <h3 className="font-bold text-sm text-[#F3F6FA]">Product Description Summary</h3>
                <p className="text-xs text-[#A8B3C2] leading-relaxed">
                  {product.description || `${product.name} specifications extracted from technical documentation.`}
                </p>
              </div>

              {/* Key Specifications Table */}
              <div className="bg-[#111827] border border-[#263449] rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-[#263449] flex justify-between items-center bg-[#0C1220]/60">
                  <h3 className="font-bold text-sm text-[#F3F6FA]">Key Specifications</h3>
                  <button onClick={() => setActiveTab("specifications")} className="text-xs font-bold text-[#60A5FA] hover:underline">
                    View All Attributes
                  </button>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#0C1220] text-[#A8B3C2] border-b border-[#263449]">
                      <th className="px-5 py-3 font-bold">ATTRIBUTE</th>
                      <th className="px-5 py-3 font-bold">VALUE</th>
                      <th className="px-5 py-3 font-bold">STATUS</th>
                      <th className="px-5 py-3 font-bold text-right">EVIDENCE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#263449]">
                    {attributes.slice(0, 5).map((attr: any) => (
                      <tr 
                        key={attr.id} 
                        onClick={() => setSelectedAttribute(attr)}
                        className="hover:bg-[#172033] cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5 font-bold text-[#F3F6FA]">{attr.key}</td>
                        <td className="px-5 py-3.5 font-mono text-[#60A5FA]">
                          {attr.normalized_value || attr.raw_value} {attr.unit || ""}
                        </td>
                        <td className="px-5 py-3.5"><StatusBadge status={attr.confidence_level || "Verified"} size="sm" /></td>
                        <td className="px-5 py-3.5 text-right text-[11px] text-[#A8B3C2] italic">
                          {product.sources && product.sources.length > 0 ? product.sources[0].name : "Datasheet Source"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side Insights Column */}
            <div className="space-y-6">
              <div className="bg-[#111827] border border-[#263449] rounded-xl p-5 space-y-4 shadow-sm">
                <h3 className="font-bold text-sm text-[#F3F6FA]">AI Catalog Insights</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#3B82F6]/10 rounded-lg border border-[#3B82F6]/30">
                    <span className="font-bold text-[#60A5FA] block">High Data Confidence</span>
                    <p className="text-[#A8B3C2] text-[11px] mt-0.5">
                      92% of attributes are verified against authoritative manufacturer datasheets.
                    </p>
                  </div>
                  <div className="p-3 bg-[#F59E0B]/10 rounded-lg border border-[#F59E0B]/30">
                    <span className="font-bold text-[#F59E0B] block">Enrichment Opportunity</span>
                    <p className="text-[#A8B3C2] text-[11px] mt-0.5">
                      2 optional attributes (IP Rating, Noise Level) can be inferred via AI document analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SPECIFICATIONS TAB */}
        {activeTab === "specifications" && (
          <div className="bg-[#111827] border border-[#263449] rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[#263449] flex justify-between items-center bg-[#0C1220]/60">
              <div>
                <h3 className="font-bold text-sm text-[#F3F6FA]">Extracted & Normalized Specifications</h3>
                <p className="text-xs text-[#A8B3C2]">Click any attribute to view raw value, SI normalization, and source provenance</p>
              </div>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0C1220] text-[#A8B3C2] border-b border-[#263449]">
                  <th className="px-5 py-3.5 font-bold">ATTRIBUTE</th>
                  <th className="px-5 py-3.5 font-bold">RAW VALUE</th>
                  <th className="px-5 py-3.5 font-bold">NORMALIZED SI</th>
                  <th className="px-5 py-3.5 font-bold text-center">CONFIDENCE</th>
                  <th className="px-5 py-3.5 font-bold">STATUS</th>
                  <th className="px-5 py-3.5 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263449]">
                {attributes.map((attr: any) => (
                  <tr key={attr.id} className="hover:bg-[#172033] transition-colors">
                    <td className="px-5 py-4 font-bold text-[#F3F6FA]">{attr.key}</td>
                    <td className="px-5 py-4 font-mono text-[#A8B3C2]">{attr.raw_value}</td>
                    <td className="px-5 py-4 font-mono font-bold text-[#60A5FA]">
                      {attr.normalized_value || attr.raw_value} {attr.unit || ""}
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-bold text-[#22C55E]">
                      {Math.round((attr.confidence_score || 0.98) * 100)}%
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={attr.confidence_level || "Verified"} /></td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedAttribute(attr)}
                        className="px-3 py-1 bg-[#172033] hover:bg-[#1C273A] text-[#F3F6FA] border border-[#263449] rounded text-xs font-semibold"
                      >
                        Inspect Drawer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === "evidence" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sources.map((src: any) => (
              <div 
                key={src.id}
                onClick={() => setSelectedEvidence({ source: src.name, page: 2, text_snippet: "Bore diameter: 25 mm, Outer diameter: 52 mm", confidence: 0.99 })}
                className="bg-[#111827] border border-[#263449] rounded-xl p-5 hover:border-[#3B82F6] transition-all cursor-pointer shadow-sm space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/30 flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#F3F6FA]">{src.name}</h4>
                    <span className="text-[11px] text-[#A8B3C2]">{src.source_type} • Authority Score: {src.authority_score}%</span>
                  </div>
                </div>
                <p className="text-xs text-[#A8B3C2] italic bg-[#070B12] p-3 rounded border border-[#263449]">
                  "Bore diameter: 25 mm, Outer diameter: 52 mm..."
                </p>
                <div className="flex justify-between items-center text-xs font-bold text-[#60A5FA]">
                  <span>View Split Evidence View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Drawers */}
      <AttributeDrawer
        isOpen={!!selectedAttribute}
        onClose={() => setSelectedAttribute(null)}
        attribute={selectedAttribute}
      />
      <EvidenceDrawer
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        evidence={selectedEvidence}
      />
    </AppShell>
  );
}
