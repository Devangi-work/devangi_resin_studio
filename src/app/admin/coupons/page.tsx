"use client";

import React, { useState, useEffect } from "react";
import { Plus, Tag, Trash2, Edit, CheckCircle2, AlertCircle, X } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
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
    applicableCategoryId: "",
    applicableProductId: "",
    applicableProductIds: [] as string[],
  });

  const [productSearch, setProductSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const [coupRes, catRes, prodRes] = await Promise.all([
        fetch("/api/admin/coupons"),
        fetch("/api/categories"),
        fetch("/api/admin/products"),
      ]);
      const [coupData, catData, prodData] = await Promise.all([
        coupRes.json(),
        catRes.json(),
        prodRes.json(),
      ]);
      setCoupons(coupData || []);
      setCategories(catData || []);
      setProducts(prodData?.products || prodData || []);
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
    setProductSearch("");
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: "10.00",
      minCartAmount: "499.00",
      maxDiscount: "300.00",
      maxRedemptions: 100,
      isActive: true,
      applicableCategoryId: "",
      applicableProductId: "",
      applicableProductIds: [],
    });
    setIsOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setProductSearch("");
    const productIds: string[] = Array.isArray(c.applicableProductIds) && c.applicableProductIds.length > 0
      ? c.applicableProductIds
      : (c.applicableProductId ? [c.applicableProductId] : []);

    setFormData({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minCartAmount: c.minCartAmount !== undefined && c.minCartAmount !== null ? String(c.minCartAmount) : "0.00",
      maxDiscount: c.maxDiscount || "",
      maxRedemptions: c.maxRedemptions || 100,
      isActive: c.isActive,
      applicableCategoryId: c.applicableCategoryId || "",
      applicableProductId: productIds[0] || "",
      applicableProductIds: productIds,
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const endpoint = editingId ? `/api/admin/coupons/${encodeURIComponent(editingId)}` : "/api/admin/coupons";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...formData,
        minCartAmount: formData.minCartAmount ? Number(formData.minCartAmount) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        applicableProductId: formData.applicableProductIds.length === 1 ? formData.applicableProductIds[0] : null,
        applicableProductIds: formData.applicableProductIds,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === coupons.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(coupons.map((c) => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (
      !confirm(
        `Are you sure you want to permanently delete these ${count} selected coupon${count > 1 ? "s" : ""
        }?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/coupons/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Successfully deleted ${count} coupon${count > 1 ? "s" : ""}!`);
        setSelectedIds([]);
        loadCoupons();
      } else {
        alert(data.error || "Failed to delete selected coupons.");
      }
    } catch {
      alert("Failed to delete selected coupons.");
    } finally {
      setIsDeleting(false);
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

      {/* Bulk Action Controls Bar */}
      {coupons.length > 0 && (
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E0D5] shadow-xs flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center space-x-2 text-xs font-medium text-[#2C332D] cursor-pointer">
            <input
              type="checkbox"
              checked={coupons.length > 0 && selectedIds.length === coupons.length}
              onChange={toggleSelectAll}
              className="rounded text-[#2C332D]"
            />
            <span>Select All ({coupons.length})</span>
          </label>

          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#736C66] font-medium">
                {selectedIds.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold bg-[#FDF2F2] text-[#DF4C4C] hover:bg-[#fbdada] rounded-lg border border-[#FADBD8] flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}</span>
              </button>
            </div>
          )}
        </div>
      )}

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
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={coupons.length > 0 && selectedIds.length === coupons.length}
                    onChange={toggleSelectAll}
                    className="rounded text-[#2C332D]"
                  />
                </th>
                <th className="py-3 px-4 font-semibold">Coupon Code</th>
                <th className="py-3 px-4 font-semibold">Discount</th>
                <th className="py-3 px-4 font-semibold">Applies To</th>
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
                  <td colSpan={9} className="py-8 text-center text-[#736C66]">
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#736C66]">
                    No promotional coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="rounded text-[#2C332D]"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-[#2C332D]">
                      {c.code}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {c.discountType === "percentage"
                        ? `${Number(c.discountValue)}% OFF`
                        : `₹${Number(c.discountValue)} OFF`}
                    </td>
                    <td className="py-3 px-4">
                      {Array.isArray(c.applicableProductIds) && c.applicableProductIds.length > 1 ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FFF4E5] text-[#B86200] border border-[#FFE2BA] cursor-help"
                          title={c.applicableProductIds
                            .map((pid: string) => products.find((p) => p.id === pid)?.name || pid)
                            .join("\n")}
                        >
                          {c.applicableProductIds.length} Specific Products
                        </span>
                      ) : (c.applicableProductIds?.length === 1 || c.applicableProductId) ? (
                        (() => {
                          const targetId = c.applicableProductIds?.[0] || c.applicableProductId;
                          const targetName = products.find((p) => p.id === targetId)?.name || "Specific Product";
                          return (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FFF4E5] text-[#B86200] border border-[#FFE2BA] max-w-[170px] truncate"
                              title={targetName}
                            >
                              Product: {targetName}
                            </span>
                          );
                        })()
                      ) : c.applicableCategoryId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EBF3FF] text-[#0052CC] border border-[#CDE1FF]">
                          Category: {categories.find((cat) => cat.id === c.applicableCategoryId)?.name || "Specific Category"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F4F3F0] text-[#736C66]">
                          All Products
                        </span>
                      )}
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
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isActive
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col border border-[#E8E0D5] shadow-2xl my-auto overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#F4EBE6] p-5 sm:p-6 pb-4 shrink-0 bg-[#FAF8F5]/80">
              <h2 className="font-serif text-lg font-bold text-[#2C332D]">
                {editingId ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#736C66] hover:text-[#2C332D] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
                {error && <p className="text-xs text-[#DF4C4C] bg-[#FDF2F2] p-2.5 rounded-lg">{error}</p>}

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
                    <p className="text-[10px] text-[#8C7A72] mt-0.5">
                      Coupon activates only once cart subtotal reaches this amount.
                    </p>
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
                    <p className="text-[10px] text-[#8C7A72] mt-0.5">
                      Leave empty for uncapped percentage discounts.
                    </p>
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

                {/* Product & Category Eligibility */}
                <div className="space-y-3 pt-2 border-t border-[#F4EBE6]">
                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Specific Product Category (Optional)
                    </label>
                    <select
                      value={formData.applicableCategoryId}
                      onChange={(e) =>
                        setFormData({ ...formData, applicableCategoryId: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    >
                      <option value="">All Product Categories (Active for all)</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#8C7A72] mt-0.5">
                      Leave unselected to make this coupon valid across all categories.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#2C332D]">
                        Specific Products (Optional - Select Multiple)
                      </label>
                      <span className="text-[10px] text-[#8C7A72]">
                        {formData.applicableProductIds.length > 0
                          ? `${formData.applicableProductIds.length} selected`
                          : "Active for all"}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8C7A72] mb-1.5">
                      When selected, coupon discount applies strictly to these items once the cart reaches the minimum subtotal above.
                    </p>

                    {/* Filter Search & Quick Actions */}
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      />
                      {formData.applicableProductIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              applicableProductIds: [],
                              applicableProductId: "",
                            })
                          }
                          className="px-2 py-1.5 text-[10px] font-semibold text-[#DF4C4C] hover:bg-rose-50 rounded-lg border border-[#F4D0D8]"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Selected Product Chips */}
                    {formData.applicableProductIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto p-1.5 bg-[#FAF8F5] rounded-lg border border-[#E8E0D5]">
                        {formData.applicableProductIds.map((pid) => {
                          const prod = products.find((p) => p.id === pid);
                          return (
                            <span
                              key={pid}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF4E5] text-[#B86200] border border-[#FFE2BA]"
                            >
                              <span className="max-w-[120px] truncate">{prod?.name || pid}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    applicableProductIds: formData.applicableProductIds.filter(
                                      (id) => id !== pid
                                    ),
                                    applicableProductId:
                                      formData.applicableProductIds.filter((id) => id !== pid)[0] ||
                                      "",
                                  })
                                }
                                className="text-[#B86200] hover:text-red-700 ml-0.5 font-bold"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Scrollable Products List with Checkboxes */}
                    <div className="max-h-44 overflow-y-auto border border-[#E8E0D5] rounded-xl divide-y divide-[#F4EBE6] bg-white">
                      {products
                        .filter((p: any) =>
                          productSearch
                            ? p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                            : true
                        )
                        .map((prod: any) => {
                          const isSelected = formData.applicableProductIds.includes(prod.id);
                          return (
                            <label
                              key={prod.id}
                              className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${isSelected ? "bg-[#FFF9F2]" : "hover:bg-[#FAF8F5]"
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    const updated = isSelected
                                      ? formData.applicableProductIds.filter((id) => id !== prod.id)
                                      : [...formData.applicableProductIds, prod.id];
                                    setFormData({
                                      ...formData,
                                      applicableProductIds: updated,
                                      applicableProductId: updated[0] || "",
                                    });
                                  }}
                                  className="rounded border-[#E8E0D5] text-[#D4AF37] focus:ring-[#D4AF37]"
                                />
                                <div className="min-w-0">
                                  <p className="font-medium text-[#2C332D] truncate">{prod.name}</p>
                                  <p className="text-[10px] text-[#8C7A72]">
                                    {prod.sku ? `SKU: ${prod.sku}` : `ID: ${prod.id.slice(-6)}`}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[11px] font-semibold text-[#736C66] whitespace-nowrap">
                                ₹{Number(prod.salePrice || prod.regularPrice || 0).toFixed(0)}
                              </span>
                            </label>
                          );
                        })}
                    </div>

                    <p className="text-[10px] text-[#8C7A72] mt-1">
                      Leave all unchecked to keep coupon active across all products.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="flex items-center justify-end space-x-2.5 p-4 sm:px-6 border-t border-[#F4EBE6] bg-[#FAF8F5] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66] hover:bg-[#F4EBE6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E] shadow-sm transition-all active:scale-95"
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
