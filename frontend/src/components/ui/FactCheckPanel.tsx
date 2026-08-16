import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Shield } from "lucide-react";

export interface FactClaim {
  claim: string;
  supported: boolean;
  source?: string;
  notes?: string;
}

interface FactCheckPanelProps {
  claims: FactClaim[];
}

export function FactCheckPanel({ claims }: FactCheckPanelProps) {
  const supportedCount = claims.filter(c => c.supported).length;
  const unsupportedCount = claims.length - supportedCount;

  return (
    <div className="bg-[#111827] border border-[#263449] rounded-xl p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#263449] pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#3B82F6]" />
          <h4 className="font-bold text-xs text-[#F3F6FA] uppercase tracking-wider">Fact & Claim Checker</h4>
        </div>
        <div className="flex gap-2 text-[11px] font-bold">
          <span className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 px-2 py-0.5 rounded">{supportedCount} Verified</span>
          {unsupportedCount > 0 && <span className="bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 px-2 py-0.5 rounded">{unsupportedCount} Flagged</span>}
        </div>
      </div>

      <div className="space-y-2.5">
        {claims.map((claim, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-lg border text-xs ${
              claim.supported 
                ? "bg-[#070B12] border-[#263449]" 
                : "bg-[#EF4444]/10 border-[#EF4444]/30"
            }`}
          >
            <div className="flex items-start gap-2">
              {claim.supported ? (
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold text-[#F3F6FA]">"{claim.claim}"</p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#A8B3C2]">
                  <span>{claim.supported ? `Verified by ${claim.source || 'Database Specs'}` : 'No explicit catalog evidence found'}</span>
                  <span className={claim.supported ? "text-[#22C55E] font-bold" : "text-[#EF4444] font-bold"}>
                    {claim.supported ? "PASSED" : "FLAGGED"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
