"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  X,
  Sliders,
  RefreshCw,
  PackageCheck,
  PackageX,
  Sparkles,
} from "lucide-react";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "low" | "out">("all");

  // Adjustment Modal
  const [modalItem, setModalItem] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<"adjust" | "exact" | "settings">("adjust");
  const [changeAmount, setChangeAmount] = useState<number>(5);
  const [exactQuantity, setExactQuantity] = useState<number>(0);
  const [trackInventory, setTrackInventory] = useState<boolean>(true);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(3);
  const [allowBackorders, setAllowBackorders] = useState<boolean>(false);
  const [reason, setReason] = useState("Restock Studio Batch");
  const [submitting, setSubmitting] = useState(false);
  const [quickUpdatingId, setQuickUpdatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openModal = (item: any, defaultTab: "adjust" | "exact" | "settings" = "adjust") => {
    setModalItem(item);
    setModalTab(defaultTab);
    setChangeAmount(5);
    setExactQuantity(item.stockQuantity || 0);
    setTrackInventory(Boolean(item.trackInventory));
    setLowStockThreshold(Number(item.lowStockThreshold) || 3);
    setAllowBackorders(Boolean(item.allowBackorders));
    setReason("Restock Studio Batch");
  };

  const handleQuickAdd = async (item: any, amount: number) => {
    setQuickUpdatingId(item.id);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.id,
          changeAmount: amount,
          reason: `Quick Restock (+${amount} units)`,
        }),
      });
      if (res.ok) {
        setSuccessMsg(`Added +${amount} units to "${item.name}"`);
        loadInventory();
      } else {
        alert("Failed to update stock");
      }
    } catch {
      alert("Network error updating stock");
    } finally {
      setQuickUpdatingId(null);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem) return;
    setSubmitting(true);
    setSuccessMsg("");

    try {
      let res;
      if (modalTab === "adjust") {
        res = await fetch("/api/admin/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: modalItem.id,
            changeAmount: Number(changeAmount),
            reason,
          }),
        });
      } else if (modalTab === "exact") {
        res = await fetch("/api/admin/inventory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: modalItem.id,
            stockQuantity: Number(exactQuantity),
            reason: reason || "Exact Stock Quantity Set",
          }),
        });
      } else {
        res = await fetch("/api/admin/inventory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: modalItem.id,
            trackInventory,
            lowStockThreshold: Number(lowStockThreshold),
            allowBackorders,
          }),
        });
      }

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Inventory updated successfully for "${modalItem.name}"!`);
        setModalItem(null);
        loadInventory();
      } else {
        alert(data.error || "Update failed.");
      }
    } catch {
      alert("Error saving inventory changes.");
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalItems = inventory.length;
  const lowStockCount = inventory.filter((i) => i.isLowStock).length;
  const outOfStockCount = inventory.filter((i) => i.isOutOfStock).length;
  const inStockCount = inventory.filter((i) => i.trackInventory && !i.isLowStock && !i.isOutOfStock).length;

  const filteredItems = inventory.filter((item) => {
    if (stockFilter === "low" && !item.isLowStock) return false;
    if (stockFilter === "out" && !item.isOutOfStock) return false;
    if (stockFilter === "in" && (item.isOutOfStock || item.isLowStock || !item.trackInventory)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Inventory &amp; Stock Management
          </h1>
          <p className="text-xs text-[#736C66]">
            Live product quantities, inventory tracking, thresholds, and instant batch restocking.
          </p>
        </div>

        <button
          onClick={loadInventory}
          className="px-3.5 py-2 bg-white border border-[#E8E0D5] hover:border-[#D4AF37] text-[#2C332D] text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32] flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
            <span>{successMsg}</span>
          </span>
          <button onClick={() => setSuccessMsg("")} className="text-[#2E7D32] hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#2C332D] flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5 text-[#8C6E79]" />
          </div>
          <div>
            <p className="text-[11px] text-[#736C66] font-medium uppercase tracking-wider">
              Total Products
            </p>
            <p className="font-serif text-xl font-bold text-[#2C332D]">{totalItems}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E8EFE8] text-[#2E7D32] flex items-center justify-center shrink-0">
            <PackageCheck className="w-5 h-5 text-[#2E7D32]" />
          </div>
          <div>
            <p className="text-[11px] text-[#736C66] font-medium uppercase tracking-wider">
              Healthy Stock
            </p>
            <p className="font-serif text-xl font-bold text-[#2E7D32]">{inStockCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#D97706]" />
          </div>
          <div>
            <p className="text-[11px] text-[#736C66] font-medium uppercase tracking-wider">
              Low Stock Alert
            </p>
            <p className="font-serif text-xl font-bold text-[#D97706]">{lowStockCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] text-[#DF4C4C] flex items-center justify-center shrink-0">
            <PackageX className="w-5 h-5 text-[#DF4C4C]" />
          </div>
          <div>
            <p className="text-[11px] text-[#736C66] font-medium uppercase tracking-wider">
              Out of Stock
            </p>
            <p className="font-serif text-xl font-bold text-[#DF4C4C]">{outOfStockCount}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#8C7A72] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStockFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              stockFilter === "all"
                ? "bg-[#2C332D] text-white"
                : "bg-[#FAF8F5] text-[#736C66] hover:bg-[#F4EBE6]"
            }`}
          >
            All Items ({inventory.length})
          </button>
          <button
            onClick={() => setStockFilter("in")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              stockFilter === "in"
                ? "bg-[#2E7D32] text-white"
                : "bg-[#FAF8F5] text-[#2E7D32] hover:bg-[#E8EFE8]"
            }`}
          >
            In Stock ({inStockCount})
          </button>
          <button
            onClick={() => setStockFilter("low")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              stockFilter === "low"
                ? "bg-[#D97706] text-white"
                : "bg-[#FAF8F5] text-[#D97706] hover:bg-[#FEF3C7]"
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setStockFilter("out")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              stockFilter === "out"
                ? "bg-[#DF4C4C] text-white"
                : "bg-[#FAF8F5] text-[#DF4C4C] hover:bg-[#FDF2F2]"
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#736C66] border-b border-[#E8E0D5]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Product</th>
                <th className="py-3.5 px-4 font-semibold">SKU</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Tracking</th>
                <th className="py-3.5 px-4 font-semibold">Stock Level</th>
                <th className="py-3.5 px-4 font-semibold">Threshold</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EBE6] text-[#2C332D]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#736C66]">
                    Loading stock levels...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#736C66]">
                    No inventory products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const imgUrl = item.images?.[0]?.imageUrl || "/images/logo/resin_logo.png";
                  const isQuickUpdating = quickUpdatingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      {/* Product Thumbnail + Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={imgUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[#E8E0D5] bg-[#FAF8F5] shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-[#2C332D] truncate max-w-[220px] sm:max-w-xs">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-[#8C6E79]">
                              ₹{Number(item.salePrice || item.regularPrice || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-[#736C66] text-[11px]">
                        {item.sku || "—"}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-[#736C66]">
                        {item.category || "Uncategorized"}
                      </td>

                      {/* Tracking Toggle Status */}
                      <td className="py-3 px-4">
                        {item.trackInventory ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8EFE8] text-[#2E7D32]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                            <span>Tracked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAF8F5] text-[#8C7A72] border border-[#E8E0D5]">
                            <span>Unlimited</span>
                          </span>
                        )}
                      </td>

                      {/* Current Stock Level Badge */}
                      <td className="py-3 px-4 font-bold">
                        {item.trackInventory ? (
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                item.isOutOfStock
                                  ? "bg-[#FDF2F2] text-[#DF4C4C] border border-[#DF4C4C]/30"
                                  : item.isLowStock
                                  ? "bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30"
                                  : "bg-[#E8EFE8] text-[#2E7D32] border border-[#2E7D32]/30"
                              }`}
                            >
                              {item.stockQuantity} units
                            </span>
                            <span className="text-[10px] text-[#8C7A72] font-normal">
                              {item.isOutOfStock
                                ? "(Out)"
                                : item.isLowStock
                                ? "(Low)"
                                : "(In Stock)"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#8C7A72] text-[11px] font-normal">—</span>
                        )}
                      </td>

                      {/* Low Stock Alert Threshold */}
                      <td className="py-3 px-4 text-[#736C66]">
                        {item.trackInventory ? `${item.lowStockThreshold} units` : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick +5 Restock Button */}
                          <button
                            type="button"
                            disabled={isQuickUpdating}
                            onClick={() => handleQuickAdd(item, 5)}
                            className="px-2 py-1 bg-white border border-[#E8E0D5] hover:border-[#D4AF37] hover:bg-[#FAF0F3] text-[#2C332D] text-[10px] font-bold rounded-lg transition-all active:scale-95"
                            title="Quick add 5 units"
                          >
                            +5
                          </button>

                          {/* Quick +10 Restock Button */}
                          <button
                            type="button"
                            disabled={isQuickUpdating}
                            onClick={() => handleQuickAdd(item, 10)}
                            className="px-2 py-1 bg-white border border-[#E8E0D5] hover:border-[#D4AF37] hover:bg-[#FAF0F3] text-[#2C332D] text-[10px] font-bold rounded-lg transition-all active:scale-95"
                            title="Quick add 10 units"
                          >
                            +10
                          </button>

                          {/* Full Adjust / Manage Modal */}
                          <button
                            type="button"
                            onClick={() => openModal(item, "adjust")}
                            className="px-3 py-1 bg-[#2C332D] hover:bg-[#3D473E] text-white text-[11px] font-semibold rounded-lg transition-all active:scale-95"
                          >
                            Manage Stock
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

      {/* Comprehensive Stock Adjustment & Settings Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-[#E8E0D5] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#2C332D]">
                  Manage Stock
                </h2>
                <p className="text-xs text-[#736C66] line-clamp-1">{modalItem.name}</p>
              </div>
              <button
                onClick={() => setModalItem(null)}
                className="p-1 rounded-full text-[#736C66] hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Stock Banner */}
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E0D5] text-xs flex items-center justify-between">
              <span className="text-[#736C66]">Current Physical Quantity:</span>
              <strong className="text-[#2C332D] text-sm">
                {modalItem.trackInventory ? `${modalItem.stockQuantity} units` : "Unlimited (Not Tracked)"}
              </strong>
            </div>

            {/* Navigation Tabs inside modal */}
            <div className="flex border-b border-[#E8E0D5] text-xs">
              <button
                type="button"
                onClick={() => setModalTab("adjust")}
                className={`flex-1 py-2 font-semibold text-center border-b-2 transition-all ${
                  modalTab === "adjust"
                    ? "border-[#D4AF37] text-[#2C332D]"
                    : "border-transparent text-[#736C66] hover:text-[#2C332D]"
                }`}
              >
                Quick Adjust (+/-)
              </button>
              <button
                type="button"
                onClick={() => setModalTab("exact")}
                className={`flex-1 py-2 font-semibold text-center border-b-2 transition-all ${
                  modalTab === "exact"
                    ? "border-[#D4AF37] text-[#2C332D]"
                    : "border-transparent text-[#736C66] hover:text-[#2C332D]"
                }`}
              >
                Set Exact Quantity
              </button>
              <button
                type="button"
                onClick={() => setModalTab("settings")}
                className={`flex-1 py-2 font-semibold text-center border-b-2 transition-all ${
                  modalTab === "settings"
                    ? "border-[#D4AF37] text-[#2C332D]"
                    : "border-transparent text-[#736C66] hover:text-[#2C332D]"
                }`}
              >
                Tracking &amp; Alerts
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {modalTab === "adjust" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Quantity Adjustment (positive to add, negative to remove) *
                    </label>
                    <input
                      type="number"
                      required
                      value={changeAmount}
                      onChange={(e) => setChangeAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                    <p className="text-[11px] text-[#736C66] mt-1.5 flex items-center justify-between">
                      <span>Resulting stock:</span>
                      <strong className="text-sm text-[#2C332D]">
                        {Math.max(0, modalItem.stockQuantity + Number(changeAmount))} units
                      </strong>
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Adjustment Reason *
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
                    >
                      <option>Restock Studio Batch</option>
                      <option>Defective Curing / Bubble Flaw</option>
                      <option>Physical Inventory Audit Correction</option>
                      <option>Order Return Restock</option>
                      <option>Studio Demonstration / Display Sample</option>
                      <option>Damaged in Transit</option>
                    </select>
                  </div>
                </>
              )}

              {modalTab === "exact" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Set New Exact Quantity in Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={exactQuantity}
                      onChange={(e) => setExactQuantity(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                    <p className="text-[11px] text-[#736C66] mt-1.5">
                      Directly overrides current stock ({modalItem.stockQuantity} units) with exact counted physical inventory.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Update Note / Reason
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Physical inventory count verified"
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                    />
                  </div>
                </>
              )}

              {modalTab === "settings" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E0D5]">
                    <div>
                      <p className="text-xs font-semibold text-[#2C332D]">Track Inventory</p>
                      <p className="text-[10px] text-[#736C66]">
                        Enforce stock limits and prevent ordering when depleted
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trackInventory}
                        onChange={(e) => setTrackInventory(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2C332D]"></div>
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                    />
                    <p className="text-[11px] text-[#736C66] mt-1">
                      Triggers amber &quot;Low Stock&quot; indicator when quantity reaches or drops below this number.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E0D5]">
                    <div>
                      <p className="text-xs font-semibold text-[#2C332D]">Allow Backorders</p>
                      <p className="text-[10px] text-[#736C66]">
                        Allow customers to purchase even when stock reaches 0
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowBackorders}
                        onChange={(e) => setAllowBackorders(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2C332D]"></div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#F4EBE6]">
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#2C332D] hover:bg-[#3D473E] text-white text-xs font-semibold rounded-xl transition-all"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
