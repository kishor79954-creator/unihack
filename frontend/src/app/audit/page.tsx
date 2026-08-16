"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, Box, Search, AlertTriangle, Filter, CheckCircle, 
  Layers, Clock, ShieldCheck, Settings, Activity
} from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow, format } from "date-fns";

export default function AuditTrail() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/audit")
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden">
      {/* Mini Sidebar */}
      <div className="w-16 border-r border-slate-800 bg-slate-900/50 flex flex-col items-center py-6 gap-6">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mb-4">N</div>
        <Link href="/" className="p-3 text-slate-500 hover:text-slate-300 transition-colors" title="Dashboard"><LayoutDashboard size={20} /></Link>
        <Link href="/products" className="p-3 text-slate-500 hover:text-slate-300 transition-colors" title="Products"><Box size={20} /></Link>
        <Link href="/review" className="p-3 text-slate-500 hover:text-slate-300 transition-colors" title="Review Center"><AlertTriangle size={20} /></Link>
        <Link href="/audit" className="p-3 text-blue-400 bg-blue-900/20 rounded-xl" title="Audit Trail"><ShieldCheck size={20} /></Link>
        <Link href="/settings" className="p-3 text-slate-500 hover:text-slate-300 transition-colors" title="Settings"><Settings size={20} /></Link>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-24 border-b border-slate-800 px-8 py-6 bg-slate-900/30 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <ShieldCheck className="text-blue-500" /> Audit Trail & Governance
            </h1>
            <p className="text-sm text-slate-400 mt-1">Immutable cryptographic log of all AI extractions and human decisions.</p>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full">
          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading audit trail...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 border border-slate-800 rounded-xl bg-slate-900/50">
              <ShieldCheck size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Audit Records</h3>
              <p className="text-slate-400">The audit log is currently empty.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((event, index) => (
                <div key={event.id} className="relative pl-8 pb-6 border-l border-slate-800 last:border-l-transparent last:pb-0">
                  {/* Timeline Dot */}
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center">
                    <div className={clsx(
                      "w-1.5 h-1.5 rounded-full",
                      event.actor === "NEXUS AI" ? "bg-blue-500" : "bg-emerald-500"
                    )} />
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">
                          {format(new Date(event.timestamp), "MMM d, yyyy HH:mm:ss")}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {event.actor}
                        </span>
                        <span className={clsx(
                          "text-xs font-bold px-2 py-1 rounded uppercase",
                          event.action === "CREATE" ? "bg-blue-900/30 text-blue-400" :
                          event.action === "RESOLVE_ISSUE" ? "bg-emerald-900/30 text-emerald-400" :
                          "bg-slate-800 text-slate-300"
                        )}>
                          {event.action.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {event.entity_type} #{event.entity_id}
                      </div>
                    </div>

                    <p className="text-slate-300 text-sm mb-4">{event.reason}</p>

                    {(event.previous_value || event.new_value) && (
                      <div className="bg-slate-950 rounded-lg p-3 text-sm font-mono flex items-center gap-4">
                        {event.previous_value && (
                          <>
                            <span className="text-rose-400 line-through opacity-70">{event.previous_value}</span>
                            <span className="text-slate-600">→</span>
                          </>
                        )}
                        <span className="text-emerald-400">{event.new_value}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
