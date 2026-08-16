import React from "react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  subtext?: string;
}

export function KPICard({ label, value, trend, trendUp = true, icon: Icon, subtext }: KPICardProps) {
  return (
    <div className="bg-[#111827] border border-[#263449] rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#3B82F6]/40 transition-all">
      {/* Top Subtle Edge Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#60A5FA]/30 to-transparent"></div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#A8B3C2] tracking-wider uppercase">{label}</span>
        <div className="w-7 h-7 rounded-md bg-[#172033] text-[#60A5FA] border border-[#263449] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold tracking-tight text-[#F3F6FA] leading-none">{value}</span>
        {trend && (
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
            trendUp ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20" : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20"
          }`}>
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <span className="text-[11px] text-[#667085] mt-2 block">{subtext}</span>
      )}
    </div>
  );
}
