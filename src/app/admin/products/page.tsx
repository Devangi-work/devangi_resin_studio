"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Copy,
  Edit,
  Trash2,
  Archive,
  Eye,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);
      const prodsData = await prodsRes.json();
      const catsData = await catsRes.json();

      setProducts(prodsData.products || []);
      setCategories(catsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered list
  const filteredProducts = products.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Duplicate Product
  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        setActionMessage("Product duplicated as draft!");
        loadData();
      }
    } catch {
      alert("Failed to duplicate product.");
    }
  };

  // Delete / Archive Product
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete/archive "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || "Product removed successfully!");
        loadData();
      }
    } catch {
      alert("Failed to delete product.");
    }
  };

  // Bulk Status Update
  const handleBulkStatus = async (status: "published" | "draft" | "archived") => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status }),
      });
      if (res.ok) {
        setActionMessage(`Updated ${selectedIds.length} products to ${status}!`);
        setSelectedIds([]);
        loadData();
      }
    } catch {
      alert("Bulk update failed.");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Product Catalogue Management
          </h1>
          <p className="text-xs text-[#736C66]">
            Create, edit, duplicate, and publish handmade resin art inventory.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="px-4 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 hover:bg-[#3D473E] shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {actionMessage && (
        <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32] flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage("")} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Bulk Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8C7A72] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#736C66] font-medium">
              {selectedIds.length} selected:
            </span>
            <button
              onClick={() => handleBulkStatus("published")}
              className="px-2.5 py-1.5 text-[11px] font-semibold bg-[#E8EFE8] text-[#2E7D32] rounded-lg border border-[#C5D8C5]"
            >
              Publish
            </button>
            <button
              onClick={() => handleBulkStatus("draft")}
              className="px-2.5 py-1.5 text-[11px] font-semibold bg-[#FAF4EC] text-[#B8972E] rounded-lg border border-[#E8E0D5]"
            >
              Unpublish
            </button>
            <button
              onClick={() => handleBulkStatus("archived")}
              className="px-2.5 py-1.5 text-[11px] font-semibold bg-[#FDF2F2] text-[#DF4C4C] rounded-lg border border-[#FADBD8]"
            >
              Archive
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#736C66] border-b border-[#E8E0D5]">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredProducts.length > 0 &&
                      selectedIds.length === filteredProducts.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-[#2C332D]"
                  />
                </th>
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Price</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EBE6] text-[#2C332D]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#736C66]">
                    Loading catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#736C66]">
                    No products matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const catName = categories.find((c) => c.id === p.categoryId)?.name || "—";
                  const primaryImg = p.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800";

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded text-[#2C332D]"
                        />
                      </td>

                      {/* Product Thumbnail + Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={primaryImg}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[#E8E0D5] flex-shrink-0"
                          />
                          <div>
                            <Link
                              href={`/admin/products/${p.id}/edit`}
                              className="font-bold hover:text-[#B8972E] line-clamp-1"
                            >
                              {p.name}
                            </Link>
                            {p.isFeatured && (
                              <span className="text-[9px] uppercase font-bold text-[#D4AF37] bg-[#2C332D] px-1.5 py-0.2 rounded mr-1">
                                Featured
                              </span>
                            )}
                            {p.isBestseller && (
                              <span className="text-[9px] uppercase font-bold text-[#2E7D32] bg-[#E8EFE8] px-1.5 py-0.2 rounded">
                                Bestseller
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#736C66]">{p.sku}</td>
                      <td className="py-3 px-4 text-[#736C66]">{catName}</td>
                      
                      {/* Price */}
                      <td className="py-3 px-4 font-bold">
                        ₹{Number(p.salePrice || p.regularPrice).toFixed(2)}
                        {p.salePrice && (
                          <span className="text-[10px] text-[#A69E96] line-through block font-normal">
                            ₹{Number(p.regularPrice).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            p.stockQuantity <= p.lowStockThreshold && p.trackInventory
                              ? "text-[#DF4C4C]"
                              : "text-[#2C332D]"
                          }`}
                        >
                          {p.trackInventory ? p.stockQuantity : "Unlimited"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            p.status === "published"
                              ? "bg-[#E8EFE8] text-[#2E7D32]"
                              : p.status === "draft"
                              ? "bg-[#FAF4EC] text-[#B8972E]"
                              : "bg-[#F4EBE6] text-[#736C66]"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/shop/${p.slug}`}
                            target="_blank"
                            className="p-1 text-[#736C66] hover:text-[#2C332D]"
                            title="View on Storefront"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="p-1 text-[#736C66] hover:text-[#2C332D]"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p.id)}
                            className="p-1 text-[#736C66] hover:text-[#B8972E]"
                            title="Duplicate Product"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1 text-[#736C66] hover:text-[#DF4C4C]"
                            title="Delete or Archive Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
