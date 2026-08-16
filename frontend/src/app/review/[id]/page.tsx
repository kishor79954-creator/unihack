"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, AlertTriangle, FileText, CheckCircle, XCircle, Edit, Scale
} from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { API_BASE_URL } from "@/lib/api";

export default function ReviewWorkspace() {
  const { id } = useParams();
  const router = useRouter();
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [manualEdit, setManualEdit] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [resolveReason, setResolveReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/reviews/${id}`)
      .then(res => res.json())
      .then(data => {
        setIssue(data);
        if (data.conflict_data?.source_a?.value) {
          setEditValue(data.conflict_data.source_a.value);
        }
        setLoading(false);
      });
  }, [id]);

  const handleResolve = async (decision: string, valueOverride?: string) => {
    if (!resolveReason && decision !== "ACCEPT_AI") {
      alert("Please provide a reason for your decision.");
      return;
    }
    setSubmitting(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          value: valueOverride,
          reason: resolveReason || "Accepted AI recommendation based on source authority.",
          reviewer: "Admin Reviewer"
        })
      });
      if (res.ok) {
        alert("Issue resolved successfully. Product version updated.");
        router.push("/review");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to resolve issue.");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-500">Loading workspace...</div>;
  if (!issue || issue.error) return <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-500">Issue not found.</div>;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans">
      {/* LEFT COL: Issue Context */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <Link href="/review" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 text-sm">
            <ArrowLeft size={16} /> Back to Queue
          </Link>
          
          <div className="mb-4 flex items-center gap-2">
            <span className={clsx(
              "text-xs font-bold px-2 py-1 rounded",
              issue.priority === "CRITICAL" ? "bg-rose-900/30 text-rose-400 border border-rose-900/50" :
              "bg-orange-900/30 text-orange-400 border border-orange-900/50"
            )}>
              {issue.priority}
            </span>
            <span className="bg-amber-900/30 text-amber-400 border border-amber-900/50 text-xs font-bold px-2 py-1 rounded">
              {issue.status}
            </span>
          </div>

          <h1 className="text-xl font-bold text-white mb-2">{issue.issue_type.replace('_', ' ')}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{issue.description}</p>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Product Context</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-white mb-1">{issue.product.name}</p>
            <p className="text-xs text-slate-500 font-mono mb-4">{issue.product.sku}</p>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Quality Score:</span>
              <span className={clsx("font-bold px-2 py-0.5 rounded border", 
                issue.product.quality_score >= 80 ? "bg-emerald-900/20 text-emerald-400 border-emerald-900/50" : "bg-amber-900/20 text-amber-400 border-amber-900/50"
              )}>
                {issue.product.quality_score}%
              </span>
            </div>
          </div>
          
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Metadata</h3>
          <ul className="text-sm text-slate-400 space-y-3">
            <li className="flex justify-between"><span>Attribute:</span> <span className="font-mono text-white">{issue.attribute_key}</span></li>
            <li className="flex justify-between"><span>Created:</span> <span>{formatDistanceToNow(new Date(issue.created_at))} ago</span></li>
            <li className="flex justify-between"><span>Assigned:</span> <span>{issue.assignee || "Unassigned"}</span></li>
          </ul>
        </div>
      </div>

      {/* CENTER/RIGHT COL: Comparison & Resolution */}
      <div className="flex-1 flex flex-col">
        <header className="h-20 border-b border-slate-800 flex items-center px-8 bg-slate-900/30">
          <h2 className="text-lg font-bold text-white flex items-center gap-3">
            <Scale className="text-blue-500" /> Evidence Comparison Workspace
          </h2>
        </header>

        <div className="flex-1 overflow-auto p-8 flex flex-col">
          
          {issue.issue_type === "SOURCE_CONFLICT" && issue.conflict_data && (
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Source A */}
              <div className="border border-slate-800 rounded-xl bg-slate-900 overflow-hidden">
                <div className="bg-slate-800/50 p-4 border-b border-slate-800">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <FileText size={16} className="text-blue-400"/> Source A
                  </h3>
                </div>
                <div className="p-6">
                  <div className="text-3xl font-mono text-white mb-6">
                    {issue.conflict_data.source_a.value} {issue.conflict_data.source_a.unit}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase mb-1">Source Text Evidence</p>
                      <p className="text-sm italic text-slate-400 bg-slate-950 p-3 rounded border border-slate-800">
                        "{issue.conflict_data.source_a.snippet}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Source B */}
              <div className="border border-slate-800 rounded-xl bg-slate-900 overflow-hidden">
                <div className="bg-slate-800/50 p-4 border-b border-slate-800">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <FileText size={16} className="text-orange-400"/> Source B
                  </h3>
                </div>
                <div className="p-6">
                  <div className="text-3xl font-mono text-white mb-6">
                    {issue.conflict_data.source_b.value} {issue.conflict_data.source_b.unit}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase mb-1">Source Text Evidence</p>
                      <p className="text-sm italic text-slate-400 bg-slate-950 p-3 rounded border border-slate-800">
                        "{issue.conflict_data.source_b.snippet}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Recommendation */}
          {issue.ai_recommendation && (
            <div className="bg-blue-900/10 border border-blue-900/50 rounded-xl p-6 mb-8 flex gap-6">
              <div className="bg-blue-900/30 p-3 rounded-full h-fit">
                <CheckCircle className="text-blue-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-blue-400 font-bold mb-2">AI Recommendation</h3>
                <p className="text-white text-xl font-mono mb-4">{issue.ai_recommendation}</p>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{issue.ai_reasoning}</p>
                
                <button 
                  onClick={() => handleResolve("ACCEPT_AI")}
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                  Accept Recommendation
                </button>
              </div>
            </div>
          )}

          {/* Manual Resolution Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Manual Resolution</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Resolution Rationale / Note</label>
              <textarea 
                value={resolveReason}
                onChange={e => setResolveReason(e.target.value)}
                placeholder="Explain why you are choosing this value..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 min-h-[80px]"
              />
            </div>
            
            {!manualEdit ? (
              <div className="flex gap-4">
                <button onClick={() => handleResolve("ACCEPT_SOURCE_A")} disabled={submitting} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium border border-slate-700 transition-colors">
                  Accept Source A
                </button>
                <button onClick={() => handleResolve("ACCEPT_SOURCE_B")} disabled={submitting} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium border border-slate-700 transition-colors">
                  Accept Source B
                </button>
                <button onClick={() => setManualEdit(true)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium border border-slate-700 transition-colors flex items-center justify-center gap-2">
                  <Edit size={16} /> Edit Value manually
                </button>
              </div>
            ) : (
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-2">Override Value</label>
                  <input 
                    type="text" 
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button onClick={() => handleResolve("EDIT", editValue)} disabled={submitting} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">
                  Save Override
                </button>
                <button onClick={() => setManualEdit(false)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
