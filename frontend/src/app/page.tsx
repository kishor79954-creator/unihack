"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Box, ShieldCheck, Sparkles, AlertTriangle, CheckCircle, 
  ArrowRight, FileText, Activity, Layers, Upload, Search, Filter, Plus, ArrowUpRight,
  RefreshCw, CheckCircle2, AlertCircle
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { API_BASE_URL } from "@/lib/api";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    total_products: 0,
    quality_score: 0.0,
    ai_confidence: 0.0,
    needs_review: 0,
    conflicts: 0,
    enrichment_opportunities: 0,
    publishing_ready: 0
  });
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, reviewsRes, auditRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/stats`),
        fetch(`${API_BASE_URL}/api/products`),
        fetch(`${API_BASE_URL}/api/reviews`),
        fetch(`${API_BASE_URL}/api/audit-events`)
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
      if (reviewsRes.ok) setReviews(await reviewsRes.json());
      if (auditRes.ok) setAuditEvents(await auditRes.json());
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalProducts = stats.total_products || products.length || 0;
  
  // Dynamic Recommendation logic based on actual database state
  let nextAction = {
    title: "Get Started by Importing Your Product Catalog",
    description: "Upload a technical PDF datasheet, CSV product dataset, or manual specifications to extract attributes and build your knowledge graph.",
    badge: "GET STARTED",
    badgeColor: "bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/30",
    buttonText: "Import Document",
    href: "/ingestion"
  };

  if (totalProducts > 0) {
    if (reviews && reviews.length > 0) {
      const topIssue = reviews[0];
      nextAction = {
        title: `Resolve ${topIssue.product?.name || "Product"} Quality Issue`,
        description: topIssue.description || `Review detected attribute mismatch for ${topIssue.attribute_key || "specification"} before publishing.`,
        badge: topIssue.priority || "HIGH PRIORITY",
        badgeColor: topIssue.priority === "CRITICAL" ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30" : "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
        buttonText: "Review Conflict",
        href: "/review"
      };
    } else if (stats.enrichment_opportunities > 0) {
      const firstIncomplete = products.find((p: any) => (p.quality_score || 0) < 90) || products[0];
      nextAction = {
        title: `Enrich ${firstIncomplete?.name || "Product"} Attributes with AI`,
        description: `Generate missing commercial descriptions and technical attributes to improve catalog completeness.`,
        badge: "ENRICHMENT READY",
        badgeColor: "bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/30",
        buttonText: "Run AI Enrichment",
        href: `/products/${firstIncomplete?.id || 1}/enrich`
      };
    } else {
      nextAction = {
        title: "All Products Verified & Ready for Commerce Publishing",
        description: "Your catalog specifications, evidence citations, and descriptions have passed pre-flight validation.",
        badge: "READY TO PUBLISH",
        badgeColor: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30",
        buttonText: "Publish Catalog",
        href: "/publishing"
      };
    }
  }

  // 6-Step Workflow States
  const isExtracted = totalProducts > 0;
  const isReviewed = totalProducts > 0 && reviews.length === 0;
  const isEnriched = totalProducts > 0 && stats.enrichment_opportunities === 0;
  const isVerified = (stats.quality_score || 0) >= 80;
  const isPublished = (stats.publishing_ready || 0) > 0;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Layer 1: Workflow Step Progression */}
        <div className="bg-[#111827] border border-[#263449] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-[#60A5FA] tracking-wider uppercase block">INTELLIGENCE PIPELINE</span>
              <h2 className="text-sm font-bold text-[#F3F6FA] mt-0.5">Catalog Intelligence Workflow</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#A8B3C2]">Overall Completeness:</span>
              <span className="font-mono font-bold text-sm text-[#60A5FA] bg-[#3B82F6]/10 border border-[#3B82F6]/30 px-2.5 py-0.5 rounded-full">
                {stats.quality_score || 0}%
              </span>
              <button 
                onClick={fetchDashboardData}
                className="p-1 text-[#667085] hover:text-[#F3F6FA] transition-colors"
                title="Refresh Metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            
            <Link href="/ingestion" className={`p-3 rounded-lg border transition-all ${totalProducts > 0 ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]" : "bg-[#172033] border-[#3B82F6] text-[#60A5FA]"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold">STEP 1</span>
                {totalProducts > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-[#60A5FA] animate-ping" />}
              </div>
              <span className="font-bold block">1. Ingest Data</span>
              <span className="text-[10px] opacity-75">{totalProducts} Files</span>
            </Link>

            <Link href="/products" className={`p-3 rounded-lg border transition-all ${isExtracted ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]" : "bg-[#0C1220] border-[#263449] text-[#667085]"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold">STEP 2</span>
                {isExtracted && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <span className="font-bold block">2. Extract Specs</span>
              <span className="text-[10px] opacity-75">{totalProducts} Products</span>
            </Link>

            <Link href="/review" className={`p-3 rounded-lg border transition-all ${reviews.length > 0 ? "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]" : isReviewed ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]" : "bg-[#0C1220] border-[#263449] text-[#667085]"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold">STEP 3</span>
                {reviews.length > 0 ? <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" /> : isReviewed && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <span className="font-bold block">3. Review Issues</span>
              <span className="text-[10px] opacity-75">{reviews.length} Conflicts</span>
            </Link>

            <Link href="/enrichment" className={`p-3 rounded-lg border transition-all ${isEnriched ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]" : "bg-[#0C1220] border-[#263449] text-[#667085]"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold">STEP 4</span>
                {isEnriched && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <span className="font-bold block">4. AI Enrich</span>
              <span className="text-[10px] opacity-75">{stats.enrichment_opportunities} Opps</span>
            </Link>

            <Link href="/assistant" className={`p-3 rounded-lg border transition-all ${isVerified ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]" : "bg-[#0C1220] border-[#263449] text-[#667085]"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold">STEP 5</span>
                {isVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <span className="font-bold block">5. Grounding</span>
              <span className="text-[10px] opacity-75">AI Verified</span>
            </Link>

            <Link href="/publishing" className={`p-3 rounded-lg border transition-all ${isPublished ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]" : "bg-[#0C1220] border-[#263449] text-[#667085]"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold">STEP 6</span>
                {isPublished && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <span className="font-bold block">6. Publish</span>
              <span className="text-[10px] opacity-75">{stats.publishing_ready} Ready</span>
            </Link>

          </div>
        </div>

        {/* Layer 2: Core KPI Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            label="TOTAL PRODUCTS"
            value={totalProducts}
            trend="100%"
            trendUp={true}
            subtext="Persisted in SQLite database"
            icon={Box}
          />
          <KPICard
            label="CATALOG COMPLETENESS"
            value={`${stats.quality_score || 0}%`}
            trend="+4.2%"
            trendUp={true}
            subtext="Average attribute coverage"
            icon={ShieldCheck}
          />
          <KPICard
            label="NEEDS REVIEW"
            value={reviews.length || stats.needs_review || 0}
            trend={reviews.length > 0 ? "Issues" : "Clean"}
            trendUp={reviews.length === 0}
            subtext="Specification conflicts detected"
            icon={AlertTriangle}
          />
          <KPICard
            label="ENRICHMENT OPPS"
            value={stats.enrichment_opportunities || 0}
            trend="AI Ready"
            trendUp={true}
            subtext="Missing fields identified"
            icon={Sparkles}
          />
          <KPICard
            label="PUBLISHING READY"
            value={stats.publishing_ready || 0}
            trend="Validated"
            trendUp={true}
            subtext="Pre-flight checks passed"
            icon={CheckCircle}
          />
        </div>

        {/* Layer 3: Next Recommended Action Banner */}
        <div className="bg-[#111827] border border-[#263449] rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#60A5FA]/30 to-transparent"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">AI NEXT RECOMMENDED ACTION</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${nextAction.badgeColor}`}>
                  {nextAction.badge}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F3F6FA]">
                {nextAction.title}
              </h3>
              <p className="text-xs text-[#A8B3C2] leading-relaxed">
                {nextAction.description}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={nextAction.href}
                className="px-4 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>{nextAction.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Layer 4: Attention Required vs Recent Activity Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Attention Required */}
          <div className="lg:col-span-2 bg-[#111827] border border-[#263449] rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[#263449] flex items-center justify-between bg-[#0C1220]">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#F3F6FA]">ATTENTION REQUIRED</h3>
                <span className="text-[10px] bg-[#EF4444]/10 text-[#EF4444] px-2 py-0.5 rounded font-mono font-bold border border-[#EF4444]/20">
                  {reviews.length} ISSUES
                </span>
              </div>
              <Link href="/review" className="text-xs text-[#60A5FA] hover:underline font-semibold">
                View Review Queue →
              </Link>
            </div>

            <div className="divide-y divide-[#263449]">
              {reviews.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#A8B3C2] space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#22C55E] mx-auto" />
                  <p className="font-bold text-[#F3F6FA]">No Active Review Issues</p>
                  <p className="text-[11px] text-[#667085]">
                    {totalProducts === 0 
                      ? "Import technical datasheets or CSV files to begin catalog validation." 
                      : "All product specifications are verified and consistent with source evidence."}
                  </p>
                </div>
              ) : (
                reviews.slice(0, 3).map((issue: any) => (
                  <div key={issue.id} className="p-4 hover:bg-[#172033] transition-colors flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F3F6FA]">{issue.product?.name || "Product"}</span>
                        <span className="font-mono text-[#667085] text-[11px]">SKU: {issue.product?.sku}</span>
                      </div>
                      <p className="text-[#A8B3C2] text-[11px]">
                        {issue.description || `Specification conflict on '${issue.attribute_key}' across multiple datasheets.`}
                      </p>
                    </div>
                    <Link
                      href={`/review/${issue.id}`}
                      className="px-3 py-1 bg-[#070B12] hover:bg-[#172033] border border-[#263449] text-[#60A5FA] rounded text-xs font-semibold shrink-0"
                    >
                      Resolve
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right 1 Col: Audit Activity Stream */}
          <div className="bg-[#111827] border border-[#263449] rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="px-5 py-4 border-b border-[#263449] flex items-center justify-between bg-[#0C1220]">
                <h3 className="text-xs font-bold text-[#F3F6FA]">SYSTEM ACTIVITY STREAM</h3>
                <span className="text-[10px] text-[#667085] font-mono">LIVE AUDIT</span>
              </div>

              <div className="p-4 space-y-3">
                {auditEvents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#667085]">
                    No recent audit events logged.
                  </div>
                ) : (
                  auditEvents.slice(0, 4).map((evt: any) => (
                    <div key={evt.id} className="p-2.5 bg-[#070B12] border border-[#263449] rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#F3F6FA]">{evt.action.replace("_", " ").title ? evt.action.replace("_", " ") : evt.action}</span>
                        <span className="text-[10px] text-[#667085] font-mono">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : "Just now"}
                        </span>
                      </div>
                      <p className="text-[#A8B3C2] text-[11px] leading-snug">
                        {evt.reason || `Action performed on ${evt.entity_type} #${evt.entity_id}`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 bg-[#0C1220] border-t border-[#263449] text-center">
              <Link href="/audit" className="text-xs text-[#60A5FA] hover:underline font-medium">
                View Full Audit Log →
              </Link>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
