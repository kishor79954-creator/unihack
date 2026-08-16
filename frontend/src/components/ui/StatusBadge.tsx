import React from "react";

export type StatusType = 
  | "VERIFIED" | "Verified" 
  | "REVIEW_REQUIRED" | "Needs Review" | "NEED_REVIEW" 
  | "DRAFT" | "Draft" 
  | "ENRICHED" | "Enriched" 
  | "PUBLISHED" | "Published" 
  | "CONFLICT" | "Conflict"
  | "PROCESSING" | "AI Processing";

interface StatusBadgeProps {
  status: StatusType | string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const norm = String(status).toUpperCase();

  let styles = "bg-[#172033] text-[#94A3B8] border-[#263449]";
  let label = status;

  if (norm.includes("VERIFIED")) {
    styles = "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30";
    label = "Verified";
  } else if (norm.includes("REVIEW") || norm.includes("NEED")) {
    styles = "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30";
    label = "Needs Review";
  } else if (norm.includes("PUBLISHED")) {
    styles = "bg-[#34D399]/10 text-[#34D399] border-[#34D399]/30";
    label = "Published";
  } else if (norm.includes("CONFLICT")) {
    styles = "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30";
    label = "Conflict";
  } else if (norm.includes("PROCESSING")) {
    styles = "bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/30";
    label = "AI Processing";
  } else if (norm.includes("ENRICHED")) {
    styles = "bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/30";
    label = "Enriched";
  } else if (norm.includes("DRAFT")) {
    styles = "bg-[#172033] text-[#94A3B8] border-[#263449]";
    label = "Draft";
  }

  const px = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-md border ${px} ${styles} tracking-tight select-none`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {label}
    </span>
  );
}
