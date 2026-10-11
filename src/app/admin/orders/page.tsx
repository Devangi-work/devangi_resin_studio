"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  X,
  Plus,
  ShoppingBag,
  ExternalLink,
  Store,
  DollarSign,
  Tag,
  Camera,
  Image as ImageIcon,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Update Status Form
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("Delhivery");
  const [internalNotes, setInternalNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  // Offline / Manual Order Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createError, setCreateError] = useState("");

  const [offlineForm, setOfflineForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddressLine1: "Studio Pick-up / Walk-in",
    shippingAddressLine2: "",
    shippingCity: "Mumbai",
    shippingState: "Maharashtra",
    shippingPostalCode: "400001",
    orderSource: "offline" as "offline" | "exhibition" | "instagram" | "custom",
    paymentMethod: "cash" as "cash" | "upi" | "card" | "bank_transfer",
    paymentStatus: "paid" as "paid" | "unpaid",
    orderStatus: "confirmed" as "confirmed" | "processing" | "ready_to_ship" | "delivered",
    items: [
      { productName: "Handmade Resin Ocean Coasters (Set of 4)", quantity: 1, unitPrice: 799 },
    ],
    discountAmount: 0,
    shippingCharge: 0,
    orderNotes: "",
    internalNotes: "",
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.orderStatus !== statusFilter) return false;
    if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;
    if (sourceFilter !== "all") {
      const src = o.orderSource || "online";
      if (sourceFilter === "offline" && src === "online") return false;
      if (sourceFilter === "online" && src !== "online") return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerEmail?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q)
      );
    }
    return true;
  });

  const openOrderModal = (ord: any) => {
    setSelectedOrder(ord);
    setNewStatus(ord.orderStatus);
    setNewPaymentStatus(ord.paymentStatus);
    setTrackingNumber(ord.trackingNumber || "");
    setCourierName(ord.courierName || "Delhivery");
    setInternalNotes("");
    setUpdateMsg("");
  };

  // Quick Payment Status Toggle (paid <-> unpaid)
  const handleTogglePayment = async (ord: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = ord.paymentStatus === "paid" ? "unpaid" : "paid";
    try {
      const res = await fetch(`/api/admin/orders/${ord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === ord.id ? { ...o, paymentStatus: nextStatus } : o))
        );
        if (selectedOrder?.id === ord.id) {
          setSelectedOrder((prev: any) => (prev ? { ...prev, paymentStatus: nextStatus } : prev));
          setNewPaymentStatus(nextStatus);
        }
      }
    } catch (err) {
      console.error("Toggle payment error:", err);
    }
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    setUpdateMsg("");

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: newStatus,
          paymentStatus: newPaymentStatus,
          trackingNumber: trackingNumber.trim() || undefined,
          courierName: courierName.trim() || undefined,
          internalNotes: internalNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setUpdateMsg("Order updated successfully!");
        setSelectedOrder(data.order);
        loadOrders();
      } else {
        alert(data.error || "Update failed.");
      }
    } catch {
      alert("Error updating order.");
    } finally {
      setUpdating(false);
    }
  };

  // Add Item to Offline Order Form
  const handleAddOfflineItem = () => {
    setOfflineForm((prev) => ({
      ...prev,
      items: [...prev.items, { productName: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const handleRemoveOfflineItem = (idx: number) => {
    setOfflineForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleOfflineItemChange = (idx: number, field: string, val: any) => {
    setOfflineForm((prev) => {
      const copy = [...prev.items];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, items: copy };
    });
  };

  const calculateOfflineSubtotal = () => {
    return offlineForm.items.reduce((sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0), 0);
  };

  const handleCreateOfflineOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreatingOrder(true);

    try {
      const subtotal = calculateOfflineSubtotal();
      const totalAmount = Math.max(0, subtotal - Number(offlineForm.discountAmount || 0) + Number(offlineForm.shippingCharge || 0));

      const payload = {
        ...offlineForm,
        subtotal,
        totalAmount,
        items: offlineForm.items.map((i) => ({
          productName: i.productName.trim() || "Handmade Resin Artwork",
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.quantity) * Number(i.unitPrice),
        })),
      };

      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create offline order.");
        setCreatingOrder(false);
        return;
      }

      setShowCreateModal(false);
      loadOrders();
    } catch {
      setCreateError("Unexpected error occurred while creating order.");
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Order Management & Fulfilment
          </h1>
          <p className="text-xs text-[#736C66]">
            Track online store sales and offline exhibition / Instagram custom orders in one unified system.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center space-x-2 hover:bg-[#3D473E] shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Offline / Exhibition Order</span>
          </button>

          <a
            href="/api/admin/orders/export"
            download
            className="px-4 py-2.5 bg-white border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-xl flex items-center space-x-2 hover:bg-[#FAF8F5] shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2E7D32]" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#8C7A72] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by order #, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="py-2 px-3 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
        >
          <option value="all">All Sources (Online & Offline)</option>
          <option value="online">Online Web Store</option>
          <option value="offline">Offline / Exhibition / Instagram</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
        >
          <option value="all">All Fulfilment Statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing (Curing)</option>
          <option value="ready_to_ship">Ready to Ship</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="py-2 px-3 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
        >
          <option value="all">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#736C66] border-b border-[#E8E0D5]">
              <tr>
                <th className="py-3 px-4 font-semibold">Order #</th>
                <th className="py-3 px-4 font-semibold">Source</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Total</th>
                <th className="py-3 px-4 font-semibold">Fulfilment Status</th>
                <th className="py-3 px-4 font-semibold">Payment Status (Click to Toggle)</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EBE6] text-[#2C332D]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#736C66]">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#736C66]">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#2C332D]">
                      <div>{o.orderNumber}</div>
                      <span className="text-[10px] font-normal text-[#8C7A72]">
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        o.orderSource && o.orderSource !== "online"
                          ? "bg-[#FAF4EC] text-[#B8972E] border border-[#E8E0D5]"
                          : "bg-[#F0F4F8] text-[#334E68]"
                      }`}>
                        {o.orderSource || "online"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold">{o.customerName}</p>
                      <p className="text-[10px] text-[#736C66]">{o.customerPhone || o.customerEmail}</p>
                    </td>
                    <td className="py-3 px-4 font-bold">₹{o.totalAmount}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF4EC] text-[#B8972E]">
                        {o.orderStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {/* Interactive Toggle for Admin */}
                      <button
                        type="button"
                        onClick={(e) => handleTogglePayment(o, e)}
                        title="Click to toggle Paid / Unpaid"
                        className={`capitalize px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border flex items-center gap-1 ${
                          o.paymentStatus === "paid"
                            ? "bg-[#E8EFE8] text-[#2E7D32] border-[#C5D8C5] hover:bg-[#D5E5D5]"
                            : "bg-[#FDF2F2] text-[#DF4C4C] border-[#FADBD8] hover:bg-[#FBE5E5]"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{o.paymentStatus} (Toggle)</span>
                      </button>
                      {o.paymentScreenshotUrl && (
                        <a
                          href={o.paymentScreenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="View Payment Screenshot"
                          className="mt-1 inline-flex items-center gap-1 text-[9.5px] font-bold text-[#2E7D32] bg-[#E8EFE8] px-2 py-0.5 rounded-full border border-[#C5D8C5] hover:bg-[#D5E5D5]"
                        >
                          <Camera className="w-2.5 h-2.5" />
                          <span>Receipt Attached</span>
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openOrderModal(o)}
                        className="px-3 py-1 bg-white border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-lg hover:bg-[#FAF8F5] shadow-xs"
                      >
                        View & Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Offline Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-[#E8E0D5] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-[#B8972E]">Studio & Sales</span>
                <h2 className="font-serif text-xl font-bold text-[#2C332D]">
                  Create Manual / Offline Order
                </h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-[#736C66] hover:text-[#2C332D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-[#FDF2F2] border border-[#FADBD8] rounded-xl text-xs text-[#DF4C4C]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateOfflineOrder} className="space-y-4 text-xs">
              {/* Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={offlineForm.customerName}
                    onChange={(e) => setOfflineForm({ ...offlineForm, customerName: e.target.value })}
                    placeholder="e.g. Ananya Rao"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={offlineForm.customerPhone}
                    onChange={(e) => setOfflineForm({ ...offlineForm, customerPhone: e.target.value })}
                    placeholder="e.g. 9820154321"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={offlineForm.customerEmail}
                    onChange={(e) => setOfflineForm({ ...offlineForm, customerEmail: e.target.value })}
                    placeholder="ananya@example.com"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
              </div>

              {/* Order Source & Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Order Source *</label>
                  <select
                    value={offlineForm.orderSource}
                    onChange={(e) => setOfflineForm({ ...offlineForm, orderSource: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  >
                    <option value="offline">Offline / Walk-in Studio</option>
                    <option value="exhibition">Art Exhibition / Pop-up Stall</option>
                    <option value="instagram">Instagram DM</option>
                    <option value="custom">Direct Custom Commission</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Payment Method</label>
                  <select
                    value={offlineForm.paymentMethod}
                    onChange={(e) => setOfflineForm({ ...offlineForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  >
                    <option value="cash">Cash in Hand</option>
                    <option value="upi">Direct UPI Transfer</option>
                    <option value="card">Card POS</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#2C332D] block mb-1">Payment Status</label>
                  <select
                    value={offlineForm.paymentStatus}
                    onChange={(e) => setOfflineForm({ ...offlineForm, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 pt-2 border-t border-[#F4EBE6]">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[#736C66]">Products / Commission Items</span>
                  <button
                    type="button"
                    onClick={handleAddOfflineItem}
                    className="text-[#B8972E] font-bold text-[11px] hover:underline"
                  >
                    + Add Item Row
                  </button>
                </div>

                {offlineForm.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E0D5]">
                    <input
                      type="text"
                      required
                      placeholder="Item name / Custom Resin Piece"
                      value={item.productName}
                      onChange={(e) => handleOfflineItemChange(idx, "productName", e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleOfflineItemChange(idx, "quantity", Number(e.target.value))}
                      className="w-16 px-2 py-1.5 bg-white border border-[#E8E0D5] rounded-lg text-xs"
                    />
                    <div className="flex items-center gap-1">
                      <span>₹</span>
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => handleOfflineItemChange(idx, "unitPrice", Number(e.target.value))}
                        className="w-24 px-2 py-1.5 bg-white border border-[#E8E0D5] rounded-lg text-xs"
                      />
                    </div>
                    {offlineForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOfflineItem(idx)}
                        className="p-1 text-[#DF4C4C] hover:bg-[#FDF2F2] rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E0D5] flex justify-between items-center text-sm font-bold">
                <span>Calculated Total:</span>
                <span className="text-[#B8972E] text-base">₹{calculateOfflineSubtotal().toFixed(2)}</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E]"
                >
                  {creatingOrder ? "Recording Order..." : "Save Offline Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail & Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-[#E8E0D5] shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-4">
              <div>
                <span className="text-xs uppercase font-bold text-[#8C7A72]">
                  Order Details ({selectedOrder.orderSource || "online"})
                </span>
                <h2 className="font-serif text-xl font-bold text-[#2C332D]">
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-[#736C66] hover:text-[#2C332D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {updateMsg && (
              <p className="text-xs text-[#2E7D32] bg-[#E8EFE8] p-3 rounded-xl border border-[#C5D8C5]">
                {updateMsg}
              </p>
            )}

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E0D5]">
              <div>
                <p className="font-bold text-[#2C332D]">{selectedOrder.customerName}</p>
                <p className="text-[#736C66]">{selectedOrder.customerEmail}</p>
                <p className="text-[#736C66]">{selectedOrder.customerPhone}</p>
              </div>
              <div>
                <p className="text-[#736C66] leading-relaxed">
                  {selectedOrder.shippingAddressLine1}
                  {selectedOrder.shippingAddressLine2 ? `, ${selectedOrder.shippingAddressLine2}` : ""}
                  <br />
                  {selectedOrder.shippingCity}, {selectedOrder.shippingState} - {selectedOrder.shippingPostalCode}
                </p>
              </div>
            </div>

            {/* Itemized Snapshot with Customizations */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C332D]">
                Purchased Items ({selectedOrder.items?.length || 0})
              </h3>
              <div className="divide-y divide-[#F4EBE6] border border-[#E8E0D5] rounded-xl overflow-hidden bg-white">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="p-3 text-xs flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-semibold text-[#2C332D]">{item.productName}</p>
                      {item.variantName && <p className="text-[#736C66]">{item.variantName}</p>}
                      {item.personalizationDetails?.customName && (
                        <p className="text-[#B8972E] font-medium">
                          Custom Name: "{item.personalizationDetails.customName}"
                        </p>
                      )}
                      {item.referenceImageUrl && (
                        <a
                          href={item.referenceImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-[11px] text-[#2E7D32] underline"
                        >
                          <span>View Reference Photograph</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#2C332D]">₹{item.totalPrice}</p>
                      <p className="text-[11px] text-[#8C7A72]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Verification Details Box */}
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E0D5] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#B8972E]" />
                  <span>Payment &amp; Screenshot Verification</span>
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  selectedOrder.paymentStatus === "paid"
                    ? "bg-[#E8EFE8] text-[#2E7D32]"
                    : "bg-[#FDF2F2] text-[#DF4C4C]"
                }`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8C7A72] block">
                    Customer 12-Digit UTR / Reference ID:
                  </span>
                  <span className="font-mono text-sm font-bold text-[#2C332D] block bg-white px-3 py-1.5 rounded-lg border border-[#E8E0D5]">
                    {selectedOrder.upiTransactionId || "Not Provided"}
                  </span>
                  <span className="text-[11px] text-[#736C66] block pt-1">
                    Method: <strong className="uppercase">{selectedOrder.paymentMethod || "UPI"}</strong> • Total Amount: <strong className="text-[#B8972E]">₹{selectedOrder.totalAmount}</strong>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8C7A72] block mb-1">
                    Payment Receipt Screenshot:
                  </span>
                  {selectedOrder.paymentScreenshotUrl ? (
                    <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-[#E8E0D5]">
                      <a
                        href={selectedOrder.paymentScreenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block w-14 h-14 rounded-lg overflow-hidden border border-[#E8E0D5] shrink-0"
                      >
                        <img
                          src={selectedOrder.paymentScreenshotUrl}
                          alt="Customer Payment Receipt"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </div>
                      </a>
                      <div className="flex-1 min-w-0">
                        <a
                          href={selectedOrder.paymentScreenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1"
                        >
                          <span>Open Screenshot</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <p className="text-[10px] text-[#8C7A72] mt-0.5">
                          Tap thumbnail to view full image in high resolution
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded-xl border border-[#E8E0D5] text-xs text-[#8C7A72] italic">
                      No screenshot uploaded by customer.
                    </div>
                  )}
                </div>
              </div>

              {selectedOrder.paymentStatus !== "paid" && (
                <div className="pt-2 border-t border-[#E8E0D5] flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => handleTogglePayment(selectedOrder, e)}
                    className="px-4 py-2 bg-[#2E7D32] hover:bg-[#256828] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Receipt &amp; Mark as Paid</span>
                  </button>
                </div>
              )}
            </div>

            {/* Update Status Form */}
            <form onSubmit={handleUpdateOrder} className="space-y-4 pt-2 border-t border-[#F4EBE6]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C332D]">
                Update Payment & Fulfilment
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Payment Status (Paid / Unpaid)
                  </label>
                  <select
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D] font-bold"
                  >
                    <option value="paid">Paid (Confirmed)</option>
                    <option value="unpaid">Unpaid (Will notify customer & discard)</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Fulfilment Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
                  >
                    <option value="pending_payment">Pending Payment</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing (Curing / Handcrafting)</option>
                    <option value="ready_to_ship">Ready to Ship</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Courier Partner
                  </label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="e.g. Delhivery / Blue Dart"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Tracking Number (AWB)
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. DELHIVERY-7749210"
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Payment verified, ready for packaging."
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E]"
                >
                  {updating ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
