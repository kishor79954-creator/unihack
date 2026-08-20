"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, FileSpreadsheet, CheckCircle2, 
  Database, RefreshCw, ArrowRight, FileText, AlertCircle
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { apiFetch } from "@/lib/api";

export default function CatalogImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch("/api/catalog/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.status === "failed") {
        throw new Error(data.error || data.detail || "Failed to initiate catalog processing");
      }

      if (data.job_id) {
        router.push(`/processing/${data.job_id}`);
      } else {
        throw new Error("No job identifier returned by backend");
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      setErrorMessage(e.message || "Failed to upload and initiate processing.");
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        
        {/* Header */}
        <div className="bg-[#111827] border border-[#263449] p-6 rounded-xl relative overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-[#3B82F6]/10 text-[#60A5FA] px-2 py-0.5 rounded border border-[#3B82F6]/30 font-mono font-bold uppercase">
                  BULK INGESTION ENGINE
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight">
                Import Product Catalog
              </h1>
              <p className="text-xs text-[#A8B3C2] mt-0.5">
                Upload your raw product catalog (CSV, XLSX, JSON) to start the 11-stage intelligence pipeline.
              </p>
            </div>

            <Link
              href="/catalog"
              className="px-3.5 py-2 border border-[#263449] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-lg text-xs font-semibold transition-all self-start sm:self-auto"
            >
              Back to Catalog
            </Link>
          </div>
        </div>

        {/* Upload Box */}
        <div 
          className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-[#111827]/40 ${
            isDragging 
              ? "border-[#3B82F6] bg-[#3B82F6]/10" 
              : "border-[#263449] hover:border-[#3B82F6]/60 hover:bg-[#172033]/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload(file);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 bg-[#172033] border border-[#263449] rounded-2xl flex items-center justify-center mb-4 text-[#3B82F6] group-hover:scale-105 transition-transform shadow-md">
            {uploading ? (
              <RefreshCw className="w-8 h-8 animate-spin text-[#60A5FA]" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-base font-bold text-[#F3F6FA] mb-1">
            {uploading ? "Queuing Intelligence Pipeline..." : "Drag & drop your catalog file here"}
          </h3>
          <p className="text-xs text-[#A8B3C2] max-w-sm mb-6">
            Supports CSV, JSON, and XLSX. Automatic column detection, attribute normalization, and AI enrichment.
          </p>

          <button 
            disabled={uploading}
            className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            {uploading ? "Processing..." : "Select File from Device"}
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            accept=".csv,.json,.xlsx" 
            className="hidden" 
          />
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pipeline Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#111827] border border-[#263449] p-4 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F3F6FA]">
              <Database className="w-4 h-4 text-[#3B82F6]" />
              <span>Arbitrary Schema Mapping</span>
            </div>
            <p className="text-[11px] text-[#A8B3C2] leading-relaxed">
              Intelligently maps varying column headers, product names, SKUs, and specifications without hardcoded schemas.
            </p>
          </div>

          <div className="bg-[#111827] border border-[#263449] p-4 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F3F6FA]">
              <FileText className="w-4 h-4 text-[#22D3EE]" />
              <span>Real-Time Progress Tracking</span>
            </div>
            <p className="text-[11px] text-[#A8B3C2] leading-relaxed">
              Live updates for each stage: parsing, attribute extraction, validation, conflict detection, and graph sync.
            </p>
          </div>

          <div className="bg-[#111827] border border-[#263449] p-4 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F3F6FA]">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              <span>100% Device Isolation</span>
            </div>
            <p className="text-[11px] text-[#A8B3C2] leading-relaxed">
              Your uploaded catalog is tagged to your private workspace and remains strictly isolated from other users.
            </p>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
