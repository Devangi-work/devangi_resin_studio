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
  ExternalLink,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Update Status Form
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("Delhivery");
  const [internalNotes, setInternalNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

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
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    }
    return true;
  });

  const openOrderModal = (ord: any) => {
    setSelectedOrder(ord);
    setNewStatus(ord.orderStatus);
    setTrackingNumber(ord.trackingNumber || "");
    setCourierName(ord.courierName || "Delhivery");
    setInternalNotes("");
    setUpdateMsg("");
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

  return (
    <div className="space-y-6">
      
      {/* Top Header & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Order Management & Fulfilment
          </h1>
          <p className="text-xs text-[#736C66]">
            Process resin art commissions, update dispatch tracking, and view customer customisation requests.
          </p>
        </div>

        <a
          href="/api/admin/orders/export"
          download
          className="px-4 py-2.5 bg-white border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-xl flex items-center space-x-2 hover:bg-[#FAF8F5] shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#2E7D32]" />
          <span>Export Orders to CSV</span>
        </a>
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
        >
          <option value="all">All Order Statuses</option>
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
          <option value="pending">Pending</option>
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
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Total</th>
                <th className="py-3 px-4 font-semibold">Fulfilment Status</th>
                <th className="py-3 px-4 font-semibold">Payment Status</th>
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
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-[#736C66]">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold">{o.customerName}</p>
                      <p className="text-[10px] text-[#736C66]">{o.customerEmail}</p>
                    </td>
                    <td className="py-3 px-4 font-bold">₹{o.totalAmount}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF4EC] text-[#B8972E]">
                        {o.orderStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.paymentStatus === "paid"
                            ? "bg-[#E8EFE8] text-[#2E7D32]"
                            : "bg-[#FDF2F2] text-[#DF4C4C]"
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openOrderModal(o)}
                        className="px-3 py-1 bg-white border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-lg hover:bg-[#FAF8F5] shadow-xs"
                      >
                        View & Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-[#E8E0D5] shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-4">
              <div>
                <span className="text-xs uppercase font-bold text-[#8C7A72]">Order Details</span>
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

            {/* Update Fulfilment Form */}
            <form onSubmit={handleUpdateOrder} className="space-y-4 pt-2 border-t border-[#F4EBE6]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C332D]">
                Update Order Status & Dispatch Tracking
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Order Status
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

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Curing complete, packed in champagne box."
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
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
