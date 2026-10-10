"use client";

import React, { useState, useEffect } from "react";
import { Plus, Tag, Trash2, Edit, CheckCircle2, AlertCircle, X } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "10.00",
    minCartAmount: "499.00",
    maxDiscount: "300.00",
    maxRedemptions: 100,
    isActive: true,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: "10.00",
      minCartAmount: "499.00",
      maxDiscount: "300.00",
      maxRedemptions: 100,
      isActive: true,
    });
    setIsOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minCartAmount: c.minCartAmount || "0.00",
      maxDiscount: c.maxDiscount || "",
      maxRedemptions: c.maxRedemptions || 100,
      isActive: c.isActive,
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const endpoint = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Coupon saved successfully!");
        setIsOpen(false);
        loadCoupons();
      } else {
        setError(data.error || "Failed to save coupon.");
      }
    } catch {
      setError("Network error occurred.");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("Coupon removed.");
        loadCoupons();
      }
    } catch {
      alert("Delete failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Coupons & Promotional Discounts
          </h1>
          <p className="text-xs text-[#736C66]">
            Create percentage or fixed-amount voucher codes with cart requirements and redemption limits.
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 hover:bg-[#3D473E] shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32]">
          {message}
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#736C66] border-b border-[#E8E0D5]">
              <tr>
                <th className="py-3 px-4 font-semibold">Coupon Code</th>
                <th className="py-3 px-4 font-semibold">Discount</th>
                <th className="py-3 px-4 font-semibold">Min. Cart</th>
                <th className="py-3 px-4 font-semibold">Max. Discount</th>
                <th className="py-3 px-4 font-semibold">Redemptions</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EBE6] text-[#2C332D]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#736C66]">
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#736C66]">
                    No promotional coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sm text-[#2C332D]">
                      {c.code}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {c.discountType === "percentage"
                        ? `${Number(c.discountValue)}% OFF`
                        : `₹${Number(c.discountValue)} OFF`}
                    </td>
                    <td className="py-3 px-4 text-[#736C66]">₹{c.minCartAmount}</td>
                    <td className="py-3 px-4 text-[#736C66]">
                      {c.maxDiscount ? `₹${c.maxDiscount}` : "Unlimited"}
                    </td>
                    <td className="py-3 px-4 text-[#736C66]">
                      {c.currentRedemptions} / {c.maxRedemptions || "∞"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive
                            ? "bg-[#E8EFE8] text-[#2E7D32]"
                            : "bg-[#F4EBE6] text-[#736C66]"
                        }`}
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="px-2.5 py-1 bg-white border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-lg hover:bg-[#FAF8F5]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          className="p-1 text-[#DF4C4C] hover:bg-[#FDF2F2] rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-[#E8E0D5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
              <h2 className="font-serif text-lg font-bold text-[#2C332D]">
                {editingId ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-1 text-[#736C66]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <p className="text-xs text-[#DF4C4C] bg-[#FDF2F2] p-2.5 rounded-lg">{error}</p>}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Min Cart Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minCartAmount}
                    onChange={(e) => setFormData({ ...formData, minCartAmount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Max Cap Discount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="act"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-[#2C332D]"
                />
                <label htmlFor="act" className="text-xs font-semibold text-[#2C332D] cursor-pointer">
                  Coupon Is Active & Usable at Checkout
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-[#F4EBE6]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E]"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
