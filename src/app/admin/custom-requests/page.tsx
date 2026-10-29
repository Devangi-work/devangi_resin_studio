"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Filter,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  Calendar,
  DollarSign,
  ArrowRight,
  Eye,
  Trash2,
  RefreshCw,
  X,
} from "lucide-react";

export default function AdminCustomRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [quoteInput, setQuoteInput] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/custom-requests");
      const data = await res.json();
      if (data && data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to load custom requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusChange = async (reqId: string, nextStatus: string) => {
    setUpdatingId(reqId);
    try {
      const res = await fetch(`/api/admin/custom-requests/${reqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === reqId ? { ...r, status: nextStatus } : r))
        );
        if (selectedRequest?.id === reqId) {
          setSelectedRequest((prev: any) => (prev ? { ...prev, status: nextStatus } : prev));
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setUpdatingId(selectedRequest.id);
    try {
      const payload: any = {
        adminNotes: adminNoteInput,
      };
      if (quoteInput) payload.quoteAmount = Number(quoteInput);

      const res = await fetch(`/api/admin/custom-requests/${selectedRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setRequests((prev) =>
          prev.map((r) => (r.id === selectedRequest.id ? { ...r, ...data.request } : r))
        );
        setSelectedRequest(data.request);
        alert("Custom inquiry updated successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update inquiry.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (reqId: string) => {
    if (!confirm("Are you sure you want to delete this custom request?")) return;
    try {
      const res = await fetch(`/api/admin/custom-requests/${reqId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== reqId));
        if (selectedRequest?.id === reqId) setSelectedRequest(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (req: any) => {
    setSelectedRequest(req);
    setAdminNoteInput(req.adminNotes || "");
    setQuoteInput(req.quoteAmount ? String(req.quoteAmount) : "");
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "all") {
      if (statusFilter === "converted") {
        if (r.status !== "converted" && r.status !== "converted_to_order") return false;
      } else if (r.status !== statusFilter) {
        return false;
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.customerName?.toLowerCase().includes(q) ||
        r.customerEmail?.toLowerCase().includes(q) ||
        r.customerPhone?.includes(q) ||
        r.productType?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const generateWhatsAppUrl = (req: any) => {
    const cleanPhone = (req.customerPhone || "").replace(/[^0-9]/g, "");
    const greeting = `Hi ${req.customerName}! ✨\n\nThank you for reaching out to Devangi Resin Studio regarding your custom inquiry for: "${req.productType}".\n\nWe reviewed your design vision and reference details. We would love to discuss your handcrafted custom piece! Could you please confirm if this is the best time to connect?`;
    return `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(greeting)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#FAF4EC] text-[#800020] border border-[#D4AF37]/30">
              <Sparkles className="w-4 h-4 text-[#B8972E]" />
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
              Bespoke Custom Studio Inquiries
            </h1>
          </div>
          <p className="text-xs text-[#736C66]">
            Review incoming custom commissions, client reference photos, floral preservation briefs, and contact customers directly via WhatsApp.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadRequests}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-xl flex items-center space-x-2 hover:bg-[#FAF8F5] shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B8972E] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 hover:bg-[#3D473E] shadow-xs transition"
          >
            <span>Orders Management</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#8C7A72] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer, phone, vision..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-[#2C332D]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
        >
          <option value="all">All Inquiry Statuses ({requests.length})</option>
          <option value="new">New ({requests.filter((r) => r.status === "new").length})</option>
          <option value="in_review">In Review</option>
          <option value="quoted">Quoted</option>
          <option value="accepted">Accepted</option>
          <option value="converted">
            Converted to Order ({requests.filter((r) => r.status === "converted" || r.status === "converted_to_order").length})
          </option>
          <option value="declined">Declined</option>
        </select>
      </div>

      {/* Requests Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] p-12 text-center text-xs text-[#736C66]">
          Loading custom studio inquiries...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF4EC] text-[#B8972E] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-base font-bold text-[#2C332D]">No Custom Inquiries Found</h3>
          <p className="text-xs text-[#736C66] max-w-sm mx-auto">
            {search || statusFilter !== "all"
              ? "No requests match the current filters. Try clearing search filters."
              : "When customers submit the Custom Studio form at /custom-orders, their inquiry and uploaded reference photos will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-[#E8E0D5] p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Top Strip: Status & Date */}
                <div className="flex items-center justify-between text-xs border-b border-[#F4EBE6] pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === "new"
                          ? "bg-[#FAF0F3] text-[#800020] border border-[#800020]/30"
                          : req.status === "accepted" || req.status === "converted" || req.status === "converted_to_order"
                          ? "bg-[#E8EFE8] text-[#2E7D32] border border-[#C5D8C5]"
                          : req.status === "quoted"
                          ? "bg-[#EBF3FA] text-[#1E5B94] border border-[#BDD7EE]"
                          : req.status === "in_review"
                          ? "bg-[#FFF8E6] text-[#B8860B] border border-[#FDE047]"
                          : "bg-[#FAF8F5] text-[#736C66] border border-[#E8E0D5]"
                      }`}
                    >
                      {req.status === "converted" || req.status === "converted_to_order"
                        ? "✓ Converted to Order"
                        : req.status?.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-[#8C7A72]">
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={req.status || "new"}
                    onChange={(e) => handleStatusChange(req.id, e.target.value)}
                    disabled={updatingId === req.id}
                    className="text-[11px] font-semibold bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg px-2 py-1 text-[#2C332D] cursor-pointer"
                  >
                    <option value="new">Mark New</option>
                    <option value="in_review">In Review</option>
                    <option value="quoted">Quoted</option>
                    <option value="accepted">Accepted</option>
                    <option value="converted">Converted to Order</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                {/* Customer & Product Row */}
                <div className="flex items-start gap-4">
                  {/* Reference Image Thumbnail */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[#E8E0D5] bg-[#FAF4EC] shrink-0 relative group shadow-xs">
                    {req.referenceImageUrl ? (
                      <>
                        <img
                          src={req.referenceImageUrl}
                          alt="Customer Reference Photo"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <a
                          href={req.referenceImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                          title="View Full Resolution Photo"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#B8972E] p-2 text-center">
                        <Package className="w-5 h-5 mb-1 opacity-70" />
                        <span className="text-[9px] text-[#8C7A72] leading-tight">No Photo Attached</span>
                      </div>
                    )}
                  </div>

                  {/* Customer Info & Requirements */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-bold text-sm text-[#2C332D] truncate">
                      {req.customerName}
                    </h3>
                    <p className="text-xs font-semibold text-[#800020] truncate">
                      {req.productType}
                    </p>

                    {req.budget && (
                      <p className="text-[11px] text-[#B8972E] font-medium flex items-center gap-1">
                        <span>Budget:</span>
                        <strong className="text-[#2C332D]">{req.budget}</strong>
                      </p>
                    )}

                    <div className="flex flex-col text-[11px] text-[#736C66] pt-1">
                      <span className="truncate">{req.customerEmail}</span>
                      <span className="font-mono font-medium text-[#2C332D]">{req.customerPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Vision Description */}
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E0D5] text-xs text-[#2C332D] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A72] block">
                    Client Vision &amp; Notes:
                  </span>
                  <p className="text-[11px] text-[#554E48] leading-relaxed line-clamp-3">
                    {req.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#F4EBE6] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <a
                    href={generateWhatsAppUrl(req)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20BA5C] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-xs"
                    title="Chat with customer on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp</span>
                  </a>

                  {req.customerPhone && (
                    <a
                      href={`tel:${req.customerPhone}`}
                      className="p-2 bg-white border border-[#E8E0D5] text-[#2C332D] rounded-xl hover:bg-[#FAF8F5] transition"
                      title="Call customer"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#2E7D32]" />
                    </a>
                  )}

                  {req.customerEmail && (
                    <a
                      href={`mailto:${req.customerEmail}`}
                      className="p-2 bg-white border border-[#E8E0D5] text-[#2C332D] rounded-xl hover:bg-[#FAF8F5] transition"
                      title="Email customer"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#1E5B94]" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {req.status === "converted" || req.status === "converted_to_order" ? (
                    <span className="px-3 py-1.5 bg-[#E8EFE8] text-[#2E7D32] border border-[#C5D8C5] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span>Converted to Order</span>
                    </span>
                  ) : (
                    <Link
                      href={`/admin/orders?tab=custom_requests&convertCustomId=${req.id}`}
                      className="px-3 py-1.5 bg-[#3A1823] hover:bg-[#522332] text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1"
                    >
                      <Package className="w-3 h-3 text-[#D4AF37]" />
                      <span>Convert to Order</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => openModal(req)}
                    className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EFEAE2] border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-xl transition"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(req.id)}
                    className="p-1.5 text-[#DF4C4C] hover:bg-[#FDF2F2] rounded-lg transition"
                    title="Delete inquiry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail & Quote Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8E0D5]">
            <div className="flex items-start justify-between border-b border-[#F4EBE6] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#B8972E] tracking-wider block">
                  Bespoke Commission Inquiry
                </span>
                <h2 className="font-serif text-xl font-bold text-[#2C332D]">
                  {selectedRequest.productType}
                </h2>
                <p className="text-xs text-[#736C66]">
                  Submitted by {selectedRequest.customerName} on{" "}
                  {new Date(selectedRequest.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-1 text-[#736C66] hover:text-[#2C332D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reference Image Large Display */}
            {selectedRequest.referenceImageUrl ? (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2C332D] block">
                  Client Uploaded Reference Photo:
                </span>
                <div className="relative rounded-2xl overflow-hidden border border-[#E8E0D5] bg-[#FAF8F5] max-h-72 flex items-center justify-center">
                  <img
                    src={selectedRequest.referenceImageUrl}
                    alt="Customer Reference"
                    className="w-full max-h-72 object-contain"
                  />
                  <a
                    href={selectedRequest.referenceImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black text-white text-[11px] font-semibold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <span>Open High-Res Photo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D5] text-xs text-[#8C7A72] italic text-center">
                Customer did not upload a reference photograph for this inquiry.
              </div>
            )}

            {/* Customer Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E0D5]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C7A72] block">Client Name:</span>
                <p className="font-bold text-[#2C332D] text-sm">{selectedRequest.customerName}</p>
                <span className="text-[10px] uppercase font-bold text-[#8C7A72] block mt-2">Email:</span>
                <p className="text-[#2C332D]">{selectedRequest.customerEmail}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C7A72] block">Phone / WhatsApp:</span>
                <p className="font-bold text-[#2C332D]">{selectedRequest.customerPhone}</p>
                <span className="text-[10px] uppercase font-bold text-[#8C7A72] block mt-2">Target Budget:</span>
                <p className="font-bold text-[#B8972E]">{selectedRequest.budget || "Not Specified"}</p>
              </div>
            </div>

            {/* Description / Brief */}
            <div className="space-y-1 text-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2C332D] block">
                Artisan Brief &amp; Vision:
              </span>
              <p className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E0D5] text-[#2C332D] leading-relaxed whitespace-pre-wrap">
                {selectedRequest.description}
              </p>
            </div>

            {/* Admin Quote & Notes Form */}
            <form onSubmit={handleSaveDetails} className="space-y-4 pt-2 border-t border-[#F4EBE6]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Quoted Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2499.00"
                    value={quoteInput}
                    onChange={(e) => setQuoteInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl font-mono font-bold text-[#2C332D]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Internal Admin Status
                  </label>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D] font-bold"
                  >
                    <option value="new">New Inquiry</option>
                    <option value="in_review">In Review</option>
                    <option value="quoted">Price Quoted</option>
                    <option value="accepted">Accepted / In Production</option>
                    <option value="converted">Converted to Order</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Artisan Notes / Material Specifications
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Client agreed on deep emerald geode with 12-inch base and gold roman numerals."
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-[#2C332D]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href={generateWhatsAppUrl(selectedRequest)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#25D366] hover:bg-[#20BA5C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Reply on WhatsApp</span>
                </a>

                <div className="flex items-center space-x-2">
                  {selectedRequest.status === "converted" || selectedRequest.status === "converted_to_order" ? (
                    <span className="px-3.5 py-2 bg-[#E8EFE8] text-[#2E7D32] border border-[#C5D8C5] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                      <span>Converted to Order</span>
                    </span>
                  ) : (
                    <Link
                      href={`/admin/orders?tab=custom_requests&convertCustomId=${selectedRequest.id}`}
                      className="px-4 py-2 bg-[#3A1823] hover:bg-[#522332] text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1"
                    >
                      <Package className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Convert to Order</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66]"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={updatingId === selectedRequest.id}
                    className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E] transition"
                  >
                    {updatingId === selectedRequest.id ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

