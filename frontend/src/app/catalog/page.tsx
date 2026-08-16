"use client";

import Link from "next/link";
import { 
  LayoutDashboard, Box, AlertTriangle, Network, ShieldCheck, 
  Settings, Database, UploadCloud, Download, TrendingUp, CheckCircle2
} from "lucide-react";
import { clsx } from "clsx";

export default function CatalogDashboard() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans">
      {/* Mini Sidebar */}
      <div className="w-16 border-r border-slate-800 bg-slate-900/50 flex flex-col items-center py-6 gap-6 z-10 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mb-4">N</div>
        <Link href="/" className="p-3 text-slate-500 hover:text-slate-300 transition-colors"><LayoutDashboard size={20} /></Link>
        <Link href="/catalog" className="p-3 text-blue-400 bg-blue-900/20 rounded-xl"><Database size={20} /></Link>
        <Link href="/products" className="p-3 text-slate-500 hover:text-slate-300 transition-colors"><Box size={20} /></Link>
        <Link href="/review" className="p-3 text-slate-500 hover:text-slate-300 transition-colors"><AlertTriangle size={20} /></Link>
        <Link href="/audit" className="p-3 text-slate-500 hover:text-slate-300 transition-colors"><ShieldCheck size={20} /></Link>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/30">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Database className="text-blue-500" /> Catalog Intelligence
            </h1>
            <p className="text-sm text-slate-400 mt-1">Manage bulk imports, duplicates, and catalog-level quality.</p>
          </div>
          
          <div className="flex gap-4">
            <Link href="/catalog/export" className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <Download size={16} /> Export Catalog
            </Link>
            <Link href="/catalog/import" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <UploadCloud size={16} /> Import Catalog
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="text-slate-400 text-sm font-bold uppercase mb-2">Total Products</div>
              <div className="text-4xl font-bold text-white">12,482</div>
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1"><TrendingUp size={12} /> +1,248 this week</div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="text-slate-400 text-sm font-bold uppercase mb-2">Avg. Quality Score</div>
              <div className="text-4xl font-bold text-emerald-400">92%</div>
              <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full w-[92%]"></div></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="text-slate-400 text-sm font-bold uppercase mb-2">Review Required</div>
              <div className="text-4xl font-bold text-amber-500">106</div>
              <Link href="/review" className="mt-2 text-xs text-blue-400 hover:underline">Go to Review Queue &rarr;</Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="text-slate-400 text-sm font-bold uppercase mb-2">Duplicate Candidates</div>
              <div className="text-4xl font-bold text-purple-400">32</div>
              <Link href="/catalog/duplicates" className="mt-2 text-xs text-blue-400 hover:underline">Resolve duplicates &rarr;</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Category Health Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">Catalog Heatmap</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-center">Completeness</th>
                    <th className="pb-3 text-center">Evidence</th>
                    <th className="pb-3 text-center">Validation</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-300">
                  <tr className="border-b border-slate-800/50">
                    <td className="py-3 font-medium text-white">Bearings</td>
                    <td className="py-3 text-center"><span className="text-emerald-400">97%</span></td>
                    <td className="py-3 text-center"><span className="text-emerald-400">94%</span></td>
                    <td className="py-3 text-center"><span className="text-emerald-400">98%</span></td>
                  </tr>
                  <tr className="border-b border-slate-800/50">
                    <td className="py-3 font-medium text-white">Motors</td>
                    <td className="py-3 text-center"><span className="text-amber-400">89%</span></td>
                    <td className="py-3 text-center"><span className="text-amber-400">87%</span></td>
                    <td className="py-3 text-center"><span className="text-emerald-400">91%</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-white">Pumps</td>
                    <td className="py-3 text-center"><span className="text-red-400">84%</span></td>
                    <td className="py-3 text-center"><span className="text-red-400">81%</span></td>
                    <td className="py-3 text-center"><span className="text-amber-400">86%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Recent Jobs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Recent Imports</h3>
                <Link href="/catalog/jobs" className="text-xs text-blue-400 hover:underline">View All Jobs</Link>
              </div>
              <div className="space-y-4">
                {[
                  { id: "CAT-9041", status: "COMPLETED", rows: "1,248", date: "Today, 10:42 AM" },
                  { id: "CAT-8810", status: "COMPLETED", rows: "5,102", date: "Yesterday, 3:15 PM" },
                  { id: "CAT-8502", status: "FAILED", rows: "34", date: "Aug 9, 2026" }
                ].map(job => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-white">{job.id}</div>
                      <div className="text-xs text-slate-500">{job.date}</div>
                    </div>
                    <div className="text-right">
                      <div className={clsx(
                        "text-xs font-bold px-2 py-1 rounded inline-block mb-1",
                        job.status === "COMPLETED" ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"
                      )}>{job.status}</div>
                      <div className="text-xs text-slate-400">{job.rows} rows</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
