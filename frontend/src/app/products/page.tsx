"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Box, Search, Filter, Plus, Upload, Download, ShieldCheck, 
  ChevronRight, ArrowUpDown, SlidersHorizontal, RefreshCw, Trash2,
  Archive, CheckCircle2, MoreHorizontal, CheckSquare, Square, AlertCircle, Eye
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>(initialFilter);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProducts = () => {
    setLoading(true);
    let url = "http://localhost:8000/api/products";
    if (activeTab !== "all") {
      url += `?filter=${activeTab}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setProducts([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
    setSelectedIds(new Set());
  }, [activeTab]);

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleToggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Single Action Handlers
  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the catalog? This will cascade remove attributes and evidence.`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedbackMessage({ type: "success", text: `Product "${name}" successfully deleted.` });
        fetchProducts();
      }
    } catch (e) {
      setFeedbackMessage({ type: "error", text: "Failed to delete product." });
    }
  };

  const handleToggleArchive = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/products/${id}/archive`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFeedbackMessage({ type: "success", text: `Status updated to ${data.new_status}.` });
        fetchProducts();
      }
    } catch (e) {
      setFeedbackMessage({ type: "error", text: "Failed to update archive status." });
    }
  };

  // Bulk Actions Handlers
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to bulk delete ${count} selected product(s)?`)) return;
    setBulkActionLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/products/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: Array.from(selectedIds) })
      });
      if (res.ok) {
        setFeedbackMessage({ type: "success", text: `Successfully deleted ${count} product(s).` });
        setSelectedIds(new Set());
        fetchProducts();
      }
    } catch (e) {
      setFeedbackMessage({ type: "error", text: "Bulk delete failed." });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkArchive = async (targetStatus: "ARCHIVED" | "VERIFIED") => {
    const count = selectedIds.size;
    setBulkActionLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/products/bulk-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: Array.from(selectedIds), status: targetStatus })
      });
      if (res.ok) {
        setFeedbackMessage({ type: "success", text: `Successfully updated ${count} product(s) to ${targetStatus}.` });
        setSelectedIds(new Set());
        fetchProducts();
      }
    } catch (e) {
      setFeedbackMessage({ type: "error", text: "Bulk archive failed." });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkPublish = async () => {
    const count = selectedIds.size;
    setBulkActionLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/products/bulk-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: Array.from(selectedIds) })
      });
      if (res.ok) {
        setFeedbackMessage({ type: "success", text: `Successfully published ${count} product(s) to commerce channels.` });
        setSelectedIds(new Set());
        fetchProducts();
      }
    } catch (e) {
      setFeedbackMessage({ type: "error", text: "Bulk publish failed." });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExport = (format: "csv" | "json") => {
    window.open(`http://localhost:8000/api/catalog/export?format=${format}`, "_blank");
  };

  const filterTabs = [
    { id: "all", label: "All Products" },
    { id: "active", label: "Active" },
    { id: "review", label: "Needs Review" },
    { id: "published", label: "Published" },
    { id: "archived", label: "Archived" }
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-[#263449] p-6 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#60A5FA]/30 to-transparent"></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider">CATALOG PERSISTENCE & GOVERNANCE</span>
              <span className="text-[10px] bg-[#3B82F6]/10 text-[#60A5FA] px-2 py-0.5 rounded border border-[#3B82F6]/30 font-bold">SQLITE</span>
            </div>
            <h1 className="text-xl font-extrabold text-[#F3F6FA] tracking-tight">
              Products Catalog Workspace
            </h1>
            <p className="text-xs text-[#A8B3C2] mt-1">
              Enterprise management, bulk operations, status lifecycle, and multi-format dataset export.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchProducts}
              className="p-2 border border-[#263449] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-lg text-xs font-semibold"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-4 h-4 text-[#667085] ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="px-3 py-2 border border-[#263449] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-lg text-xs font-semibold flex items-center gap-1.5"
              title="Download CSV Catalog"
            >
              <Download className="w-3.5 h-3.5 text-[#22C55E]" /> Export CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className="px-3 py-2 border border-[#263449] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-lg text-xs font-semibold flex items-center gap-1.5"
              title="Download JSON Catalog"
            >
              <Download className="w-3.5 h-3.5 text-[#3B82F6]" /> Export JSON
            </button>
            <Link
              href="/ingestion"
              className="px-3.5 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" /> Import Data
            </Link>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMessage && (
          <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
            feedbackMessage.type === "success" ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30" : "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
          }`}>
            <span>{feedbackMessage.text}</span>
            <button onClick={() => setFeedbackMessage(null)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Filter Tabs & Search Toolbar */}
        <div className="space-y-4">
          <div className="flex border-b border-[#263449] gap-4 text-xs font-semibold">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 border-b-2 uppercase tracking-wider transition-colors ${
                  activeTab === tab.id
                    ? "border-[#3B82F6] text-[#60A5FA]"
                    : "border-transparent text-[#A8B3C2] hover:text-[#F3F6FA]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-[#111827] border border-[#263449] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product name, SKU, manufacturer..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#070B12] border border-[#263449] rounded-lg focus:outline-none focus:border-[#3B82F6] text-[#F3F6FA]"
              />
            </div>

            <div className="text-xs text-[#A8B3C2] flex items-center gap-3">
              <span>{filteredProducts.length} Product(s) Found</span>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (Visible when 1+ selected) */}
        {selectedIds.size > 0 && (
          <div className="p-4 bg-[#172033] border border-[#3B82F6]/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F3F6FA]">
              <span className="w-5 h-5 bg-[#3B82F6] text-white rounded-full flex items-center justify-center text-[10px]">
                {selectedIds.size}
              </span>
              <span>Product(s) Selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleBulkPublish}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-md text-xs transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Bulk Publish
              </button>
              <button
                onClick={() => handleBulkArchive("ARCHIVED")}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold rounded-md text-xs transition-all flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" /> Bulk Archive
              </button>
              <button
                onClick={() => handleBulkArchive("VERIFIED")}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 border border-[#263449] hover:bg-[#070B12] text-[#A8B3C2] hover:text-[#F3F6FA] font-bold rounded-md text-xs transition-all"
              >
                Restore Active
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold rounded-md text-xs transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
              </button>
            </div>
          </div>
        )}

        {/* Enterprise Data Table */}
        <div className="bg-[#111827] border border-[#263449] rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#667085]">Loading product records from SQLite database...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Box className="w-10 h-10 text-[#667085] mx-auto" />
              <p className="font-bold text-sm text-[#F3F6FA]">No products match this view</p>
              <p className="text-xs text-[#667085] max-w-sm mx-auto">
                {activeTab === "all"
                  ? "Your catalog database is clean. Import technical documents or CSV files to get started."
                  : `There are currently no products with status "${activeTab}".`}
              </p>
              <Link
                href="/ingestion"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" /> Import Catalog
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#0C1220] text-[#A8B3C2] border-b border-[#263449]">
                    <th className="px-4 py-3.5 w-10 text-center">
                      <button onClick={handleSelectAll} className="p-1 text-[#667085] hover:text-[#F3F6FA]">
                        {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#3B82F6]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-5 py-3.5 font-bold">PRODUCT & SKU</th>
                    <th className="px-5 py-3.5 font-bold">MANUFACTURER</th>
                    <th className="px-5 py-3.5 font-bold">CATEGORY</th>
                    <th className="px-5 py-3.5 font-bold text-center">QUALITY SCORE</th>
                    <th className="px-5 py-3.5 font-bold">STATUS</th>
                    <th className="px-5 py-3.5 font-bold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263449]">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedIds.has(p.id);
                    return (
                      <tr 
                        key={p.id} 
                        className={`transition-colors ${isSelected ? "bg-[#3B82F6]/10" : "hover:bg-[#172033]"}`}
                      >
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => handleToggleSelect(p.id)} className="p-1 text-[#667085] hover:text-[#F3F6FA]">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#3B82F6]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-5 py-4 font-bold text-[#F3F6FA]">
                          <Link href={`/products/${p.id}`} className="hover:text-[#60A5FA] transition-colors">
                            {p.name}
                          </Link>
                          <span className="block text-[11px] font-mono text-[#A8B3C2] font-normal mt-0.5">
                            SKU: {p.sku}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#A8B3C2]">
                          <span className="px-2 py-1 bg-[#070B12] rounded border border-[#263449] font-medium text-[11px]">
                            {p.manufacturer || "Unspecified"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#A8B3C2]">
                          {p.category || "General"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/30">
                            {p.quality_score}%
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={p.status || "VERIFIED"} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/products/${p.id}`}
                              className="px-2.5 py-1.5 bg-[#070B12] hover:bg-[#172033] border border-[#263449] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-md text-xs font-semibold transition-all inline-flex items-center gap-1"
                              title="Inspect Workspace"
                            >
                              <Eye className="w-3.5 h-3.5" /> Workspace
                            </Link>

                            <button
                              onClick={() => handleToggleArchive(p.id)}
                              className="p-1.5 border border-[#263449] hover:bg-[#172033] text-[#A8B3C2] hover:text-[#F3F6FA] rounded-md transition-all"
                              title={p.status === "ARCHIVED" ? "Restore to Active" : "Archive Product"}
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 border border-[#263449] hover:bg-[#EF4444]/20 text-[#667085] hover:text-[#EF4444] rounded-md transition-all"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div className="px-5 py-3.5 bg-[#0C1220] border-t border-[#263449] flex items-center justify-between text-xs text-[#667085]">
            <span>Showing {filteredProducts.length} product(s)</span>
            <span>Local Database: backend/nexus_pi.db</span>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-[#A8B3C2]">Loading catalog workspace...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
