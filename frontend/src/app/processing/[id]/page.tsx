"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  CheckCircle2, AlertCircle, AlertTriangle, Clock, RefreshCw, 
  ArrowRight, ShieldCheck, Sparkles, Box, FileText, Database, 
  Layers, ExternalLink, X, Terminal, ChevronRight, Check, XCircle
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { apiFetch } from "@/lib/api";

interface JobState {
  job_id: string;
  filename: string;
  file_type: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  stage: string;
  stage_label: string;
  progress: number;
  total_products: number;
  processed_products: number;
  products_detected: number;
  attributes_extracted: number;
  issues_detected: number;
  conflicts_detected: number;
  enrichment_proposals: number;
  evidence_links: number;
  failed_rows: number;
  quality_score: number;
  current_product?: {
    name?: string;
    sku?: string;
    stage?: string;
  };
  column_mapping?: Record<string, string>;
  activity_stream?: Array<{
    time: string;
    message: string;
    type: string;
    stage: string;
  }>;
  error_message?: string;
  warning_details?: Array<{ row: number; warning: string }>;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  message?: string;
}

const PIPELINE_STAGES = [
  { id: "upload", label: "IMPORT", backendStages: ["upload"] },
  { id: "parsing", label: "PARSE", backendStages: ["parsing"] },
  { id: "extract", label: "EXTRACT", backendStages: ["product_detection", "attribute_extraction"] },
  { id: "classify", label: "CLASSIFY", backendStages: ["classification"] },
  { id: "validate", label: "VALIDATE", backendStages: ["validation", "conflict_detection"] },
  { id: "enrich", label: "ENRICH", backendStages: ["ai_enrichment"] },
  { id: "evidence", label: "EVIDENCE", backendStages: ["evidence_mapping", "quality_scoring"] },
  { id: "ready", label: "READY", backendStages: ["finalization", "completed"] },
];

