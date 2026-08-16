"use client";

import React, { useState } from "react";
import { Settings, Cpu, ShieldCheck, Database, Key, HelpCircle, Layers } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function SettingsPage() {
  const [experienceMode, setExperienceMode] = useState<"guided" | "professional">("guided");

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-[#263449] p-6 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#60A5FA]/30 to-transparent"></div>
          <div>
            <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight">
              System Settings & User Experience
            </h1>
            <p className="text-xs text-[#A8B3C2] mt-1">
              Configure user experience mode, Google Gemini API models, and SQLite relational database layer.
            </p>
          </div>
        </div>

        {/* User Experience Mode Setting */}
        <div className="bg-[#111827] border border-[#263449] rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#F3F6FA] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#3B82F6]" /> Application Experience Mode
            </h3>
            <p className="text-xs text-[#A8B3C2] mt-0.5">
              Switch between guided workflows for business beginners or dense professional tools for catalog specialists.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Guided Mode Option */}
            <div 
              onClick={() => setExperienceMode("guided")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                experienceMode === "guided" 
                  ? "bg-[#3B82F6]/10 border-[#3B82F6]" 
                  : "bg-[#070B12] border-[#263449] hover:border-[#3B82F6]/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#F3F6FA]">● Guided Mode (Beginner-Friendly)</span>
                {experienceMode === "guided" && <span className="text-[10px] bg-[#3B82F6] text-white px-2 py-0.5 rounded font-bold">ACTIVE</span>}
              </div>
              <p className="text-xs text-[#A8B3C2] mt-2 leading-relaxed">
                Includes step-by-step next action banners, interactive workflow progress bars, tooltips, and simplified navigation labels.
              </p>
            </div>

            {/* Professional Mode Option */}
            <div 
              onClick={() => setExperienceMode("professional")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                experienceMode === "professional" 
                  ? "bg-[#3B82F6]/10 border-[#3B82F6]" 
                  : "bg-[#070B12] border-[#263449] hover:border-[#3B82F6]/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#F3F6FA]">● Professional Mode (Specialist)</span>
                {experienceMode === "professional" && <span className="text-[10px] bg-[#3B82F6] text-white px-2 py-0.5 rounded font-bold">ACTIVE</span>}
              </div>
              <p className="text-xs text-[#A8B3C2] mt-2 leading-relaxed">
                Optimized for data engineers with dense data tables, technical terminology, advanced graph filters, and deep audit logs.
              </p>
            </div>

          </div>
        </div>

        {/* Technical Provider Settings */}
        <div className="bg-[#111827] border border-[#263449] rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-sm text-[#F3F6FA] mb-3">AI Intelligence Provider</h3>
            <div className="space-y-3 text-xs bg-[#070B12] p-4 rounded-xl border border-[#263449]">
              <div className="flex items-center justify-between">
                <span className="text-[#A8B3C2]">Active Model:</span>
                <span className="font-mono text-[#60A5FA] font-bold">gemini-flash-latest</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A8B3C2]">SDK Framework:</span>
                <span className="font-mono text-[#F3F6FA]">langchain-google-genai</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A8B3C2]">Status:</span>
                <span className="text-[#22C55E] font-bold">● HEALTHY</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm text-[#F3F6FA] mb-3">Database & Storage Engine</h3>
            <div className="space-y-3 text-xs bg-[#070B12] p-4 rounded-xl border border-[#263449]">
              <div className="flex items-center justify-between">
                <span className="text-[#A8B3C2]">Database Engine:</span>
                <span className="font-mono text-[#F3F6FA]">SQLite 3 (Local Relational Layer)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A8B3C2]">Database Location:</span>
                <span className="font-mono text-[#667085]">backend/nexus_pi.db</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
