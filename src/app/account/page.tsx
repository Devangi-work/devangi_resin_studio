"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  Camera,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  Loader2,
  Edit3,
  Save,
  Check,
  Heart,
  FileText,
} from "lucide-react";

export default function CustomerAccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "care">("orders");

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");

  // Profile Edit State
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  // 1-Hour Cancellation Window State
  const [cancellingOrderNumber, setCancellingOrderNumber] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadData = async () => {
    try {
      const meRes = await fetch("/api/customer/me");
      const meData = await meRes.json();

      if (!meData.authenticated) {
        router.push("/account/login");
        return;
      }

      setCustomer(meData.customer);
      setProfileData({
        name: meData.customer.name || "",
        phone: meData.customer.phone || "",
        addressLine1: meData.customer.addressLine1 || "",
        addressLine2: meData.customer.addressLine2 || "",
        city: meData.customer.city || "",
        state: meData.customer.state || "",
        postalCode: meData.customer.postalCode || "",
        country: meData.customer.country || "India",
      });

      const ordRes = await fetch("/api/customer/orders");
      const ordData = await ordRes.json();
      if (ordData.orders) {
        setOrders(ordData.orders);
      }
    } catch (err) {
      console.error("Account load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/customer/logout", { method: "POST" });
    router.push("/");
  };

  // Avatar Upload Handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be smaller than 5MB.");
      return;
    }

    setAvatarError("");
    setAvatarSuccess("");
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/customer/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.error || "Failed to update profile picture.");
        setIsUploadingAvatar(false);
        return;
      }

      setCustomer((prev: any) => ({ ...prev, avatarUrl: data.avatarUrl }));
      setAvatarSuccess("Profile picture updated successfully!");
      setTimeout(() => setAvatarSuccess(""), 3500);
    } catch {
      setAvatarError("Unexpected error uploading profile picture.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save Profile Details Handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || "Failed to save profile details.");
        setIsSavingProfile(false);
        return;
      }

      setCustomer(data.customer);
      setProfileMessage("Your shipping and contact details have been successfully saved!");
      setTimeout(() => setProfileMessage(""), 4000);
    } catch {
      setProfileError("Network error occurred while saving profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 1-Hour Order Cancellation Handler
  const handleCancelOrder = async (orderNumber: string) => {
    setCancelLoading(true);
    setActionMessage("");

    try {
      const res = await fetch(`/api/customer/orders/${orderNumber}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Customer cancelled within 1-hour window" }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Could not cancel order.");
        setCancelLoading(false);
        return;
      }

      setActionMessage(`Order #${orderNumber} has been successfully cancelled. Any payment will be returned.`);
      setCancellingOrderNumber(null);
      setCancelReason("");
      loadData();
    } catch {
      alert("Error cancelling order.");
    } finally {
      setCancelLoading(false);
    }
  };

  const isProfileMissingDetails =
    customer &&
    (!customer.phone ||
      !customer.addressLine1 ||
      !customer.city ||
      !customer.state ||
      !customer.postalCode);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-28 text-center space-y-3">
        <Loader2 className="w-7 h-7 text-[#B8972E] animate-spin mx-auto" />
        <p className="text-xs text-[#736C66] uppercase tracking-wider">
          Loading your customer portal...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      
      {/* ---------------- Luxury Customer Profile Header ---------------- */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle decorative background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#F4EBE6]/60 to-transparent pointer-events-none rounded-full blur-2xl" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
          {/* Avatar with Camera Overlay & File Input */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#D4AF37] bg-[#FAF4EC] flex items-center justify-center text-[#2C332D] shadow-sm">
              {customer?.avatarUrl ? (
                <img
                  src={customer.avatarUrl}
                  alt={customer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-serif text-2xl font-bold text-[#B8972E]">
                  {customer?.name ? customer.name.charAt(0).toUpperCase() : "U"}
                </span>
              )}
            </div>

            {/* Camera Upload Trigger Button */}
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change Profile Picture"
            >
              <Camera className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-[9px] font-bold mt-0.5">Edit</span>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={isUploadingAvatar}
            />

            {/* Spinner when uploading */}
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white">
                <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C332D]">
                {customer?.name}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF4EC] text-[#B8972E] border border-[#E8E0D5]">
                {customer?.googleId ? "Google Account" : "Studio Member"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#736C66] pt-0.5">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#8C7A72]" />
                <span>{customer?.email}</span>
              </span>
              {customer?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#8C7A72]" />
                  <span>{customer.phone}</span>
                </span>
              )}
            </div>

            {/* Change Avatar Button for touch/mobile devices */}
            <div className="pt-1.5 flex items-center gap-2">
              <label
                htmlFor="avatar-upload"
                className="text-[11px] font-semibold text-[#B8972E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>Change Profile Photo</span>
              </label>
              {avatarSuccess && (
                <span className="text-[11px] text-[#2E7D32] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{avatarSuccess}</span>
                </span>
              )}
              {avatarError && (
                <span className="text-[11px] text-[#DF4C4C]">{avatarError}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls & Sign Out */}
        <div className="flex items-center space-x-3 relative z-10 self-start md:self-auto">
          <Link
            href="/shop"
            className="px-4 py-2.5 bg-[#FAF8F5] text-[#2C332D] hover:bg-[#F4EBE6] border border-[#E8E0D5] rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-[#B8972E]" />
            <span>Visit Boutique</span>
          </Link>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 border border-[#E8E0D5] text-[#736C66] hover:text-[#DF4C4C] hover:bg-[#FDF2F2] rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ---------------- Google Logged-In Missing Details Banner ---------------- */}
      {isProfileMissingDetails && (
        <div className="bg-[#FAF4EC] p-5 sm:p-6 rounded-3xl border border-[#E8E0D5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-[#2C332D] text-[#D4AF37] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2C332D]">
                Complete Your Delivery Profile
              </h3>
              <p className="text-xs text-[#736C66] mt-0.5 leading-relaxed">
                Your profile is missing your contact phone or full delivery address. Please fill them in so our studio can deliver your bespoke resin items smoothly.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className="px-4 py-2.5 bg-[#2C332D] hover:bg-[#3D473E] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shrink-0 cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Update Details Now &rarr;</span>
          </button>
        </div>
      )}

      {/* Global Action Messages */}
      {actionMessage && (
        <div className="p-4 bg-[#E8EFE8] border border-[#C5D8C5] rounded-2xl text-xs text-[#2E7D32] flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ---------------- Navigation Tabs ---------------- */}
      <div className="flex border-b border-[#E8E0D5] gap-2 sm:gap-6 text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === "orders"
              ? "border-[#2C332D] text-[#2C332D]"
              : "border-transparent text-[#736C66] hover:text-[#2C332D]"
          }`}
        >
          <Package className="w-4 h-4 text-[#B8972E]" />
          <span>My Orders &amp; Creations ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === "profile"
              ? "border-[#2C332D] text-[#2C332D]"
              : "border-transparent text-[#736C66] hover:text-[#2C332D]"
          }`}
        >
          <MapPin className="w-4 h-4 text-[#B8972E]" />
          <span>Shipping &amp; Profile Details</span>
          {isProfileMissingDetails && (
            <span className="w-2 h-2 rounded-full bg-[#DF4C4C]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("care")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === "care"
              ? "border-[#2C332D] text-[#2C332D]"
              : "border-transparent text-[#736C66] hover:text-[#2C332D]"
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#B8972E]" />
          <span>Resin Care Guide</span>
        </button>
      </div>

      {/* ---------------- TAB 1: ORDERS SECTION ---------------- */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E8E0D5] p-12 sm:p-16 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#B8972E] mx-auto border border-[#E8E0D5]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2C332D]">No Orders Placed Yet</h3>
              <p className="text-xs text-[#736C66] max-w-sm mx-auto leading-relaxed">
                Explore our boutique collection of handmade resin coasters, bespoke letter keychains, floral bookmark sets, and ocean trays.
              </p>
              <Link
                href="/shop"
                className="inline-block px-7 py-3 bg-[#2C332D] text-white text-xs font-semibold rounded-full hover:bg-[#3D473E] transition shadow-xs"
              >
                Explore Boutique Collection
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((order) => {
                const createdAtTime = new Date(order.createdAt).getTime();
                const elapsedMinutes = (Date.now() - createdAtTime) / (1000 * 60);
                const isWithin1Hour = elapsedMinutes <= 60;
                const remainingMinutes = Math.max(0, Math.floor(60 - elapsedMinutes));
                const isCancelled = order.orderStatus === "cancelled";

                return (
                  <div
                    key={order.id || order.orderNumber}
                    className="bg-white rounded-3xl border border-[#E8E0D5] p-6 sm:p-7 shadow-sm space-y-5 hover:border-[#D4AF37]/60 transition-colors"
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F4EBE6] gap-3">
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <span className="font-mono text-sm font-bold text-[#2C332D]">
                            #{order.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-3 py-0.5 rounded-full ${
                              isCancelled
                                ? "bg-[#FDF2F2] text-[#DF4C4C]"
                                : order.orderStatus === "delivered"
                                ? "bg-[#E8EFE8] text-[#2E7D32]"
                                : "bg-[#FAF4EC] text-[#B8972E]"
                            }`}
                          >
                            {order.orderStatus.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#736C66] mt-1">
                          Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-base font-bold text-[#2C332D]">
                          ₹{Number(order.totalAmount).toFixed(2)}
                        </p>
                        <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              order.paymentStatus === "paid" ? "bg-[#2E7D32]" : "bg-[#B8972E]"
                            }`}
                          />
                          <span className="text-[10.5px] font-semibold text-[#8C7A72]">
                            {order.paymentStatus === "paid"
                              ? "Payment Verified"
                              : "Payment Pending Verification (UPI)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="divide-y divide-[#F4EBE6]">
                      {order.items &&
                        order.items.map((item: any, idx: number) => (
                          <div key={idx} className="py-3 first:pt-0 flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-[#2C332D]">{item.productName}</span>
                              {item.variantName && (
                                <span className="text-[11px] text-[#8C7A72] ml-1.5">({item.variantName})</span>
                              )}
                              {item.personalizationDetails?.customName && (
                                <span className="text-[11px] text-[#B8972E] block font-medium">
                                  Custom Name: &ldquo;{item.personalizationDetails.customName}&rdquo;
                                </span>
                              )}
                              <span className="text-[11px] text-[#736C66] block">
                                Qty: {item.quantity} &times; ₹{Number(item.unitPrice || 0).toFixed(2)}
                              </span>
                            </div>
                            <span className="font-bold text-[#2C332D]">
                              ₹{Number(item.totalPrice || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* 1-Hour Cancellation Notice & Action */}
                    <div className="pt-3 border-t border-[#F4EBE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        {isCancelled ? (
                          <p className="text-xs text-[#DF4C4C] flex items-center gap-1.5 font-medium">
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span>Order Cancelled: {order.cancellationReason || "By customer request"}</span>
                          </p>
                        ) : isWithin1Hour ? (
                          <p className="text-xs text-[#B8972E] flex items-center gap-1.5 font-medium">
                            <Clock className="w-4 h-4 animate-spin-slow shrink-0" />
                            <span>
                              Cancellation available for next <strong>{remainingMinutes} minutes</strong> (1-hour window)
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs text-[#736C66] flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-[#2E7D32] shrink-0" />
                            <span>In Production — 1-hour cancellation window has concluded</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {isWithin1Hour && !isCancelled && (
                          <button
                            type="button"
                            onClick={() => setCancellingOrderNumber(order.orderNumber)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-[#DF4C4C] hover:bg-[#FDF2F2] border border-[#DF4C4C]/30 rounded-xl transition-colors cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        )}
                        <Link
                          href={`/orders/${order.orderNumber}`}
                          className="px-4 py-1.5 text-xs font-semibold bg-[#FAF8F5] text-[#2C332D] hover:bg-[#F4EBE6] border border-[#E8E0D5] rounded-xl flex items-center gap-1 transition-colors"
                        >
                          <span>Track Order</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Inline Cancellation Prompt */}
                    {cancellingOrderNumber === order.orderNumber && (
                      <div className="p-4 bg-[#FDF2F2] rounded-2xl border border-[#FADBD8] space-y-3 mt-3">
                        <p className="text-xs font-bold text-[#DF4C4C]">
                          Are you sure you want to cancel Order #{order.orderNumber}?
                        </p>
                        <p className="text-[11px] text-[#736C66]">
                          Orders cancelled within 1 hour will be stopped immediately and any UPI payment will be returned.
                        </p>
                        <input
                          type="text"
                          placeholder="Reason for cancellation (optional)"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E8E0D5] rounded-xl focus:outline-none"
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            disabled={cancelLoading}
                            onClick={() => handleCancelOrder(order.orderNumber)}
                            className="px-4 py-2 bg-[#DF4C4C] text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition cursor-pointer"
                          >
                            {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancellingOrderNumber(null)}
                            className="px-4 py-2 bg-white border border-[#E8E0D5] text-[#736C66] text-xs font-semibold rounded-xl hover:bg-[#FAF8F5] transition cursor-pointer"
                          >
                            Keep Order
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 2: PROFILE & SHIPPING ADDRESS ---------------- */}
      {activeTab === "profile" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] shadow-sm space-y-6">
          <div className="border-b border-[#F4EBE6] pb-4">
            <h2 className="font-serif text-xl font-bold text-[#2C332D]">
              Shipping Address &amp; Contact Details
            </h2>
            <p className="text-xs text-[#736C66] mt-0.5">
              These details will automatically pre-fill your future checkouts and ensure accurate courier delivery.
            </p>
          </div>

          {profileMessage && (
            <div className="p-4 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32] flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{profileMessage}</span>
            </div>
          )}

          {profileError && (
            <div className="p-4 bg-[#FDF2F2] border border-[#FADBD8] rounded-xl text-xs text-[#DF4C4C] flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Contact Mobile Number (10 Digits) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={15}
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                <span className="text-[10px] text-[#8C7A72] mt-0.5 block">
                  Used for WhatsApp and SMS courier dispatch notifications
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                House / Flat / Building &amp; Street Address *
              </label>
              <input
                type="text"
                required
                value={profileData.addressLine1}
                onChange={(e) => setProfileData({ ...profileData, addressLine1: e.target.value })}
                placeholder="e.g. Flat 402, Green Meadows, 5th Main Road"
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Apartment, Landmark, Area (Optional)
              </label>
              <input
                type="text"
                value={profileData.addressLine2}
                onChange={(e) => setProfileData({ ...profileData, addressLine2: e.target.value })}
                placeholder="e.g. Near Metro Station, Indiranagar"
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  placeholder="e.g. Bengaluru"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.state}
                  onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                  placeholder="e.g. Karnataka"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Pincode (6 Digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={profileData.postalCode}
                  onChange={(e) => setProfileData({ ...profileData, postalCode: e.target.value })}
                  placeholder="e.g. 560038"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-3 bg-[#2C332D] hover:bg-[#3D473E] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition cursor-pointer shadow-md disabled:opacity-60"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#D4AF37]" />
                    <span>Save Shipping Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------- TAB 3: RESIN ART CARE GUIDE ---------------- */}
      {activeTab === "care" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] shadow-sm space-y-6">
          <div className="border-b border-[#F4EBE6] pb-4">
            <h2 className="font-serif text-xl font-bold text-[#2C332D]">
              Artisan Resin Care &amp; Longevity
            </h2>
            <p className="text-xs text-[#736C66] mt-0.5">
              Tips to ensure your handmade epoxy resin pieces maintain their glass-like clarity for decades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E0D5] space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#FAF4EC] flex items-center justify-center text-[#B8972E] border border-[#E8E0D5]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-[#2C332D]">Avoid High Direct Heat</h3>
              <p className="text-[11px] text-[#736C66] leading-relaxed">
                While cured resin withstands warm coffee cups, avoid exposing pieces to intense direct flame or dishwashers.
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E0D5] space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#FAF4EC] flex items-center justify-center text-[#B8972E] border border-[#E8E0D5]">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-[#2C332D]">Gentle Cleaning Only</h3>
              <p className="text-[11px] text-[#736C66] leading-relaxed">
                Wipe clean with a damp microfiber cloth and mild soap. Avoid abrasive scrub pads, bleach, or harsh chemicals.
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E0D5] space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#FAF4EC] flex items-center justify-center text-[#B8972E] border border-[#E8E0D5]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-[#2C332D]">UV Protected Resins</h3>
              <p className="text-[11px] text-[#736C66] leading-relaxed">
                We craft each creation with premium UV-stabilized resin to prevent yellowing. Keep indoors away from prolonged direct sun.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