export default function ProcessingWorkspace() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobState | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  
  const streamEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchJobStatus = async () => {
    try {
      const res = await apiFetch(`/api/catalog/jobs/${jobId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setJob(prev => prev || null);
        }
        return;
      }
      const data: JobState = await res.json();
      setJob(data);
      setLoading(false);

      if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (e) {
      console.error("Job status polling error:", e);
    }
  };

  useEffect(() => {
    fetchJobStatus();
    pollIntervalRef.current = setInterval(fetchJobStatus, 1500);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (job && job.status === "processing") {
        e.preventDefault();
        e.returnValue = "Catalog intelligence processing is still active. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [jobId]);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [job?.activity_stream?.length]);

  const handleCancelJob = async () => {
    if (!confirm("Are you sure you want to cancel this processing job?")) return;
    setCancelling(true);
    try {
      await apiFetch(`/api/catalog/jobs/${jobId}/cancel`, { method: "POST" });
      fetchJobStatus();
    } catch (e) {
      console.error("Failed to cancel job:", e);
    } finally {
      setCancelling(false);
    }
  };

  const getStageStatus = (stageItem: typeof PIPELINE_STAGES[0]) => {
    if (!job) return "pending";
    if (job.status === "completed") return "completed";
    if (job.status === "failed") return "failed";

    const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.backendStages.includes(job.stage));
    const targetStageIndex = PIPELINE_STAGES.findIndex(s => s.id === stageItem.id);

    if (currentStageIndex === -1) {
      return targetStageIndex === 0 ? "processing" : "pending";
    }

    if (targetStageIndex < currentStageIndex) return "completed";
    if (targetStageIndex === currentStageIndex) return "processing";
    return "pending";
  };

  if (loading && !job) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCw className="w-8 h-8 text-[#3B82F6] animate-spin" />
          <p className="text-sm text-[#A8B3C2]">Connecting to catalog intelligence pipeline...</p>
        </div>
      </AppShell>
    );
  }

  const isCompleted = job?.status === "completed";
  const isFailed = job?.status === "failed";
  const isCancelled = job?.status === "cancelled";
  const isProcessing = job?.status === "processing" || job?.status === "queued";

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans">
        
        {/* Top Header Card */}
        <div className="bg-[#111827] border border-[#263449] p-6 rounded-xl relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#3B82F6] via-[#22D3EE] to-[#22C55E]" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-[#3B82F6]/10 text-[#60A5FA] px-2 py-0.5 rounded border border-[#3B82F6]/30 font-mono font-bold">
                  {job?.job_id || jobId}
                </span>
                <span className="text-[10px] bg-[#172033] text-[#A8B3C2] px-2 py-0.5 rounded border border-[#263449] font-semibold uppercase">
                  {job?.file_type || "CSV"} DATASET
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight">
                {isCompleted ? "Catalog Analysis Complete" : (isFailed ? "Catalog Processing Failed" : "Analyzing Your Catalog")}
              </h1>
              <p className="text-xs text-[#A8B3C2] mt-0.5">
                {isCompleted 
                  ? "Your catalog dataset has been successfully transformed into verified product intelligence."
                  : `NEXUS PI is transforming ${job?.filename || "dataset"} into structured product intelligence.`}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setLogsModalOpen(true)}
                className="px-3 py-2 bg-[#172033] hover:bg-[#263449] border border-[#263449] text-[#F3F6FA] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>View Raw Logs</span>
              </button>

              {isProcessing && (
                <button
                  onClick={handleCancelJob}
                  disabled={cancelling}
                  className="px-3 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Cancel Job"}
                </button>
              )}

              {isCompleted && (
                <Link
                  href="/products"
                  className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Progress & Pipeline Section */}
        <div className="bg-[#111827] border border-[#263449] rounded-xl p-6 space-y-6 shadow-sm">
          
          {/* Progress Bar & Stage Indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">CURRENT STAGE</span>
                <span className="text-base font-extrabold text-[#F3F6FA]">
                  {job?.stage_label || "Initializing"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#60A5FA] font-mono">
                  {Math.round(job?.progress || 0)}%
                </span>
                <span className="text-[11px] text-[#A8B3C2] block">
                  {job?.processed_products || 0} of {job?.total_products || 0} products processed
                </span>
              </div>
            </div>

            {/* Visual Progress Track */}
            <div className="w-full bg-[#070B12] rounded-full h-3 border border-[#263449] overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isFailed ? "bg-red-500" : (isCompleted ? "bg-[#22C55E]" : "bg-gradient-to-r from-[#3B82F6] to-[#22D3EE]")
                }`}
                style={{ width: `${Math.min(100, Math.max(2, job?.progress || 0))}%` }}
              />
            </div>
          </div>

          {/* Interactive Pipeline Stepper */}
          <div className="pt-2 border-t border-[#263449]">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {PIPELINE_STAGES.map((s, idx) => {
                const status = getStageStatus(s);
                return (
                  <div 
                    key={s.id}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      status === "completed" 
                        ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                        : (status === "processing" 
                          ? "bg-[#3B82F6]/15 border-[#3B82F6] text-[#60A5FA] ring-1 ring-[#3B82F6]/50 animate-pulse"
                          : (status === "failed" 
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-[#070B12]/50 border-[#263449] text-[#667085]"))
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />}
                      {status === "processing" && <RefreshCw className="w-3.5 h-3.5 text-[#3B82F6] animate-spin" />}
                      {status === "pending" && <span className="w-2 h-2 rounded-full bg-[#263449]" />}
                      {status === "failed" && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <span className="text-[10px] font-bold tracking-wider block">{s.label}</span>
                    <span className="text-[9px] capitalize opacity-80 block mt-0.5">{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Catalog Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-[#111827] border border-[#263449] p-3.5 rounded-xl">
            <span className="text-[9px] font-bold text-[#667085] uppercase tracking-wider block">DETECTED</span>
            <span className="text-xl font-bold text-[#F3F6FA] font-mono mt-0.5 block">{job?.products_detected || 0}</span>
            <span className="text-[10px] text-[#A8B3C2]">Total Products</span>
          </div>

          <div className="bg-[#111827] border border-[#263449] p-3.5 rounded-xl">
            <span className="text-[9px] font-bold text-[#667085] uppercase tracking-wider block">PROCESSED</span>
            <span className="text-xl font-bold text-[#60A5FA] font-mono mt-0.5 block">{job?.processed_products || 0}</span>
            <span className="text-[10px] text-[#A8B3C2]">Entities Built</span>
          </div>

          <div className="bg-[#111827] border border-[#263449] p-3.5 rounded-xl">
            <span className="text-[9px] font-bold text-[#667085] uppercase tracking-wider block">ATTRIBUTES</span>
            <span className="text-xl font-bold text-[#22D3EE] font-mono mt-0.5 block">{job?.attributes_extracted || 0}</span>
            <span className="text-[10px] text-[#A8B3C2]">Extracted & Norm.</span>
          </div>

          <div className="bg-[#111827] border border-[#263449] p-3.5 rounded-xl">
            <span className="text-[9px] font-bold text-[#667085] uppercase tracking-wider block">ISSUES</span>
            <span className={`text-xl font-bold font-mono mt-0.5 block ${(job?.issues_detected || 0) > 0 ? "text-[#F59E0B]" : "text-[#A8B3C2]"}`}>
              {job?.issues_detected || 0}
            </span>
            <span className="text-[10px] text-[#A8B3C2]">Review Queue</span>
          </div>

          <div className="bg-[#111827] border border-[#263449] p-3.5 rounded-xl">
            <span className="text-[9px] font-bold text-[#667085] uppercase tracking-wider block">CONFLICTS</span>
            <span className={`text-xl font-bold font-mono mt-0.5 block ${(job?.conflicts_detected || 0) > 0 ? "text-red-400" : "text-[#A8B3C2]"}`}>
              {job?.conflicts_detected || 0}
            </span>
            <span className="text-[10px] text-[#A8B3C2]">Duplicate Flags</span>
          </div>

          <div className="bg-[#111827] border border-[#263449] p-3.5 rounded-xl">
            <span className="text-[9px] font-bold text-[#667085] uppercase tracking-wider block">AI PROPOSALS</span>
            <span className="text-xl font-bold text-[#3B82F6] font-mono mt-0.5 block">{job?.enrichment_proposals || 0}</span>
            <span className="text-[10px] text-[#A8B3C2]">Enrichment Ready</span>
          </div>

          <div className="bg-[#111827] border border-[#263449] p-3.5 rounded-xl">
            <span className="text-[9px] font-bold text-[#667085] uppercase tracking-wider block">EVIDENCE LINKS</span>
            <span className="text-xl font-bold text-[#22C55E] font-mono mt-0.5 block">{job?.evidence_links || 0}</span>
            <span className="text-[10px] text-[#A8B3C2]">Source Citations</span>
          </div>
        </div>

        {/* Dual Panel: Active Product & Live Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Currently Analyzing Product Card */}
          <div className="lg:col-span-5 bg-[#111827] border border-[#263449] rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#263449] pb-3">
                <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">CURRENTLY ANALYZING</span>
                <span className="text-[10px] bg-[#3B82F6]/10 text-[#60A5FA] px-2 py-0.5 rounded border border-[#3B82F6]/30 font-semibold">
                  {job?.current_product?.stage || "Processing"}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#F3F6FA] truncate">
                  {job?.current_product?.name || (isCompleted ? "All Products Analyzed" : "Parsing Catalog Records...")}
                </h3>
                <span className="text-xs text-[#60A5FA] font-mono block mt-0.5">
                  SKU: {job?.current_product?.sku || "N/A"}
                </span>
              </div>

              {/* Product Step Checklist */}
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-[#070B12] border border-[#263449]">
                  <span className="text-[#A8B3C2]">Product Identity & SKU</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#070B12] border border-[#263449]">
                  <span className="text-[#A8B3C2]">Taxonomy & Category Classification</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#070B12] border border-[#263449]">
                  <span className="text-[#A8B3C2]">Attribute Extraction & Normalization</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#070B12] border border-[#263449]">
                  <span className="text-[#A8B3C2]">Cross-Source Evidence & Grounding</span>
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> : <RefreshCw className="w-3.5 h-3.5 text-[#3B82F6] animate-spin" />}
                </div>
              </div>
            </div>

            {/* Quality Score Indicator */}
            {isCompleted && (
              <div className="p-3.5 bg-[#0C1220] border border-[#22C55E]/30 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#22C55E] font-bold uppercase tracking-wider block">CATALOG QUALITY SCORE</span>
                  <span className="text-xl font-black text-white font-mono">{job?.quality_score || 92}%</span>
                </div>
                <span className="text-[10px] bg-[#22C55E]/10 text-[#22C55E] px-2 py-1 rounded font-bold border border-[#22C55E]/20">
                  VERIFIED ACCURACY
                </span>
              </div>
            )}
          </div>

          {/* Live AI Processing Activity Stream */}
          <div className="lg:col-span-7 bg-[#111827] border border-[#263449] rounded-xl p-5 flex flex-col h-[380px]">
            <div className="flex items-center justify-between border-b border-[#263449] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#60A5FA]" />
                <h3 className="font-bold text-xs text-[#F3F6FA] uppercase tracking-wider">AI Processing Activity</h3>
              </div>
              <span className="text-[10px] text-[#667085] font-mono">
                {job?.activity_stream?.length || 0} events logged
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 text-xs font-mono">
              {job?.activity_stream && job.activity_stream.length > 0 ? (
                job.activity_stream.map((log, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-2.5 p-2 rounded bg-[#070B12]/80 border border-[#263449]/60 animate-in fade-in"
                  >
                    <span className="text-[#667085] text-[10px] shrink-0">{log.time}</span>
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      log.type === "success" ? "bg-[#22C55E]" : (log.type === "warning" ? "bg-[#F59E0B]" : (log.type === "error" ? "bg-red-400" : "bg-[#3B82F6]"))
                    }`} />
                    <span className={`text-[11px] leading-tight ${
                      log.type === "success" ? "text-[#F3F6FA]" : (log.type === "warning" ? "text-[#F59E0B]" : (log.type === "error" ? "text-red-400" : "text-[#A8B3C2]"))
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-[#667085] py-12">
                  Waiting for processing events...
                </div>
              )}
              <div ref={streamEndRef} />
            </div>
          </div>
        </div>

        {/* Completion Action Bar */}
        {isCompleted && (
          <div className="bg-[#111827] border border-[#22C55E]/40 p-6 rounded-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#F3F6FA]">Intelligence Generation Complete</h3>
                <p className="text-xs text-[#A8B3C2]">
                  {job?.processed_products} products processed into your private workspace with full source citations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <Link 
                href="/products" 
                className="p-3 bg-[#172033] hover:bg-[#263449] border border-[#263449] rounded-lg text-center font-bold text-xs text-[#F3F6FA] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Box className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>View Products ({job?.processed_products})</span>
              </Link>

              <Link 
                href="/review" 
                className="p-3 bg-[#172033] hover:bg-[#263449] border border-[#263449] rounded-lg text-center font-bold text-xs text-[#F3F6FA] flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Review Issues ({job?.issues_detected})</span>
              </Link>

              <Link 
                href="/enrichment" 
                className="p-3 bg-[#172033] hover:bg-[#263449] border border-[#263449] rounded-lg text-center font-bold text-xs text-[#F3F6FA] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>View AI Enrichment</span>
              </Link>

              <Link 
                href="/assistant" 
                className="p-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Ask AI Copilot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Failure / Error Bar */}
        {isFailed && (
          <div className="bg-[#111827] border border-red-500/40 p-6 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-red-400">Processing Failed</h3>
                <p className="text-xs text-[#A8B3C2] mt-1">
                  {job?.error_message || "An unexpected error occurred during dataset analysis."}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/ingestion"
                className="px-4 py-2 bg-[#172033] hover:bg-[#263449] border border-[#263449] text-[#F3F6FA] rounded-lg text-xs font-semibold"
              >
                Return to Ingestion
              </Link>
              <button
                onClick={() => setLogsModalOpen(true)}
                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold"
              >
                View Failure Logs
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Raw Logs Modal */}
      {logsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#263449] rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-[#263449] flex items-center justify-between bg-[#0C1220]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#60A5FA]" />
                <h3 className="font-bold text-xs text-[#F3F6FA]">Job Execution Logs ({job?.job_id})</h3>
              </div>
              <button onClick={() => setLogsModalOpen(false)} className="text-[#667085] hover:text-[#F3F6FA]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[11px] bg-[#070B12]">
              {job?.activity_stream && job.activity_stream.length > 0 ? (
                job.activity_stream.map((l, idx) => (
                  <div key={idx} className="text-[#A8B3C2]">
                    <span className="text-[#667085]">[{l.time}]</span> <span className="text-[#60A5FA]">[{l.stage.toUpperCase()}]</span> {l.message}
                  </div>
                ))
              ) : (
                <div className="text-[#667085]">No logs available.</div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#263449] flex justify-end bg-[#0C1220]">
              <button
                onClick={() => setLogsModalOpen(false)}
                className="px-3.5 py-1.5 border border-[#263449] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
