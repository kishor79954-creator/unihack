"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, FileText, Settings, Database, 
  Box, ShieldCheck, Sparkles, AlertCircle, RefreshCw, Send
} from "lucide-react";
import { clsx } from "clsx";
import { API_BASE_URL } from "@/lib/api";

export default function ProductEnrichmentWorkspace() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/enrichment/analyze/${id}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => console.error(e));
  }, [id]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/publish/${id}`, { method: "POST" });
      const responseData = await res.json();
      if (responseData.status === "PUBLISHED") {
        setPublished(true);
        setTimeout(() => router.push(`/products/${id}`), 2000);
      } else {
        alert(responseData.reason || "Publish blocked.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans items-center justify-center">
      <div className="flex flex-col items-center animate-pulse">
        <Sparkles size={48} className="text-emerald-500 mb-4" />
        <h2 className="text-xl font-bold text-white">NEXUS AI is analyzing product...</h2>
        <p className="text-slate-400 mt-2">Checking gaps, finding evidence, and generating proposals.</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center gap-6">
            <Link href={`/products/${id}`} className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors">
              <ArrowLeft size={18} className="text-slate-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Sparkles className="text-emerald-500" /> AI Enrichment Validation
              </h1>
              <p className="text-sm text-slate-400 mt-1">Product ID: {id} • Review AI-generated improvements before publishing.</p>
            </div>
          </div>
          <div className="flex gap-4">
            {published ? (
              <div className="px-6 py-2 bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 rounded-lg text-sm font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> Successfully Published
              </div>
            ) : (
              <button 
                onClick={handlePublish}
                disabled={publishing}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {publishing ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />} 
                {publishing ? "Publishing..." : "Approve & Publish"}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 flex">
          
          <div className="flex-1 max-w-7xl mx-auto flex gap-8">
            
            {/* LEFT COLUMN: The AI Proposals */}
            <div className="flex-1 space-y-6">
              <h2 className="text-lg font-bold text-white">Proposed Enhancements</h2>
              
              {data?.opportunities?.map((opp: any) => (
                <div key={opp.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg relative">
                  
                  {/* Status Ribbon */}
                  {opp.status === "CANNOT_VERIFY" && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-red-900/30 text-red-400 text-[10px] font-bold uppercase rounded-bl-lg border-b border-l border-red-900/50 flex items-center gap-1">
                      <AlertCircle size={12} /> Human Review Req.
                    </div>
                  )}

                  <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={clsx(
                        "px-2 py-1 rounded text-xs font-bold border",
                        opp.type === "MISSING_ATTRIBUTE" ? "bg-amber-900/30 text-amber-400 border-amber-900/50" :
                        opp.type === "WEAK_DESCRIPTION" ? "bg-purple-900/30 text-purple-400 border-purple-900/50" :
                        "bg-blue-900/30 text-blue-400 border-blue-900/50"
                      )}>
                        {opp.type.replace("_", " ")}
                      </div>
                      <h3 className="text-lg font-bold text-white">{opp.attribute}</h3>
                    </div>
                  </div>

                  <div className="flex divide-x divide-slate-800">
                    {/* BEFORE */}
                    <div className="flex-1 p-6 bg-slate-950/50">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Current State</div>
                      <div className={clsx("text-sm", opp.current_value === "Unknown" || !opp.current_value ? "text-slate-600 italic" : "text-slate-300")}>
                        {opp.current_value || "Empty"}
                      </div>
                    </div>

                    {/* AFTER */}
                    <div className="flex-1 p-6 bg-emerald-950/10">
                      <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-4">AI Proposal</div>
                      {opp.proposed_value ? (
                        <div className="text-sm text-white font-medium mb-6 leading-relaxed">
                          {opp.proposed_value}
                        </div>
                      ) : (
                        <div className="text-sm text-red-400 mb-6 italic flex items-center gap-2">
                          <AlertTriangle size={16} /> {opp.reason}
                        </div>
                      )}

                      {opp.evidence && (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><FileText size={12} /> Source Evidence</span>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> {opp.confidence}% Conf.</span>
                          </div>
                          <div className="text-sm text-blue-400 font-mono">
                            {opp.evidence.source} {opp.evidence.page && `• Page ${opp.evidence.page}`}
                          </div>
                        </div>
                      )}

                      {opp.fact_checks && (
                        <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                          <div className="text-xs font-bold text-slate-500 mb-2">Fact-Check Validation</div>
                          <div className="flex flex-wrap gap-2">
                            {opp.fact_checks.map((fc: any, i: number) => (
                              <div key={i} className="px-2 py-1 bg-emerald-900/20 border border-emerald-900/50 text-emerald-400 rounded text-xs flex items-center gap-1">
                                <CheckCircle2 size={10} /> {fc.claim}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors">
                      Edit
                    </button>
                    {opp.status !== "CANNOT_VERIFY" && (
                      <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors">
                        Approve Change
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT COLUMN: The Impact */}
            <div className="w-80 space-y-6">
              <h2 className="text-lg font-bold text-white">Estimated Impact</h2>
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-slate-400 text-sm font-bold uppercase mb-4">Quality Score</div>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-slate-500 line-through decoration-slate-700">{data?.impact?.quality_before}</div>
                  <ArrowRight className="text-emerald-500" />
                  <div className="text-4xl font-bold text-emerald-400">{data?.impact?.quality_after}</div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-slate-400 text-sm font-bold uppercase mb-4">Commerce Readiness</div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold text-slate-500 line-through decoration-slate-700">{data?.impact?.commerce_readiness_before}</div>
                  <ArrowRight className="text-emerald-500" />
                  <div className="text-4xl font-bold text-emerald-400">{data?.impact?.commerce_readiness_after}</div>
                </div>
                
                <div className="space-y-3 mt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Completeness</span>
                    <span className="text-emerald-400 font-bold">+12%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Evidence</span>
                    <span className="text-emerald-400 font-bold">+8%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">SEO Score</span>
                    <span className="text-emerald-400 font-bold">+25%</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-2">Safe AI Automation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  These changes are grounded in verified evidence. NEXUS PI requires human review because this product's category has a high-risk policy requiring manual approval for final publishing.
                </p>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
