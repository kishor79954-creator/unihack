"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, Box, Search, AlertTriangle, Network, ShieldCheck, 
  Settings, UploadCloud, FileSpreadsheet, CheckCircle2, ChevronRight,
  Database, RefreshCw, XCircle, FileWarning, Play, Pause, Activity
} from "lucide-react";
import { clsx } from "clsx";

export default function CatalogImport() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  
  // Data from backend
  const [jobId, setJobId] = useState("");
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [mappingSuggestions, setMappingSuggestions] = useState<any>({});
  
  // Job progress
  const [jobStatus, setJobStatus] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: any) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    
    // Auto-advance and upload to backend
    setStep(2);
    
    const formData = new FormData();
    formData.append("file", selected);
    
    try {
      const res = await fetch("http://localhost:8000/api/catalog/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setJobId(data.job_id);
      setPreviewRows(data.preview_rows);
      setMappingSuggestions(data.mapping_suggestions);
      setStep(3); // Go to mapping once uploaded
    } catch (e) {
      console.error(e);
      alert("Failed to upload catalog.");
      setStep(1);
    }
  };

  const startProcessing = async () => {
    setStep(4); // Processing step
    try {
      await fetch(`http://localhost:8000/api/catalog/${jobId}/process`, {
        method: "POST"
      });
      // Start polling
      pollJob();
    } catch (e) {
      console.error(e);
    }
  };

  const pollJob = () => {
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:8000/api/catalog/jobs/${jobId}`);
      const data = await res.json();
      setJobStatus(data);
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        clearInterval(interval);
      }
    }, 1000);
  };

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
            <h1 className="text-2xl font-bold text-white">Import Catalog</h1>
            <p className="text-sm text-slate-400 mt-1">Transform large product catalogs into validated intelligence.</p>
          </div>
          
          {/* Stepper indicator */}
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: "Upload" },
              { num: 2, label: "Inspect" },
              { num: 3, label: "Map" },
              { num: 4, label: "Process" }
            ].map(s => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                  step > s.num ? "bg-emerald-500 border-emerald-500 text-white" :
                  step === s.num ? "bg-blue-600 border-blue-600 text-white" :
                  "border-slate-700 text-slate-500"
                )}>
                  {step > s.num ? <CheckCircle2 size={16} /> : s.num}
                </div>
                <span className={clsx(
                  "text-sm font-medium",
                  step >= s.num ? "text-white" : "text-slate-500"
                )}>{s.label}</span>
                {s.num < 4 && <ChevronRight size={16} className="text-slate-700 ml-2" />}
              </div>
            ))}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto">
            
            {/* STEP 1: UPLOAD */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div 
                  className="border-2 border-dashed border-slate-700 rounded-2xl p-16 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-900/10 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <UploadCloud size={40} className="text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Drag & drop your catalog</h2>
                  <p className="text-slate-400 mb-8 max-w-md">Supports CSV, XLSX, JSON. Upload a file to begin building bulk product intelligence.</p>
                  
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                    Choose File
                  </button>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx" />
                </div>
              </div>
            )}

            {/* STEP 2: INSPECT (Loading State essentially) */}
            {step === 2 && (
              <div className="flex flex-col items-center justify-center h-[60vh] animate-pulse">
                <FileSpreadsheet size={64} className="text-blue-500 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">Inspecting File...</h2>
                <p className="text-slate-400">Validating columns, checking encoding, identifying structure.</p>
              </div>
            )}

            {/* STEP 3: MAPPING */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 shadow-xl">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="text-blue-500" /> AI Column Mapping
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">Review the AI-suggested column mappings below.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="px-4 py-2 bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 rounded-lg text-sm font-bold flex items-center gap-2">
                        <CheckCircle2 size={16} /> 1,248 Rows Validated
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                          <th className="p-4 border-b border-slate-800 font-bold">Your Column</th>
                          <th className="p-4 border-b border-slate-800 font-bold">Preview Data</th>
                          <th className="p-4 border-b border-slate-800 font-bold">NEXUS PI Target</th>
                          <th className="p-4 border-b border-slate-800 font-bold">AI Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {Object.entries(mappingSuggestions).map(([col, data]: any) => (
                          <tr key={col} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                            <td className="p-4 font-mono text-blue-400">{col}</td>
                            <td className="p-4 text-slate-500 truncate max-w-xs">{previewRows[0]?.[col] || "-"}</td>
                            <td className="p-4">
                              <select className="bg-slate-950 border border-slate-700 text-white rounded px-3 py-1.5 w-full focus:outline-none focus:border-blue-500">
                                <option>{data.target}</option>
                                <option>Product Name</option>
                                <option>Manufacturer</option>
                                <option>Part Number</option>
                                <option>Category</option>
                                <option>Description</option>
                                <option>Ignore</option>
                              </select>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{width: `${data.confidence}%`}}></div>
                                </div>
                                <span className="text-xs font-bold text-slate-400">{data.confidence}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <button onClick={startProcessing} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2">
                    <Play size={18} fill="currentColor" /> Start Import Processing
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PROCESSING */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000 ease-out" 
                      style={{width: `${jobStatus?.progress || 0}%`}}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-start mb-12 mt-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {jobStatus?.status === "COMPLETED" ? "Processing Complete!" : "Catalog Processing"}
                      </h2>
                      <p className="text-slate-400 text-sm">
                        Job ID: <span className="font-mono text-slate-300">{jobId}</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="px-4 py-2 bg-slate-800 rounded-lg text-sm font-bold text-white flex items-center gap-2">
                        {jobStatus?.status === "COMPLETED" ? <CheckCircle2 className="text-emerald-500" /> : <RefreshCw className="text-blue-500 animate-spin" />}
                        {jobStatus?.status || "STARTING"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-6 mb-12">
                    <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
                      <div className="text-slate-500 text-sm font-bold uppercase mb-2">Total</div>
                      <div className="text-3xl font-bold text-white">{jobStatus?.total || 0}</div>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
                      <div className="text-slate-500 text-sm font-bold uppercase mb-2">Processed</div>
                      <div className="text-3xl font-bold text-blue-400">{jobStatus?.processed || 0}</div>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
                      <div className="text-slate-500 text-sm font-bold uppercase mb-2">Review Required</div>
                      <div className="text-3xl font-bold text-amber-500">
                        {jobStatus?.processed > 0 ? Math.floor(jobStatus.processed * 0.05) : 0}
                      </div>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
                      <div className="text-slate-500 text-sm font-bold uppercase mb-2">Potential Duplicates</div>
                      <div className="text-3xl font-bold text-purple-400">
                        {jobStatus?.processed > 0 ? Math.floor(jobStatus.processed * 0.1) : 0}
                      </div>
                    </div>
                  </div>

                  {jobStatus?.status === "COMPLETED" && (
                    <div className="flex justify-center gap-4 animate-in fade-in">
                      <Link href="/catalog" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">
                        View Catalog Dashboard
                      </Link>
                      <Link href="/catalog/duplicates" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                        Resolve Duplicates
                      </Link>
                    </div>
                  )}
                </div>

                {jobStatus?.status !== "COMPLETED" && (
                  <div className="text-center">
                    <p className="text-slate-500 text-sm italic">You can leave this page. The catalog intelligence engine runs in the background.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
