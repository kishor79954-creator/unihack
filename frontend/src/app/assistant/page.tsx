"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Cpu, Send, Sparkles, CheckCircle2, AlertCircle, FileText, 
  ExternalLink, ArrowRight, CornerDownLeft, RefreshCw, Box,
  Zap, AlertTriangle, ShieldCheck, Layers, HelpCircle, ChevronRight,
  Database, Tag, ListFilter
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EvidenceDrawer } from "@/components/ui/EvidenceDrawer";
import { API_BASE_URL } from "@/lib/api";

interface Citation {
  text: string;
  source: string;
  confidence: number;
}

interface ProductMatch {
  id: number;
  name: string;
  manufacturer: string;
  category: string;
  confidence: number;
  match_score: number;
}

interface SuggestedQuestion {
  text: string;
  type: string;
  priority: string;
  reason?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content?: string;
  data?: {
    answer: string;
    tool_logs?: string[];
    products?: ProductMatch[];
    citations?: Citation[];
    grounding_status?: string;
  };
  error?: boolean;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [productList, setProductList] = useState<any[]>([]);
  const [activeContext, setActiveContext] = useState<string>("catalog");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);

  // Dynamic Product Suggestions State
  const [suggestions, setSuggestions] = useState<SuggestedQuestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [profileSummary, setProfileSummary] = useState<any>(null);

  // Right Panel Tab
  const [contextTab, setContextTab] = useState<"verified" | "raw">("verified");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch real products from SQLite database
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProductList(data);
          setActiveContext(`product_${data[0].id}`);
        } else {
          setProductList([]);
          setActiveContext("catalog");
        }
      })
      .catch(console.error);
  }, []);

  // 2. Fetch full details and dynamic suggestions for the active product
  useEffect(() => {
    if (activeContext && activeContext.startsWith("product_")) {
      const pId = activeContext.split("_")[1];
      
      // Fetch Product Details
      fetch(`${API_BASE_URL}/api/products/${pId}`)
        .then((res) => res.json())
        .then((data) => setSelectedProduct(data))
        .catch(console.error);

      // Fetch Dynamic Product-Aware Questions
      setSuggestionsLoading(true);
      fetch(`${API_BASE_URL}/api/copilot/suggestions/${pId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.questions) {
            setSuggestions(data.questions);
            setProfileSummary(data.profile_summary);
          } else {
            setSuggestions([]);
          }
          setSuggestionsLoading(false);
        })
        .catch(() => {
          setSuggestions([]);
          setSuggestionsLoading(false);
        });

    } else {
      setSelectedProduct(null);
      setSuggestions([
        { text: "What products are currently indexed in the active catalog?", type: "SPECIFICATION", priority: "HIGH" },
        { text: "Which products have open review conflicts or quality alerts?", type: "CONFLICT", priority: "HIGH" },
        { text: "Summarize data completeness scores across all categories.", type: "VALIDATION", priority: "MEDIUM" },
        { text: "What source documents are available for cross-referencing?", type: "EVIDENCE", priority: "MEDIUM" }
      ]);
      setProfileSummary(null);
    }
  }, [activeContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          context_id: activeContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI Service Error: ${res.statusText}`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        data: data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-err-${Date.now()}`,
          role: "assistant",
          error: true,
          data: {
            answer: "Unable to communicate with the AI engine. Please ensure your backend is running.",
            tool_logs: ["Connection check failed"],
            products: [],
            citations: [],
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case "SPECIFICATION":
        return { label: "SPECIFICATION", icon: Zap, color: "text-[#60A5FA] bg-[#3B82F6]/10 border-[#3B82F6]/30" };
      case "MISSING_DATA":
        return { label: "MISSING DATA", icon: AlertTriangle, color: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30" };
      case "EVIDENCE":
        return { label: "EVIDENCE", icon: FileText, color: "text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/30" };
      case "CONFLICT":
        return { label: "CONFLICT", icon: AlertCircle, color: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30" };
      case "COMMERCE":
        return { label: "COMMERCE", icon: Layers, color: "text-[#A78BFA] bg-[#A78BFA]/10 border-[#A78BFA]/30" };
      case "VALIDATION":
        return { label: "VALIDATION", icon: ShieldCheck, color: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30" };
      default:
        return { label: "INTELLIGENCE", icon: Sparkles, color: "text-[#60A5FA] bg-[#3B82F6]/10 border-[#3B82F6]/30" };
    }
  };

  return (
    <AppShell>
      <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 max-w-7xl mx-auto overflow-hidden">
        
        {/* Main Conversation & Intelligence Answer Workspace */}
        <div className="flex-1 flex flex-col bg-[#111827] border border-[#263449] rounded-xl overflow-hidden shadow-sm">
          
          {/* Workspace Header */}
          <div className="h-14 px-6 border-b border-[#263449] flex items-center justify-between bg-[#0C1220]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#60A5FA] flex items-center justify-center font-bold text-xs">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-xs text-[#F3F6FA]">Product Intelligence Copilot</h2>
                <p className="text-[11px] text-[#A8B3C2]">Grounding engine active against SQLite product specs & documentation</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#A8B3C2]">Active Target:</span>
              <select
                value={activeContext}
                onChange={(e) => setActiveContext(e.target.value)}
                className="bg-[#070B12] border border-[#263449] rounded-md px-2.5 py-1 text-xs font-semibold text-[#F3F6FA] max-w-xs truncate focus:outline-none focus:border-[#3B82F6]"
              >
                <option value="catalog">Full Catalog Index</option>
                {productList.map((p) => (
                  <option key={p.id} value={`product_${p.id}`}>
                    Product: {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversation History Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#070B12]/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#60A5FA] flex items-center justify-center shadow-xs">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F3F6FA]">
                    {selectedProduct ? `${selectedProduct.name}` : "Product Intelligence Assistant"}
                  </h3>
                  <p className="text-xs text-[#A8B3C2] max-w-md mt-1">
                    {selectedProduct 
                      ? `Ask questions grounded in verified ${selectedProduct.category || "product"} specifications, source evidence citations, and missing data gaps.`
                      : "Select a product above or ask general intelligence queries across the entire catalog."}
                  </p>
                </div>

                {/* Dynamic Product-Aware Suggested Questions */}
                <div className="w-full max-w-xl space-y-2 pt-2 text-left">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#667085] uppercase tracking-wider px-1">
                    <span>PRODUCT-AWARE SUGGESTED QUESTIONS</span>
                    {suggestionsLoading && <span className="text-[#60A5FA] animate-pulse">Analyzing Product...</span>}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {suggestions.map((q, idx) => {
                      const badge = getQuestionTypeBadge(q.type);
                      const Icon = badge.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSend(q.text)}
                          className="w-full p-3 bg-[#111827] hover:bg-[#172033] border border-[#263449] hover:border-[#3B82F6]/50 rounded-xl text-xs font-medium text-[#F3F6FA] transition-all flex items-start gap-3 text-left group shadow-xs"
                        >
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 flex items-center gap-1 mt-0.5 ${badge.color}`}>
                            <Icon className="w-2.5 h-2.5" />
                            {badge.label}
                          </span>
                          <span className="flex-1 text-[#A8B3C2] group-hover:text-[#F3F6FA] transition-colors leading-relaxed">
                            {q.text}
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#667085] group-hover:text-[#60A5FA] shrink-0 mt-0.5 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#60A5FA] flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                      <Cpu className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-3 max-w-2xl ${m.role === "user" ? "bg-[#3B82F6] text-white p-3.5 rounded-xl rounded-tr-none text-xs font-medium" : "bg-[#111827] border border-[#263449] p-4 rounded-xl rounded-tl-none text-xs space-y-3 shadow-sm"}`}>
                    {m.content && <p>{m.content}</p>}

                    {m.data && (
                      <div className="space-y-3">
                        <p className="text-[#F3F6FA] leading-relaxed whitespace-pre-wrap">{m.data.answer}</p>

                        {/* Verified Citations List */}
                        {m.data.citations && m.data.citations.length > 0 && (
                          <div className="pt-2 border-t border-[#263449] space-y-1.5">
                            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">VERIFIED EVIDENCE CITATIONS</span>
                            <div className="flex flex-wrap gap-2">
                              {m.data.citations.map((c, i) => (
                                <button
                                  key={i}
                                  onClick={() => setSelectedEvidence({
                                    source: c.source,
                                    text_snippet: c.text,
                                    confidence: c.confidence / 100
                                  })}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#070B12] hover:bg-[#172033] border border-[#263449] rounded text-[11px] text-[#60A5FA] transition-colors"
                                >
                                  <FileText className="w-3 h-3 text-[#22D3EE]" />
                                  <span className="font-mono">{c.source} ({c.confidence}%)</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}

            {loading && (
              <div className="flex gap-3 items-center text-xs text-[#A8B3C2]">
                <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#60A5FA] flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#3B82F6]" />
                </div>
                <div className="p-3 bg-[#111827] border border-[#263449] rounded-xl text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#60A5FA] rounded-full animate-ping"></span>
                  Grounding query in product profile and running Gemini AI...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* User Chat Input */}
          <div className="p-4 border-t border-[#263449] bg-[#0C1220]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedProduct ? `Ask about ${selectedProduct.name} specifications, citations, or missing data...` : "Ask about product specs, evidence, missing data..."}
                className="flex-1 bg-[#070B12] border border-[#263449] rounded-lg px-4 py-2.5 text-xs text-[#F3F6FA] placeholder-[#667085] focus:outline-none focus:border-[#3B82F6]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 bg-[#3B82F6] hover:bg-[#1D4ED8] disabled:bg-[#263449] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Active Product Intelligence Profile Panel */}
        <div className="w-full md:w-88 bg-[#111827] border border-[#263449] rounded-xl p-5 flex flex-col justify-between shadow-sm overflow-y-auto shrink-0">
          <div className="space-y-4">
            
            {/* Header Identity */}
            <div className="border-b border-[#263449] pb-3">
              <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider block">ACTIVE PRODUCT PROFILE</span>
              <h4 className="font-bold text-sm text-[#F3F6FA] mt-1 truncate">
                {selectedProduct ? selectedProduct.name : "Full Catalog Index"}
              </h4>
              <div className="flex items-center justify-between text-xs text-[#A8B3C2] font-mono mt-0.5">
                <span>{selectedProduct ? `SKU: ${selectedProduct.sku}` : `${productList.length} Products`}</span>
                {selectedProduct && <span className="text-[#22C55E] font-bold">{selectedProduct.quality_score || 85}% Quality</span>}
              </div>
            </div>

            {selectedProduct ? (
              <div className="space-y-4 text-xs">
                
                {/* Data Coverage Metrics Bar */}
                {profileSummary && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-[#070B12] rounded border border-[#263449]">
                      <span className="text-[10px] text-[#667085] block">ATTRIBUTES</span>
                      <span className="font-mono font-bold text-[#60A5FA]">{profileSummary.attributes_count}</span>
                    </div>
                    <div className="p-2 bg-[#070B12] rounded border border-[#263449]">
                      <span className="text-[10px] text-[#667085] block">EVIDENCE</span>
                      <span className="font-mono font-bold text-[#22C55E]">{profileSummary.evidence_count}</span>
                    </div>
                    <div className="p-2 bg-[#070B12] rounded border border-[#263449]">
                      <span className="text-[10px] text-[#667085] block">CONFLICTS</span>
                      <span className={`font-mono font-bold ${profileSummary.conflicts_count > 0 ? "text-[#EF4444]" : "text-[#A8B3C2]"}`}>
                        {profileSummary.conflicts_count}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tab Switcher: Verified Attributes vs Raw Source Data */}
                <div>
                  <div className="flex border-b border-[#263449] gap-4 mb-2 text-[11px] font-semibold">
                    <button
                      onClick={() => setContextTab("verified")}
                      className={`pb-1.5 border-b-2 transition-colors ${
                        contextTab === "verified" ? "border-[#3B82F6] text-[#60A5FA]" : "border-transparent text-[#667085] hover:text-[#A8B3C2]"
                      }`}
                    >
                      Verified Attributes
                    </button>
                    <button
                      onClick={() => setContextTab("raw")}
                      className={`pb-1.5 border-b-2 transition-colors ${
                        contextTab === "raw" ? "border-[#3B82F6] text-[#60A5FA]" : "border-transparent text-[#667085] hover:text-[#A8B3C2]"
                      }`}
                    >
                      Raw Source Fields
                    </button>
                  </div>

                  {contextTab === "verified" ? (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {(selectedProduct.attributes || []).map((a: any) => (
                        <div key={a.id} className="p-2 bg-[#070B12] rounded border border-[#263449] flex justify-between items-center text-[11px]">
                          <span className="text-[#A8B3C2] font-medium truncate max-w-[120px]">
                            {a.key.replace(/[_-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </span>
                          <span className="font-mono text-[#60A5FA] font-bold truncate max-w-[130px]">
                            {a.normalized_value || a.raw_value} {a.unit || ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 font-mono">
                      {(selectedProduct.attributes || []).map((a: any) => (
                        <div key={a.id} className="p-2 bg-[#070B12] rounded border border-[#263449] text-[10px] space-y-0.5">
                          <span className="text-[#667085] block truncate">key: {a.key}</span>
                          <span className="text-[#A8B3C2] block truncate">raw_val: {a.raw_value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Source File Link */}
                <div>
                  <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block mb-1">REGISTERED SOURCE</span>
                  <div className="p-2.5 bg-[#070B12] rounded border border-[#263449] text-[11px] text-[#A8B3C2] flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
                    <span className="truncate">{selectedProduct.sources && selectedProduct.sources.length > 0 ? selectedProduct.sources[0].name : "SQLite Database"}</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-4 bg-[#070B12] rounded border border-[#263449] text-xs text-[#A8B3C2] space-y-2">
                <p>AI Copilot will search across all {productList.length} products in the database to answer queries.</p>
                <p className="text-[11px] text-[#667085]">Select a specific product in the dropdown to ground the conversation in exact technical attributes.</p>
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="pt-4 border-t border-[#263449]">
              <Link
                href={`/products/${selectedProduct.id}`}
                className="w-full py-2 bg-[#070B12] hover:bg-[#172033] border border-[#263449] rounded-lg text-xs font-semibold text-[#A8B3C2] hover:text-[#F3F6FA] flex items-center justify-center gap-1.5 transition-colors"
              >
                Inspect Full Product <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

      </div>

      <EvidenceDrawer
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        evidence={selectedEvidence}
      />
    </AppShell>
  );
}
