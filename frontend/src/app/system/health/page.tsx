"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, Server, Database, Brain, Network, Settings, 
  Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw
} from "lucide-react";
import { clsx } from "clsx";

export default function SystemHealthDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    fetch("http://localhost:8000/api/system/health")
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(e => {
        setHealth({ overall: "UNAVAILABLE", error: "Cannot connect to API" });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "HEALTHY") return <CheckCircle2 className="text-emerald-500" size={20} />;
    if (status === "DEGRADED") return <AlertTriangle className="text-amber-500" size={20} />;
    return <XCircle className="text-red-500" size={20} />;
  };

  const StatusText = ({ status }: { status: string }) => {
    if (status === "HEALTHY") return <span className="text-emerald-400 font-bold">Operational</span>;
    if (status === "DEGRADED") return <span className="text-amber-400 font-bold">Degraded</span>;
    return <span className="text-red-400 font-bold">Unavailable</span>;
  };

  if (loading && !health) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-300 font-sans items-center justify-center">
        <Activity className="animate-spin text-emerald-500 mb-4" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans">
      {/* Mini Sidebar */}
      <div className="w-16 border-r border-slate-800 bg-slate-900/50 flex flex-col items-center py-6 gap-6 z-10 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mb-4">N</div>
        <Link href="/" className="p-3 text-slate-500 hover:text-slate-300 transition-colors"><LayoutDashboard size={20} /></Link>
        <Link href="/system/health" className="p-3 text-emerald-400 bg-emerald-900/20 rounded-xl"><Activity size={20} /></Link>
        <Link href="/settings" className="p-3 text-slate-500 hover:text-slate-300 transition-colors"><Settings size={20} /></Link>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/30">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className={health?.overall === "HEALTHY" ? "text-emerald-500" : "text-amber-500"} /> 
              System Observability & Health
            </h1>
            <p className="text-sm text-slate-400 mt-1">Real-time status of NEXUS PI microservices and dependencies.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={fetchHealth}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          
          <div className={clsx(
            "p-6 rounded-xl border mb-8 flex justify-between items-center",
            health?.overall === "HEALTHY" ? "bg-emerald-950/20 border-emerald-900/50" :
            health?.overall === "DEGRADED" ? "bg-amber-950/20 border-amber-900/50" : 
            "bg-red-950/20 border-red-900/50"
          )}>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">System Status</div>
              <div className="text-3xl font-bold text-white">
                {health?.overall === "HEALTHY" ? "All Systems Operational" :
                 health?.overall === "DEGRADED" ? "Partial Outage Detected" :
                 "Critical Systems Offline"}
              </div>
            </div>
            <div>
              <StatusIcon status={health?.overall} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Primary Database</h3>
                    <div className="text-xs text-slate-400">PostgreSQL 15</div>
                  </div>
                </div>
                <StatusIcon status={health?.database} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Status</span>
                  <StatusText status={health?.database} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Latency</span>
                  <span className="text-slate-200">12ms</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-purple-400">
                    <Brain size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">AI Provider</h3>
                    <div className="text-xs text-slate-400">LLM Inference Engine</div>
                  </div>
                </div>
                <StatusIcon status={health?.ai_provider} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Status</span>
                  <StatusText status={health?.ai_provider} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Rate Limit</span>
                  <span className="text-slate-200">2% Used</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-amber-400">
                    <Network size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Knowledge Graph</h3>
                    <div className="text-xs text-slate-400">Neo4j Cluster</div>
                  </div>
                </div>
                <StatusIcon status={health?.knowledge_graph} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Status</span>
                  <StatusText status={health?.knowledge_graph} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sync Delay</span>
                  <span className="text-slate-200">0s</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-emerald-400">
                    <Server size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Background Workers</h3>
                    <div className="text-xs text-slate-400">Job Processing Queue</div>
                  </div>
                </div>
                <StatusIcon status={health?.workers} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Status</span>
                  <StatusText status={health?.workers} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Queue Depth</span>
                  <span className="text-slate-200">0 pending jobs</span>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
