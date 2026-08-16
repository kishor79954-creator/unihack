"use client";

import React from "react";
import { BarChart3, TrendingUp, ShieldCheck, Activity } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { KPICard } from "@/components/ui/KPICard";

export default function AnalyticsPage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-[#263449] p-6 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#60A5FA]/30 to-transparent"></div>
          <div>
            <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight">
              Catalog Intelligence Analytics
            </h1>
            <p className="text-xs text-[#A8B3C2] mt-1">
              Track completeness velocity, AI extraction accuracy, and commerce readiness metrics over time.
            </p>
          </div>
        </div>

        {/* Analytics KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <KPICard label="CATALOG HEALTH INDEX" value="94.2" trend="+3.1" icon={BarChart3} subtext="Weighted overall score" />
          <KPICard label="ATTRIBUTES EXTRACTED" value="1,482" trend="+140" icon={Activity} subtext="Extracted from PDF sources" />
          <KPICard label="EVIDENCE PROVENANCE" value="98.4%" trend="+0.8%" icon={ShieldCheck} subtext="Grounding verification rate" />
          <KPICard label="TIME SAVED / SKU" value="4.2 hrs" trend="-65%" icon={TrendingUp} subtext="Automation efficiency" />
        </div>

        {/* Charts Mockup */}
        <div className="bg-[#111827] border border-[#263449] rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#F3F6FA]">Catalog Quality Trend</h3>
          <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-[#263449] px-4">
            {[65, 72, 78, 84, 88, 94].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] font-mono text-[#60A5FA] font-bold">{val}%</span>
                <div 
                  className="w-full bg-[#3B82F6] rounded-t-md transition-all hover:bg-[#60A5FA]" 
                  style={{ height: `${val * 2}px` }}
                ></div>
                <span className="text-[10px] text-[#667085] uppercase">Month {i+1}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
