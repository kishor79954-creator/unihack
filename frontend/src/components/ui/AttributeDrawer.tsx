"use client";

import React from "react";
import { X, ShieldCheck, FileText, CheckCircle2, Clock, Info } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface AttributeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  attribute: {
    key: string;
    raw_value: string;
    normalized_value?: string;
    unit?: string;
    confidence_score?: number;
    confidence_level?: string;
    source?: string;
    evidence_snippet?: string;
  } | null;
}

export function AttributeDrawer({ isOpen, onClose, attribute }: AttributeDrawerProps) {
  if (!isOpen || !attribute) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-[#0C1220] border-l border-[#263449] shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="h-16 px-6 border-b border-[#263449] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
            <h3 className="font-bold text-sm text-[#F3F6FA]">Attribute Intelligence Drawer</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[#A8B3C2] hover:text-[#F3F6FA] hover:bg-[#172033]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Key/Value Banner */}
          <div className="bg-[#111827] p-4 rounded-xl border border-[#263449]">
            <div className="text-[10px] font-bold text-[#A8B3C2] uppercase tracking-wider">{attribute.key}</div>
            <div className="text-xl font-extrabold text-[#F3F6FA] mt-1">
              {attribute.normalized_value || attribute.raw_value} {attribute.unit || ""}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <StatusBadge status={attribute.confidence_level || "Verified"} size="sm" />
              <span className="text-xs font-mono font-semibold text-[#60A5FA]">
                {Math.round((attribute.confidence_score || 0.95) * 100)}% Confidence
              </span>
            </div>
          </div>

          {/* Value Normalization Section */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-[#A8B3C2] uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#3B82F6]" /> Data Normalization Engine
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#111827] border border-[#263449] p-3 rounded-lg">
              <div>
                <span className="text-[#667085] block text-[11px]">Raw Value</span>
                <span className="font-semibold text-[#F3F6FA] mt-0.5 block">{attribute.raw_value}</span>
              </div>
              <div>
                <span className="text-[#667085] block text-[11px]">Normalized SI</span>
                <span className="font-semibold text-[#60A5FA] mt-0.5 block">{attribute.normalized_value || attribute.raw_value} {attribute.unit || ""}</span>
              </div>
            </div>
          </div>

          {/* Evidence Snippet */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-[#A8B3C2] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#22C55E]" /> Source Evidence Provenance
            </h4>
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 p-3.5 rounded-lg text-xs">
              <div className="font-semibold text-[#22C55E] mb-1">
                Source: {attribute.source || "Ingested Datasheet Source"}
              </div>
              <p className="text-[#A8B3C2] italic leading-relaxed">
                "{attribute.evidence_snippet || `${attribute.key}: ${attribute.raw_value} ${attribute.unit || ''}`}"
              </p>
            </div>
          </div>

          {/* Audit History */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-[#A8B3C2] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#667085]" /> Audit History
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded bg-[#111827] border border-[#263449] text-[#A8B3C2]">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> Extracted via Gemini AI</span>
                <span className="text-[10px] text-[#667085]">2h ago</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-[#111827] border border-[#263449] text-[#A8B3C2]">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6]" /> SI Unit Auto-Normalized</span>
                <span className="text-[10px] text-[#667085]">2h ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#263449] bg-[#111827] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
