import React from "react";
import Link from "next/link";
import { 
  Box, ShieldCheck, Sparkles, AlertTriangle, CheckCircle, 
  ArrowRight, FileText, Activity, Layers, Upload, Search, Filter, Plus, ArrowUpRight
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/StatusBadge";

async function getDashboardData() {
  try {
    const [statsRes, productsRes, reviewsRes, auditRes] = await Promise.all([
      fetch("http://localhost:8000/api/stats", { cache: "no-store" }),
      fetch("http://localhost:8000/api/products", { cache: "no-store" }),
      fetch("http://localhost:8000/api/reviews", { cache: "no-store" }),
      fetch("http://localhost:8000/api/audit-events", { cache: "no-store" })
    ]);

    const stats = statsRes.ok ? await statsRes.json() : {
      total_products: 0,
      quality_score: 0.0,
      ai_confidence: 0.0,
      needs_review: 0,
      conflicts: 0,
      enrichment_opportunities: 0,
      publishing_ready: 0
    };
    
    const products = productsRes.ok ? await productsRes.json() : [];
    const reviews = reviewsRes.ok ? await reviewsRes.json() : [];
    const auditEvents = auditRes.ok ? await auditRes.json() : [];

    return { stats, products, reviews, auditEvents };
  } catch (e) {
    return {
      stats: {
        total_products: 0,
        quality_score: 0.0,
        ai_confidence: 0.0,
        needs_review: 0,
        conflicts: 0,
        enrichment_opportunities: 0,
        publishing_ready: 0
      },
      products: [],
      reviews: [],
      auditEvents: []
    };
  }
}

export default async function DashboardPage() {
  const { stats, products, reviews, auditEvents } = await getDashboardData();
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

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Layer 1 — "Where am I?" Header Banner */}
        <div className="bg-[#111827] border border-[#263449] p-6 rounded-xl shadow-sm relative overflow-hidden space-y-2">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#60A5FA]/30 to-transparent"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#60A5FA] tracking-wider uppercase">PRODUCT INTELLIGENCE COMMAND CENTER</span>
              <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight mt-0.5">
                {totalProducts === 0 ? "Welcome to NEXUS PI" : "Good morning. Here is what needs your attention."}
              </h1>
              <p className="text-xs text-[#A8B3C2]">
                {totalProducts === 0 
                  ? "Your catalog database is clean and ready. Import documents or datasets to begin extraction."
                  : `Your catalog contains ${totalProducts} active product(s) with ${stats.quality_score || 0}% average completeness.`}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/ingestion"
                className="px-3.5 py-2 border border-[#263449] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-[#667085]" /> Import Documents
              </Link>
              <Link
                href="/assistant"
                className="px-3.5 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" /> Ask AI Copilot
              </Link>
            </div>
          </div>

          {/* Interactive 6-Step Workflow Progress Bar */}
          <div className="pt-4 border-t border-[#263449] mt-4">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block mb-2.5">PRODUCT INTELLIGENCE WORKFLOW</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              
              <Link href="/ingestion" className="p-2.5 bg-[#070B12] hover:bg-[#172033] border border-[#263449] rounded-lg transition-all space-y-0.5">
                <span className="text-[10px] font-mono text-[#667085] block">① Import</span>
                <span className={`font-bold flex items-center gap-1 ${totalProducts > 0 ? "text-[#22C55E]" : "text-[#667085]"}`}>
                  {totalProducts > 0 ? "✓ Uploaded" : "○ Waiting"}
                </span>
              </Link>

              <Link href="/ingestion" className="p-2.5 bg-[#070B12] hover:bg-[#172033] border border-[#263449] rounded-lg transition-all space-y-0.5">
                <span className="text-[10px] font-mono text-[#667085] block">② Extract</span>
                <span className={`font-bold flex items-center gap-1 ${totalProducts > 0 ? "text-[#22C55E]" : "text-[#667085]"}`}>
                  {totalProducts > 0 ? "✓ Extracted" : "○ Waiting"}
                </span>
              </Link>

              <Link href="/review" className={`p-2.5 rounded-lg border transition-all space-y-0.5 ${
                stats.needs_review > 0 
                  ? "bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border-[#F59E0B]/30" 
                  : "bg-[#070B12] hover:bg-[#172033] border-[#263449]"
              }`}>
                <span className={`text-[10px] font-mono block ${stats.needs_review > 0 ? "text-[#F59E0B]" : "text-[#667085]"}`}>③ Review</span>
                <span className={`font-bold flex items-center gap-1 ${stats.needs_review > 0 ? "text-[#F59E0B]" : totalProducts > 0 ? "text-[#22C55E]" : "text-[#667085]"}`}>
                  {stats.needs_review > 0 ? `⚠ ${stats.needs_review} Issue(s)` : totalProducts > 0 ? "✓ Verified" : "○ Clean"}
                </span>
              </Link>

              <Link href="/enrichment" className="p-2.5 bg-[#070B12] hover:bg-[#172033] border border-[#263449] rounded-lg transition-all space-y-0.5">
                <span className="text-[10px] font-mono text-[#667085] block">④ Enrich</span>
                <span className={`font-bold flex items-center gap-1 ${stats.enrichment_opportunities > 0 ? "text-[#60A5FA]" : "text-[#667085]"}`}>
                  {stats.enrichment_opportunities > 0 ? `● ${stats.enrichment_opportunities} Ready` : "○ Synced"}
                </span>
              </Link>

              <Link href="/content-studio" className="p-2.5 bg-[#070B12] hover:bg-[#172033] border border-[#263449] rounded-lg transition-all space-y-0.5">
                <span className="text-[10px] font-mono text-[#667085] block">⑤ Verify</span>
                <span className={`font-semibold ${totalProducts > 0 ? "text-[#A8B3C2]" : "text-[#667085]"}`}>
                  {totalProducts > 0 ? "✓ Grounded" : "○ Waiting"}
                </span>
              </Link>

              <Link href="/publishing" className="p-2.5 bg-[#070B12] hover:bg-[#172033] border border-[#263449] rounded-lg transition-all space-y-0.5">
                <span className="text-[10px] font-mono text-[#667085] block">⑥ Publish</span>
                <span className={`font-semibold ${stats.publishing_ready > 0 ? "text-[#22C55E]" : "text-[#667085]"}`}>
                  {stats.publishing_ready > 0 ? `${stats.publishing_ready} Ready` : "○ 0 Ready"}
                </span>
              </Link>

            </div>
          </div>
        </div>

        {/* Layer 2 — "How healthy is my catalog?" (DYNAMIC SQLITE METRICS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            label="TOTAL PRODUCTS"
            value={totalProducts}
            trend={totalProducts > 0 ? "Active Catalog" : "Empty"}
            trendUp={totalProducts > 0}
            icon={Box}
            subtext="In SQLite database"
          />
          <KPICard
            label="CATALOG COMPLETENESS"
            value={totalProducts > 0 ? `${stats.quality_score || 0}%` : "0%"}
            trend={totalProducts > 0 ? "Coverage" : "No Data"}
            trendUp={stats.quality_score >= 80}
            icon={ShieldCheck}
            subtext="Required attribute coverage"
          />
          <KPICard
            label="NEEDS REVIEW"
            value={stats.needs_review || 0}
            trend={stats.needs_review > 0 ? "Action Needed" : "Clean"}
            trendUp={stats.needs_review === 0}
            icon={AlertTriangle}
            subtext="Unresolved review issues"
          />
          <KPICard
            label="ENRICHMENT OPPORTUNITIES"
            value={stats.enrichment_opportunities || 0}
            trend={stats.enrichment_opportunities > 0 ? "AI Proposals" : "Up to Date"}
            trendUp={true}
            icon={Sparkles}
            subtext="Available gap suggestions"
          />
          <KPICard
            label="PUBLISHING READY"
            value={stats.publishing_ready || 0}
            trend={stats.publishing_ready > 0 ? "Verified" : "Waiting"}
            trendUp={stats.publishing_ready > 0}
            icon={CheckCircle}
            subtext="Commerce validated"
          />
        </div>

        {/* Layer 3 — "What should I do?" Next Recommended Action Banner */}
        <div className="bg-[#111827] border-2 border-[#263449] hover:border-[#3B82F6]/50 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/30 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider">NEXT RECOMMENDED ACTION</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${nextAction.badgeColor}`}>
                    {nextAction.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#F3F6FA] mt-0.5">{nextAction.title}</h3>
                <p className="text-xs text-[#A8B3C2] mt-0.5">{nextAction.description}</p>
              </div>
            </div>

            <Link
              href={nextAction.href}
              className="px-4 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              {nextAction.buttonText} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Attention Required & Recent Activity Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2 Cols): Attention Required */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#111827] border border-[#263449] rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#263449] flex items-center justify-between bg-[#0C1220]/60">
                <div>
                  <h3 className="font-bold text-sm text-[#F3F6FA]">ATTENTION REQUIRED</h3>
                  <p className="text-xs text-[#A8B3C2]">Active quality issues requiring human verification</p>
                </div>
                <Link href="/review" className="text-xs font-bold text-[#60A5FA] hover:underline flex items-center gap-1">
                  View Data Quality <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                {reviews.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#A8B3C2] space-y-1">
                    <CheckCircle className="w-6 h-6 text-[#22C55E] mx-auto mb-2" />
                    <p className="font-bold text-[#F3F6FA]">No active issues</p>
                    <p>All imported specifications currently satisfy validation rules.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#0C1220] text-[#A8B3C2] border-b border-[#263449]">
                        <th className="px-5 py-3.5 font-bold">PRODUCT</th>
                        <th className="px-5 py-3.5 font-bold">ISSUE TYPE</th>
                        <th className="px-5 py-3.5 font-bold">PRIORITY</th>
                        <th className="px-5 py-3.5 font-bold text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#263449]">
                      {reviews.map((rev: any) => (
                        <tr key={rev.id} className="hover:bg-[#172033] transition-colors">
                          <td className="px-5 py-3.5 font-bold text-[#F3F6FA]">
                            {rev.product?.name || `Product #${rev.product_id}`}
                            <span className="block text-[11px] text-[#A8B3C2] font-mono font-normal">
                              SKU: {rev.product?.sku || "N/A"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-[#A8B3C2]">{rev.description || rev.issue_type}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              rev.priority === "CRITICAL" ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30" : "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30"
                            }`}>
                              {rev.priority || "Medium"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link href={`/review/${rev.id}`} className="px-2.5 py-1 bg-[#F59E0B] text-slate-950 font-bold rounded text-xs">
                              Resolve
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Activity Stream */}
          <div className="space-y-6">
            <div className="bg-[#111827] border border-[#263449] rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#F3F6FA]">Recent Activity Stream</h3>
              
              {auditEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#A8B3C2] space-y-1">
                  <Activity className="w-5 h-5 text-[#667085] mx-auto mb-1" />
                  <p>No recent activity events recorded.</p>
                  <p className="text-[11px] text-[#667085]">Events will log when you import documents or publish products.</p>
                </div>
              ) : (
                <div className="space-y-3.5 text-xs">
                  {auditEvents.slice(0, 5).map((evt: any) => (
                    <div key={evt.id} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#3B82F6]/10 text-[#60A5FA] flex items-center justify-center shrink-0 mt-0.5 border border-[#3B82F6]/30">
                        <FileText className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="font-bold text-[#F3F6FA]">{evt.action.replace(/_/g, " ")}</p>
                        <p className="text-[#A8B3C2] text-[11px]">{evt.reason || evt.actor}</p>
                        <span className="text-[10px] text-[#667085] mt-0.5 block font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
