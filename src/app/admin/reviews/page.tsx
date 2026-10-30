"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  ThumbsUp,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  UserCheck,
  KeyRound,
  CheckCircle2,
  Clock,
  Camera,
  X,
  Loader2,
  RefreshCw,
  Plus,
  AlertCircle,
} from "lucide-react";

interface AdminReview {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  productSku?: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  rating: number;
  reviewText: string;
  images: string[];
  likesCount: number;
  isVerifiedPurchase: boolean;
  adminGranted: boolean;
  status: string;
  createdAt: string;
}

interface ReviewPermission {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  productSku?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  hasReviewed: boolean;
  createdAt: string;
}

interface CustomerOption {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  slug: string;
  imageUrl?: string;
}

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState<"reviews" | "permissions">("reviews");
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [permissions, setPermissions] = useState<ReviewPermission[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Grant Permission Form state
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [isGranting, setIsGranting] = useState(false);
  const [grantMessage, setGrantMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [revRes, permRes] = await Promise.all([
        fetch("/api/admin/reviews"),
        fetch("/api/admin/review-permissions"),
      ]);

      const revData = await revRes.json();
      const permData = await permRes.json();

      if (revData.success) {
        setReviews(revData.reviews || []);
      }
      if (permData.success) {
        setPermissions(permData.permissions || []);
        setCustomers(permData.customers || []);
        setProducts(permData.products || []);
      }
    } catch (err) {
      console.error("Failed to load admin reviews data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert(data.error || "Failed to delete review.");
      }
    } catch {
      alert("Error deleting review.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedProduct) {
      setGrantMessage({ type: "error", text: "Please select both a registered customer and a product." });
      return;
    }

    setIsGranting(true);
    setGrantMessage(null);

    try {
      const res = await fetch("/api/admin/review-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer,
          productId: selectedProduct,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGrantMessage({ type: "success", text: "Special review permission granted successfully!" });
        setSelectedCustomer("");
        setSelectedProduct("");
        // Reload permissions
        const permRes = await fetch("/api/admin/review-permissions");
        const permData = await permRes.json();
        if (permData.success) {
          setPermissions(permData.permissions || []);
        }
      } else {
        setGrantMessage({ type: "error", text: data.error || "Failed to grant review permission." });
      }
    } catch {
      setGrantMessage({ type: "error", text: "Error granting review permission." });
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevokePermission = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this review permission?")) return;

    setRevokingId(id);
    try {
      const res = await fetch(`/api/admin/review-permissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPermissions((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Failed to revoke permission.");
      }
    } catch {
      alert("Error revoking permission.");
    } finally {
      setRevokingId(null);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter !== "all" && r.rating !== Number(ratingFilter)) {
      return false;
    }
    if (sourceFilter === "verified" && !r.isVerifiedPurchase) return false;
    if (sourceFilter === "admin_granted" && !r.adminGranted) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.customerName?.toLowerCase().includes(q) ||
        r.customerEmail?.toLowerCase().includes(q) ||
        r.productName?.toLowerCase().includes(q) ||
        r.productSku?.toLowerCase().includes(q) ||
        r.reviewText?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate overview metrics
  const totalLikes = reviews.reduce((sum, r) => sum + (r.likesCount || 0), 0);
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-6">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Customer review uploaded image"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#FAF4EC] text-[#800020] border border-[#D4AF37]/30">
              <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
              Product Reviews & Permissions
            </h1>
          </div>
          <p className="text-xs text-[#736C66]">
            Manage client reviews, ratings, user photos, likes count, and grant special review access to any registered user.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-[#736C66] bg-white border border-[#E8E0D5] rounded-xl hover:bg-[#FAF8F5] transition-all self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#D4AF37]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7A72] block mb-1">
            Total Reviews
          </span>
          <span className="font-serif text-2xl font-bold text-[#2C332D]">
            {reviews.length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7A72] block mb-1">
            Average Rating
          </span>
          <div className="flex items-center space-x-1">
            <span className="font-serif text-2xl font-bold text-[#2C332D]">
              {avgRating}
            </span>
            <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7A72] block mb-1">
            Total Helpful Likes
          </span>
          <div className="flex items-center space-x-1.5">
            <span className="font-serif text-2xl font-bold text-[#2C332D]">
              {totalLikes}
            </span>
            <ThumbsUp className="w-4 h-4 text-[#B8972E]" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7A72] block mb-1">
            Special Permissions
          </span>
          <div className="flex items-center space-x-1.5">
            <span className="font-serif text-2xl font-bold text-[#2C332D]">
              {permissions.length}
            </span>
            <UserCheck className="w-4 h-4 text-[#2E7D32]" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E8E0D5] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === "reviews"
              ? "bg-[#2C332D] text-white shadow-xs"
              : "text-[#736C66] hover:bg-[#FAF8F5] hover:text-[#2C332D]"
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>All Product Reviews ({reviews.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("permissions")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === "permissions"
              ? "bg-[#2C332D] text-white shadow-xs"
              : "text-[#736C66] hover:bg-[#FAF8F5] hover:text-[#2C332D]"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Grant User Review Access ({permissions.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: ALL REVIEWS ================= */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A72]" />
              <input
                type="text"
                placeholder="Search reviews by customer name, email, product, or review text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8E0D5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-[#2C332D]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-[#E8E0D5] rounded-xl text-xs font-medium text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="all">All Stars</option>
                <option value="5">5 Stars Only</option>
                <option value="4">4 Stars Only</option>
                <option value="3">3 Stars Only</option>
                <option value="2">2 Stars Only</option>
                <option value="1">1 Star Only</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-[#E8E0D5] rounded-xl text-xs font-medium text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="all">All Sources</option>
                <option value="verified">Verified Purchases Only</option>
                <option value="admin_granted">Admin Granted Only</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#E8E0D5] p-12 text-center space-y-2">
              <Star className="w-8 h-8 text-[#D1C7BD] mx-auto" />
              <p className="text-sm font-semibold text-[#2C332D]">No reviews found</p>
              <p className="text-xs text-[#736C66]">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReviews.map((rev) => {
                const dateStr = new Date(rev.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl border border-[#E8E0D5] p-5 shadow-xs space-y-4 hover:border-[#D4AF37]/50 transition-all"
                  >
                    {/* Top Row: Product Info & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E0D5] pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] flex items-center justify-center shrink-0 overflow-hidden">
                          <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C7A72]">
                              Product:
                            </span>
                            <span className="text-xs font-bold text-[#2C332D]">
                              {rev.productName || "Product"}
                            </span>
                            {rev.productSku && (
                              <span className="text-[10px] text-[#A69E96]">
                                ({rev.productSku})
                              </span>
                            )}
                          </div>
                          {rev.productSlug && (
                            <Link
                              href={`/shop/${rev.productSlug}`}
                              target="_blank"
                              className="text-[11px] text-[#B8972E] hover:underline flex items-center space-x-1"
                            >
                              <span>View Product on Storefront</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          disabled={deletingId === rev.id}
                          className="px-3 py-1.5 text-xs text-[#DF4C4C] hover:bg-[#FDF2F2] rounded-xl border border-[#FADBD8] transition-colors flex items-center space-x-1"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingId === rev.id ? "Deleting..." : "Delete"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Customer Info, Badges, Stars, Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        {rev.customerAvatar ? (
                          <img
                            src={rev.customerAvatar}
                            alt={rev.customerName}
                            className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#2C332D] text-white flex items-center justify-center font-bold text-xs">
                            {rev.customerName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-[#2C332D] block">
                            {rev.customerName}
                          </span>
                          <span className="text-[11px] text-[#736C66]">{rev.customerEmail}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Rating Stars */}
                        <div className="flex items-center space-x-0.5 bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#E8E0D5]">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                rev.rating >= s
                                  ? "text-[#D4AF37] fill-[#D4AF37]"
                                  : "text-[#D1C7BD]"
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-[#2C332D] ml-1">{rev.rating}.0</span>
                        </div>

                        {/* Badges */}
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#2E7D32] bg-[#E8EFE8] px-2.5 py-1 rounded-full border border-[#C5D8C5]">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                        {rev.adminGranted && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#946C00] bg-[#FFF8E1] px-2.5 py-1 rounded-full border border-[#FFE082]">
                            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                            <span>Admin Invited</span>
                          </span>
                        )}

                        <span className="text-[11px] text-[#A69E96]">{dateStr}</span>
                      </div>
                    </div>

                    {/* Review Comment Text */}
                    <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E0D5] text-xs text-[#2C332D] leading-relaxed whitespace-pre-line">
                      {rev.reviewText}
                    </div>

                    {/* Uploaded Photos Gallery */}
                    {rev.images && rev.images.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A72] block mb-1.5 flex items-center space-x-1">
                          <Camera className="w-3.5 h-3.5 text-[#B8972E]" />
                          <span>Uploaded Customer Photos ({rev.images.length})</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {rev.images.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setLightboxImage(imgUrl)}
                              className="w-16 h-16 rounded-xl overflow-hidden border border-[#E8E0D5] hover:border-[#D4AF37] transition-all transform hover:scale-105 cursor-pointer bg-white"
                              title="Click to view full image"
                            >
                              <img
                                src={imgUrl}
                                alt={`Customer upload ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer: Likes Count */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#E8E0D5] text-xs text-[#736C66]">
                      <div className="flex items-center space-x-1.5 font-medium">
                        <ThumbsUp className="w-3.5 h-3.5 text-[#B8972E]" />
                        <span>
                          <strong>{rev.likesCount || 0}</strong> {rev.likesCount === 1 ? "like" : "likes"} from other customers
                        </span>
                      </div>
                      <span className="text-[10px] text-[#A69E96]">Review ID: {rev.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: REVIEW PERMISSIONS ================= */}
      {activeTab === "permissions" && (
        <div className="space-y-6">
          {/* Grant Permission Form Card */}
          <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-lg bg-[#FAF4EC] text-[#800020]">
                  <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                </span>
                <h3 className="font-serif text-lg font-bold text-[#2C332D]">
                  Grant Review Permission to Registered User
                </h3>
              </div>
              <p className="text-xs text-[#736C66] mt-1">
                Give any registered customer permission to review any specific product even if they did not purchase it through the website. Once permission is given, they can rate (max 5★), upload photos, and submit a review up to 900 characters.
              </p>
            </div>

            <form onSubmit={handleGrantPermission} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Customer */}
                <div>
                  <label className="text-xs font-bold text-[#2C332D] block mb-1">
                    Select Registered Customer *
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <option value="">-- Choose Customer ({customers.length} registered) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Product */}
                <div>
                  <label className="text-xs font-bold text-[#2C332D] block mb-1">
                    Select Product *
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <option value="">-- Choose Product ({products.length} available) --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.sku}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {grantMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                    grantMessage.type === "success"
                      ? "bg-[#E8EFE8] text-[#2E7D32] border border-[#C5D8C5]"
                      : "bg-[#FDF2F2] text-[#DF4C4C] border border-[#FADBD8]"
                  }`}
                >
                  {grantMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{grantMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isGranting || !selectedCustomer || !selectedProduct}
                className="py-2.5 px-5 bg-[#2C332D] hover:bg-[#3D473E] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50"
              >
                {isGranting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                    <span>Granting Permission...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Grant Review Access</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Permissions List */}
          <div className="bg-white rounded-2xl border border-[#E8E0D5] p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#2C332D]">
              Granted Review Permissions ({permissions.length})
            </h3>

            {permissions.length === 0 ? (
              <p className="text-xs text-[#736C66] italic py-4">
                No custom review permissions have been granted yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E8E0D5] text-[#8C7A72] uppercase font-bold text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Granted Date</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D5]">
                    {permissions.map((perm) => (
                      <tr key={perm.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#2C332D] block">
                            {perm.customerName}
                          </span>
                          <span className="text-[11px] text-[#736C66]">
                            {perm.customerEmail}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-[#2C332D] block">
                            {perm.productName || "Product"}
                          </span>
                          {perm.productSlug && (
                            <Link
                              href={`/shop/${perm.productSlug}`}
                              target="_blank"
                              className="text-[10px] text-[#B8972E] hover:underline"
                            >
                              View Product
                            </Link>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {perm.hasReviewed ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#2E7D32] bg-[#E8EFE8] px-2 py-0.5 rounded-full border border-[#C5D8C5]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Review Submitted</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#B8972E] bg-[#FFF8E1] px-2 py-0.5 rounded-full border border-[#FFE082]">
                              <Clock className="w-3 h-3" />
                              <span>Pending Review</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[#736C66]">
                          {new Date(perm.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRevokePermission(perm.id)}
                            disabled={revokingId === perm.id}
                            className="px-2.5 py-1 text-[11px] font-bold text-[#DF4C4C] hover:bg-[#FDF2F2] rounded-lg border border-[#FADBD8] transition-colors"
                          >
                            {revokingId === perm.id ? "Revoking..." : "Revoke"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

