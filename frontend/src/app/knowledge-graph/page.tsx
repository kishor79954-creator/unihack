"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  GitFork, Search, Box, FileText, Factory, Layers, Cpu, Wrench, 
  ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Filter, ExternalLink, 
  ShieldCheck, ArrowRight, Sparkles, CheckCircle2, Info, RefreshCw, Upload
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EvidenceDrawer } from "@/components/ui/EvidenceDrawer";
import { API_BASE_URL } from "@/lib/api";

interface GraphNode {
  id: string;
  name: string;
  type: "Product" | "Manufacturer" | "Category" | "Document" | "Compatible" | "Application";
  sku?: string;
  subtitle?: string;
  x: number;
  y: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  category: "Manufacturer" | "Category" | "Evidence" | "Compatibility" | "Application";
  confidence?: number;
  sourceDoc?: string;
}

export default function KnowledgeGraphPage() {
  const router = useRouter();

  // Product List & Selection State
  const [productList, setProductList] = useState<{ id: number; name: string; sku?: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  // Controls
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic Graph API State
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState("");

  // Selections & Interactions
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);

  // 1. Fetch available products from database
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProductList(data);
          setSelectedProductId(data[0].id);
        } else {
          setProductList([]);
          setSelectedProductId(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load products for graph:", err);
        setLoading(false);
      });
  }, []);

  // 2. Fetch Graph data for selected product gracefully
  useEffect(() => {
    if (!selectedProductId) {
      setNodes([]);
      setEdges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/api/graph/${selectedProductId}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.nodes) {
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
          setProductName(data.product_name || `Product #${selectedProductId}`);
          if (data.nodes.length > 0) {
            setSelectedNodeId(data.nodes[0].id);
          }
        } else {
          setNodes([]);
          setEdges([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Graph API error handled gracefully:", err);
        setNodes([]);
        setEdges([]);
        setLoading(false);
      });
  }, [selectedProductId]);

  // Filtered Graph Data
  const filteredEdges = useMemo(() => {
    if (activeFilter === "All") return edges;
    return edges.filter((e) => e.category === activeFilter);
  }, [edges, activeFilter]);

  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (nodes.length > 0) ids.add(nodes[0].id);
    filteredEdges.forEach((e) => {
      ids.add(e.source);
      ids.add(e.target);
    });
    return ids;
  }, [nodes, filteredEdges]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0] || {
      id: "node_empty",
      name: productName || "No Product Selected",
      type: "Product",
      sku: "N/A"
    };
  }, [nodes, selectedNodeId, productName]);

  // Search Match
  const searchedNodeId = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const match = nodes.find(
      (n) =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return match ? match.id : null;
  }, [nodes, searchQuery]);

  // Zoom Controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.6));
  const handleReset = () => {
    setZoom(1);
    if (nodes.length > 0) setSelectedNodeId(nodes[0].id);
    setSearchQuery("");
    setActiveFilter("All");
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "Product":
        return { border: "border-[#3B82F6]", bg: "bg-[#3B82F6]/15", text: "text-[#60A5FA]", icon: Box };
      case "Manufacturer":
        return { border: "border-[#B8C2CF]", bg: "bg-[#172033]", text: "text-[#B8C2CF]", icon: Factory };
      case "Category":
        return { border: "border-[#A8B3C2]", bg: "bg-[#172033]", text: "text-[#A8B3C2]", icon: Layers };
      case "Document":
        return { border: "border-[#22D3EE]", bg: "bg-[#22D3EE]/10", text: "text-[#22D3EE]", icon: FileText };
      case "Compatible":
        return { border: "border-[#F59E0B]", bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]", icon: Cpu };
      case "Application":
        return { border: "border-[#22C55E]", bg: "bg-[#22C55E]/10", text: "text-[#22C55E]", icon: Wrench };
      default:
        return { border: "border-[#263449]", bg: "bg-[#111827]", text: "text-[#A8B3C2]", icon: Box };
    }
  };

  return (
    <AppShell>
      <div className={`space-y-4 max-w-7xl mx-auto ${isFullscreen ? "fixed inset-0 z-50 bg-[#070B12] p-6 max-w-none space-y-4 overflow-hidden" : ""}`}>
        
        {/* Workspace Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-[#263449] px-6 py-4 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#60A5FA]/30 to-transparent"></div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight">
                Knowledge Graph
              </h1>
              <div className="flex items-center gap-1.5 bg-[#22C55E]/10 text-[#22C55E] px-2.5 py-0.5 rounded-full border border-[#22C55E]/30 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full"></span>
                Backend API Synced
              </div>
            </div>
            <p className="text-xs text-[#A8B3C2] mt-0.5">
              Dynamically derived relationships across products, sources and industrial taxonomy from SQLite database.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Dynamic Product Selector */}
            {productList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A8B3C2] font-semibold">Graph Product:</span>
                <select
                  value={selectedProductId || ""}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="bg-[#070B12] border border-[#263449] text-xs font-semibold text-[#F3F6FA] rounded-md px-3 py-1.5 focus:outline-none focus:border-[#3B82F6]"
                >
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-3 py-1.5 border border-[#263449] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {isFullscreen ? "Exit Fullscreen" : "Presentation Mode"}
            </button>
          </div>
        </div>

        {/* Graph Canvas & Intelligence Inspector Split Workspace */}
        <div className="h-[calc(100vh-14rem)] flex flex-col md:flex-row gap-5 overflow-hidden">
          
          {/* Main Dark Canvas (70% width) */}
          <div className="flex-1 flex flex-col bg-[#070B12] border border-[#263449] rounded-xl overflow-hidden shadow-sm relative select-none">
            
            {/* Toolbar */}
            <div className="h-12 px-4 border-b border-[#263449] flex items-center justify-between bg-[#0C1220] z-20">
              
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#667085]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search graph nodes, SKUs..."
                  className="w-full pl-8 pr-3 py-1 text-xs bg-[#070B12] border border-[#263449] rounded-md text-[#F3F6FA] placeholder-[#667085] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="hidden lg:flex items-center gap-1">
                {["All", "Manufacturer", "Category", "Evidence", "Compatibility"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                      activeFilter === cat
                        ? "bg-[#172033] text-[#60A5FA] border border-[#3B82F6]/30"
                        : "text-[#A8B3C2] hover:text-[#F3F6FA] hover:bg-[#172033]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 text-[#A8B3C2]">
                <button onClick={handleZoomIn} className="p-1.5 hover:bg-[#172033] hover:text-[#F3F6FA] rounded" title="Zoom In">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleZoomOut} className="p-1.5 hover:bg-[#172033] hover:text-[#F3F6FA] rounded" title="Zoom Out">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleReset} className="p-1.5 hover:bg-[#172033] hover:text-[#F3F6FA] rounded" title="Reset Layout">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* SVG Canvas Area */}
            <div className="flex-1 relative flex items-center justify-center p-6 bg-[radial-gradient(#263449_1px,transparent_1px)] [background-size:28px_28px] overflow-hidden">
              
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-[#A8B3C2]">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#3B82F6]" />
                  <span>Loading dynamic graph relationships from backend API...</span>
                </div>
              ) : productList.length === 0 ? (
                <div className="text-center p-8 space-y-3">
                  <GitFork className="w-10 h-10 text-[#667085] mx-auto" />
                  <h3 className="font-bold text-sm text-[#F3F6FA]">No products in database</h3>
                  <p className="text-xs text-[#A8B3C2] max-w-sm mx-auto">
                    Upload a datasheet PDF or CSV dataset in Documents to extract product specifications and build knowledge graph relationships.
                  </p>
                  <Link
                    href="/ingestion"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" /> Import Document
                  </Link>
                </div>
              ) : nodes.length === 0 ? (
                <div className="text-center p-8 space-y-2">
                  <GitFork className="w-8 h-8 text-[#667085] mx-auto" />
                  <p className="font-bold text-xs text-[#F3F6FA]">No verified graph relationships for this product.</p>
                </div>
              ) : (
                <div 
                  className="relative w-[700px] h-[500px] transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                >
                  
                  {/* SVG Edges */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#263449" />
                      </marker>
                      <marker id="arrow-active" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
                      </marker>
                    </defs>

                    {filteredEdges.map((edge) => {
                      const sourceNode = nodes.find((n) => n.id === edge.source);
                      const targetNode = nodes.find((n) => n.id === edge.target);
                      if (!sourceNode || !targetNode) return null;

                      const isHovered = hoveredEdgeId === edge.id;
                      const isNodeFocus = selectedNodeId === sourceNode.id || selectedNodeId === targetNode.id;

                      const midX = (sourceNode.x + targetNode.x) / 2;
                      const midY = (sourceNode.y + targetNode.y) / 2;

                      return (
                        <g key={edge.id} className="pointer-events-auto cursor-pointer" onMouseEnter={() => setHoveredEdgeId(edge.id)} onMouseLeave={() => setHoveredEdgeId(null)}>
                          <line
                            x1={sourceNode.x}
                            y1={sourceNode.y}
                            x2={targetNode.x}
                            y2={targetNode.y}
                            stroke={isHovered || isNodeFocus ? "#3B82F6" : "#263449"}
                            strokeWidth={isHovered ? "2.5" : "1.5"}
                            strokeDasharray={edge.category === "Evidence" ? "4,4" : undefined}
                            markerEnd={isHovered || isNodeFocus ? "url(#arrow-active)" : "url(#arrow)"}
                          />

                          <g transform={`translate(${midX}, ${midY})`}>
                            <rect
                              x="-50"
                              y="-11"
                              width="100"
                              height="22"
                              rx="4"
                              fill={isHovered ? "#172033" : "#0C1220"}
                              stroke={isHovered ? "#3B82F6" : "#263449"}
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="4"
                              textAnchor="middle"
                              fill={isHovered ? "#60A5FA" : "#A8B3C2"}
                              fontSize="9 font-mono"
                              fontWeight="600"
                            >
                              {edge.label}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Render Nodes */}
                  {nodes.map((node) => {
                    if (activeNodeIds.size > 0 && !activeNodeIds.has(node.id)) return null;

                    const isSelected = selectedNodeId === node.id;
                    const isSearched = searchedNodeId === node.id;
                    const style = getNodeColor(node.type);
                    const Icon = style.icon;
                    const isCenterProduct = node.type === "Product";

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        style={{
                          left: `${node.x}px`,
                          top: `${node.y}px`,
                          transform: "translate(-50%, -50%)"
                        }}
                        className={`absolute z-10 transition-all cursor-pointer rounded-xl ${
                          isCenterProduct ? "p-4 w-44" : "p-3 w-40"
                        } ${style.bg} border-2 ${
                          isSelected || isSearched ? "border-[#3B82F6] ring-4 ring-[#3B82F6]/30 scale-105" : style.border
                        } hover:scale-105 shadow-xl`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`p-1 rounded-md ${style.bg} ${style.text}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-bold tracking-wider uppercase text-[#A8B3C2]">
                            {node.type}
                          </span>
                        </div>

                        <div className="font-bold text-xs text-[#F3F6FA] leading-tight truncate">
                          {node.name}
                        </div>

                        {node.subtitle && (
                          <span className="text-[10px] text-[#A8B3C2] block mt-0.5 truncate font-mono">
                            {node.subtitle}
                          </span>
                        )}
                      </div>
                    );
                  })}

                </div>
              )}

            </div>

            {/* Legend */}
            <div className="h-10 px-4 border-t border-[#263449] bg-[#0C1220] flex items-center justify-between text-[11px] text-[#A8B3C2] z-20">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span> Product</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#B8C2CF]"></span> Manufacturer</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#A8B3C2]"></span> Category</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22D3EE]"></span> Document</span>
              </div>
              <span>Click nodes to inspect specs</span>
            </div>

          </div>

          {/* Right Inspector */}
          <div className="w-full md:w-88 bg-[#111827] border border-[#263449] rounded-xl p-5 flex flex-col justify-between shadow-sm overflow-y-auto">
            <div className="space-y-5">
              <div className="border-b border-[#263449] pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider">SELECTED NODE SPECS</span>
                  <StatusBadge status="VERIFIED" size="sm" />
                </div>
                <h3 className="font-bold text-sm text-[#F3F6FA] mt-1.5 leading-snug">
                  {selectedNode.name}
                </h3>
                <span className="text-xs text-[#A8B3C2] font-mono block mt-0.5">
                  SKU: {selectedNode.sku || "N/A"}
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">{edges.length} RELATIONSHIPS</span>
                  <span className="text-[11px] text-[#22C55E] font-bold">API Synced</span>
                </div>

                <div className="space-y-2 text-xs">
                  {edges.length === 0 ? (
                    <div className="p-3 bg-[#070B12] rounded-lg border border-[#263449] text-[#A8B3C2]">
                      No additional verified relationships found.
                    </div>
                  ) : (
                    edges.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => setSelectedNodeId(e.target)}
                        className="p-3 bg-[#070B12] hover:bg-[#172033] rounded-lg border border-[#263449] cursor-pointer transition-colors space-y-0.5"
                      >
                        <span className="text-[10px] font-bold text-[#60A5FA] tracking-wide block">{e.label}</span>
                        <span className="font-semibold text-[#F3F6FA] block">
                          {nodes.find((n) => n.id === e.target)?.name || e.target}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#263449] space-y-2">
              {selectedProductId && (
                <Link
                  href={`/products/${selectedProductId}`}
                  className="w-full py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  Open Product Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
              <button
                onClick={() => router.push("/assistant")}
                className="w-full py-2 bg-[#070B12] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] border border-[#263449] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" /> Ask AI about this node
              </button>
            </div>
          </div>

        </div>

      </div>

      <EvidenceDrawer
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        evidence={selectedEvidence}
        productId={selectedProductId || 1}
      />
    </AppShell>
  );
}
