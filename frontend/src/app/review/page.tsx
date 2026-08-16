"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { API_BASE_URL } from "@/lib/api";

export default function DataQualityPage() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/reviews`)
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch(() => setReviews([]));
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-[#263449] p-6 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#60A5FA]/30 to-transparent"></div>
          <div>
            <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight">
              Data Quality & Human Review Governance
            </h1>
            <p className="text-xs text-[#A8B3C2] mt-1">
              Cross-source specification conflicts, missing attribute flags, and quality control queue.
            </p>
          </div>
        </div>

        {/* Quality Queue Table */}
        <div className="bg-[#111827] border border-[#263449] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#263449] flex justify-between items-center bg-[#0C1220]">
            <h3 className="font-bold text-sm text-[#F3F6FA]">Active Review Queue ({reviews.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0C1220] text-[#A8B3C2] border-b border-[#263449]">
                  <th className="px-5 py-3.5 font-bold">ISSUE ID</th>
                  <th className="px-5 py-3.5 font-bold">PRODUCT ID</th>
                  <th className="px-5 py-3.5 font-bold">ISSUE TYPE</th>
                  <th className="px-5 py-3.5 font-bold">PRIORITY</th>
                  <th className="px-5 py-3.5 font-bold">STATUS</th>
                  <th className="px-5 py-3.5 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263449]">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-xs text-[#667085]">
                      No active governance conflicts flagged. Catalog data quality is healthy.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-[#172033] transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#60A5FA]">#ISSUE-{r.id}</td>
                      <td className="px-5 py-4 font-bold text-[#F3F6FA]">Product #{r.product_id}</td>
                      <td className="px-5 py-4 text-[#A8B3C2]">{r.issue_type}</td>
                      <td className="px-5 py-4">
                        <span className="bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 px-2 py-0.5 rounded font-bold text-[10px]">
                          {r.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/products/${r.product_id}`} className="px-3 py-1.5 bg-[#3B82F6] text-white rounded text-xs font-semibold hover:bg-[#1D4ED8]">
                          Resolve
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
