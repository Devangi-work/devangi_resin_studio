"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  History,
  CheckCircle2,
  X,
} from "lucide-react";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");

  // Adjustment Modal
  const [adjustItem, setAdjustItem] = useState<any | null>(null);
  const [changeAmount, setChangeAmount] = useState<number>(5);
  const [reason, setReason] = useState("Restock Studio Batch");
  const [adjusting, setAdjusting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      setInventory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredItems = inventory.filter((item) => {
    if (stockFilter === "low" && !item.isLowStock) return false;
    if (stockFilter === "out" && !item.isOutOfStock) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    setAdjusting(true);
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustItem.id,
          changeAmount: Number(changeAmount),
          reason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Stock adjusted for "${adjustItem.name}"!`);
        setAdjustItem(null);
        loadInventory();
      } else {
        alert(data.error || "Adjustment failed.");
      }
    } catch {
      alert("Error submitting adjustment.");
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
          Inventory & Stock Management
        </h1>
        <p className="text-xs text-[#736C66]">
          Track physical resin supplies, audit movement histories, and restock variants.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32]">
          {successMsg}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#8C7A72] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>

        <div className="flex items-center space-x-2">
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
            onClick={() => setStockFilter("low")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              stockFilter === "low"
                ? "bg-[#D97706] text-white"
                : "bg-[#FAF8F5] text-[#D97706] hover:bg-[#FEF3C7]"
            }`}
          >
            Low Stock ({inventory.filter((i) => i.isLowStock).length})
          </button>
          <button
            onClick={() => setStockFilter("out")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              stockFilter === "out"
                ? "bg-[#DF4C4C] text-white"
                : "bg-[#FAF8F5] text-[#DF4C4C] hover:bg-[#FDF2F2]"
            }`}
          >
            Out of Stock ({inventory.filter((i) => i.isOutOfStock).length})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#736C66] border-b border-[#E8E0D5]">
              <tr>
                <th className="py-3 px-4 font-semibold">Product Name</th>
                <th className="py-3 px-4 font-semibold">SKU</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Tracking</th>
                <th className="py-3 px-4 font-semibold">Current Stock</th>
                <th className="py-3 px-4 font-semibold">Threshold</th>
                <th className="py-3 px-4 font-semibold text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EBE6] text-[#2C332D]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#736C66]">
                    Loading stock levels...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#736C66]">
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 font-bold">{item.name}</td>
                    <td className="py-3 px-4 font-mono text-[#736C66]">{item.sku}</td>
                    <td className="py-3 px-4 text-[#736C66]">{item.category}</td>
                    <td className="py-3 px-4">
                      {item.trackInventory ? (
                        <span className="text-[#2E7D32] font-semibold">Active</span>
                      ) : (
                        <span className="text-[#736C66]">Disabled</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          item.isOutOfStock
                            ? "bg-[#FDF2F2] text-[#DF4C4C]"
                            : item.isLowStock
                            ? "bg-[#FEF3C7] text-[#D97706]"
                            : "text-[#2C332D]"
                        }`}
                      >
                        {item.trackInventory ? item.stockQuantity : "Unlimited"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#736C66]">
                      {item.trackInventory ? item.lowStockThreshold : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setAdjustItem(item);
                          setChangeAmount(5);
                        }}
                        className="px-3 py-1 bg-white border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-lg hover:bg-[#FAF8F5]"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-[#E8E0D5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
              <h2 className="font-serif text-lg font-bold text-[#2C332D]">
                Adjust Stock: {adjustItem.name}
              </h2>
              <button onClick={() => setAdjustItem(null)} className="p-1 text-[#736C66]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E0D5] text-xs flex justify-between">
              <span className="text-[#736C66]">Current Quantity:</span>
              <strong className="text-[#2C332D]">{adjustItem.stockQuantity} units</strong>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Quantity Adjustment (positive to add, negative to subtract) *
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    required
                    value={changeAmount}
                    onChange={(e) => setChangeAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <p className="text-[11px] text-[#736C66] mt-1">
                  New resulting quantity:{" "}
                  <strong>{Math.max(0, adjustItem.stockQuantity + Number(changeAmount))}</strong>
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
                  <option>Defective / Curing Flaw</option>
                  <option>Physical Inventory Audit Correction</option>
                  <option>Order Cancellation Return</option>
                  <option>Studio Demonstration Sample</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#F4EBE6]">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E]"
                >
                  {adjusting ? "Updating..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
