"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Save,
  Check,
  ShieldCheck,
  Mail,
  Phone,
  MessageCircle,
  Upload,
  Image as ImageIcon,
  Sun,
  Moon,
  Loader2,
  Trash2,
  Camera,
  Sparkles,
  Clock,
  Tag,
  ExternalLink,
  Truck,
  RotateCcw,
  Lock,
  FileText,
} from "lucide-react";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { getStoredAdminTheme, applyAdminTheme, AdminTheme } from "@/lib/admin-theme";

function toDateTimeLocal(dateVal: any): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    storeName: "Devangi Resin Studio",
    storeTagline: "Handmade Resin Elegance, Preserved Forever",
    storeDescription: "Boutique handmade resin art, bespoke jewellery, personalized gifts, keychains, and coasters crafted with passion.",
    logoUrl: "/images/logo/resin_logo.png",
    contactEmail: "hello@devangiresinstudio.com",
    contactPhone: "+91 98765 43210",
    whatsappNumber: "+919876543210",
    instagramUrl: "https://instagram.com/devangiresinstudio",
    pinterestUrl: "https://pinterest.com/devangiresinstudio",
    defaultShippingCharge: "79.00",
    freeShippingThreshold: "999.00",
    orderConfirmationMessage: "Thank you for your order! Each resin piece is carefully handcrafted with love and utmost precision.",
    productionTimeMessage: "Handmade resin items take 3 to 5 business days for precision curing before dispatch.",
    returnPolicy: "Because each piece is custom handmade, returns are accepted within 7 days for damaged/defective items upon delivery.",
    shippingPolicy: "Standard insured domestic delivery across India takes 4-7 business days after curing.",
    privacyPolicy: "We value your privacy and never sell or share your personal information with third parties.",
    termsPolicy: "All custom personalised resin orders enter production immediately upon payment confirmation.",
    careInstructionsDefault: "Keep away from prolonged direct high heat. Clean gently with a soft microfiber cloth and mild soap. Avoid harsh chemical cleaners.",
    festivalDiscountActive: false,
    festivalName: "Festive Sparkle Celebration",
    festivalTagline: "✨ FESTIVAL SPECIAL: Enjoy Flat 20% OFF on all Handcrafted Keepsakes, Geode Clocks & Floral Frames! Use Code FESTIVE20 at checkout ✨ Free Express Delivery across India over ₹999 ✨ Limited Period Festive Treats! ✨",
    festivalDiscountPercentage: "20%",
    festivalCouponCode: "FESTIVE20",
    festivalExpiresAt: "",
    festivalBannerBg: "royal_wine",
    festivalCtaText: "Shop Festive Collection",
    festivalCtaUrl: "/shop?filter=festival",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Admin Profile & Appearance state
  const [adminUser, setAdminUser] = useState<any>(null);
  const [theme, setTheme] = useState<AdminTheme>("light");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));

    fetch("/api/admin/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data?.admin) setAdminUser(data.admin);
      })
      .catch((e) => console.error(e));

    // Initialize and listen to global admin theme
    setTheme(getStoredAdminTheme());

    const onThemeEvent = (e: any) => {
      const next = (e.detail || getStoredAdminTheme()) as AdminTheme;
      setTheme(next);
    };

    window.addEventListener("admin_theme_change", onThemeEvent);
    window.addEventListener("storage", onThemeEvent);
    return () => {
      window.removeEventListener("admin_theme_change", onThemeEvent);
      window.removeEventListener("storage", onThemeEvent);
    };
  }, []);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarMsg("");
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (res.ok && json.avatarUrl) {
        setAdminUser((prev: any) => ({ ...prev, avatarUrl: json.avatarUrl }));
        setAvatarMsg("Profile image updated successfully!");
      }
    } catch {
      setAvatarMsg("Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSelectAvatarFromLibrary = async (selected: { url: string }[]) => {
    if (!selected || selected.length === 0) return;
    const url = selected[0].url;
    setUploadingAvatar(true);
    setAvatarMsg("");
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (res.ok) {
        setAdminUser((prev: any) => ({ ...prev, avatarUrl: url }));
        setAvatarMsg("Profile image updated from Media Library!");
      }
    } catch {
      setAvatarMsg("Failed to update avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    setUploadingAvatar(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: " " }),
      });
      if (res.ok) {
        setAdminUser((prev: any) => ({ ...prev, avatarUrl: null }));
        setAvatarMsg("Profile photo removed.");
      }
    } catch {
      setAvatarMsg("Failed to remove avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleThemeChange = (newTheme: AdminTheme) => {
    applyAdminTheme(newTheme);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage("Settings saved and live across the storefront!");
      }
    } catch {
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-xs text-[#736C66] py-12 text-center">Loading settings...</p>;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Studio Branding & Site Settings
          </h1>
          <p className="text-xs text-[#736C66]">
            Configure store contact information, shipping rates, and legal policies stored in Neon PostgreSQL.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 hover:bg-[#3D473E] shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32]">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Administrator Profile & Appearance */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="font-serif text-base font-bold text-[#2C332D]">
                Administrator Account & Theme
              </h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8972E] bg-[#FAF4EC] px-2.5 py-0.5 rounded-full border border-[#E8E0D5]">
              Role: {adminUser?.role || "Owner"}
            </span>
          </div>

          {avatarMsg && (
            <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32] flex items-center justify-between">
              <span>{avatarMsg}</span>
              <button type="button" onClick={() => setAvatarMsg("")} className="underline text-[11px]">
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <div className="relative group flex-shrink-0">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-[#FAF8F5] shadow-sm flex items-center justify-center">
                  {adminUser?.avatarUrl ? (
                    <img
                      src={adminUser.avatarUrl}
                      alt={adminUser.fullName || "Admin"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-serif text-2xl font-bold text-[#2C332D]">
                      {adminUser?.fullName?.[0] || "A"}
                    </span>
                  )}
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <p className="text-xs font-bold text-[#2C332D] truncate">
                  {adminUser?.fullName || "Devangi Resin Studio Admin"}
                </p>
                <p className="text-[11px] text-[#736C66] font-mono truncate">
                  {adminUser?.email || "admin@auraresinart.com"}
                </p>

                <div className="flex items-center space-x-2 pt-1">
                  <label className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E8E0D5] hover:border-[#D4AF37] text-[#2C332D] text-[11px] font-semibold rounded-lg cursor-pointer flex items-center space-x-1 transition-colors">
                    <Upload className="w-3 h-3 text-[#B8972E]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    disabled={uploadingAvatar}
                    className="px-3 py-1.5 bg-[#FAF4EC] border border-[#D4AF37] text-[#7A6117] hover:bg-[#F3EAD9] text-[11px] font-semibold rounded-lg flex items-center space-x-1 transition-colors disabled:opacity-50"
                  >
                    <ImageIcon className="w-3 h-3 text-[#B8972E]" />
                    <span>Media Library</span>
                  </button>

                  {adminUser?.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove avatar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Theme Selector */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E0D5] space-y-2">
              <p className="text-xs font-semibold text-[#2C332D]">Dashboard Theme Mode</p>
              <p className="text-[11px] text-[#736C66]">
                Choose your visual interface style for the management dashboard.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    theme === "light"
                      ? "bg-white border-[#D4AF37] text-[#2C332D] shadow-xs ring-1 ring-[#D4AF37]"
                      : "bg-white/50 border-[#E8E0D5] text-[#736C66] hover:bg-white"
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    theme === "dark"
                      ? "bg-[#1E2621] border-[#D4AF37] text-white shadow-xs ring-1 ring-[#D4AF37]"
                      : "bg-white/50 border-[#E8E0D5] text-[#736C66] hover:bg-white"
                  }`}
                >
                  <Moon className="w-4 h-4 text-[#D4AF37]" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Branding & Contacts */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-4">
          <h2 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
            Store Identity & Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Store Brand Name
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Store Tagline
              </label>
              <input
                type="text"
                value={settings.storeTagline}
                onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                WhatsApp Number (with country code)
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Store Description
            </label>
            <textarea
              rows={2}
              value={settings.storeDescription}
              onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
            />
          </div>
        </div>

        {/* Shipping & Thresholds */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-4">
          <h2 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
            Shipping Charges & Thresholds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Default Domestic Shipping Fee (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.defaultShippingCharge || "79.00"}
                onChange={(e) => setSettings({ ...settings, defaultShippingCharge: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Free Shipping Cart Threshold (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.freeShippingThreshold || "999.00"}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* UPI Payments & QR Code Configuration */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-5">
          <div className="border-b border-[#F4EBE6] pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold text-[#2C332D]">
                UPI & QR Code Payment Setup
              </h2>
              <p className="text-xs text-[#736C66] mt-0.5">
                Customers scan this QR code or pay to this UPI ID directly at checkout.
              </p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-bold bg-[#E8EFE8] text-[#2E7D32] rounded-full">
              Live Checkout
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                UPI ID (VPA) <span className="text-[#DF4C4C]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. devangi0403@okaxis or 9876543210@paytm"
                value={settings.upiId || ""}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl font-mono text-[#2C332D]"
              />
              <p className="text-[11px] text-[#736C66] mt-1">
                Customers can copy this UPI ID with 1 click to pay in Google Pay, PhonePe, or Paytm.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Account Holder / Display Name <span className="text-[#DF4C4C]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Devangi Resin Studio"
                value={settings.accountHolderName || ""}
                onChange={(e) => setSettings({ ...settings, accountHolderName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
              <p className="text-[11px] text-[#736C66] mt-1">
                Name shown on the payment screen alongside your UPI ID.
              </p>
            </div>
          </div>

          {/* QR Code Upload & Preview */}
          <div className="pt-2 border-t border-[#F4EBE6]">
            <label className="text-xs font-semibold text-[#2C332D] block mb-2">
              UPI Scanner QR Code Image
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {settings.upiQrCodeUrl ? (
                <div className="relative group p-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-2xl">
                  <img
                    src={settings.upiQrCodeUrl}
                    alt="UPI QR Code Preview"
                    className="w-36 h-36 object-contain rounded-xl bg-white shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, upiQrCodeUrl: "" })}
                    className="absolute -top-2 -right-2 bg-[#DF4C4C] text-white p-1 rounded-full shadow hover:bg-red-700 transition"
                    title="Remove QR Code"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="w-36 h-36 border-2 border-dashed border-[#E8E0D5] rounded-2xl flex flex-col items-center justify-center text-[#736C66] text-xs p-3 text-center bg-[#FAF8F5]">
                  <span>No QR Code Uploaded</span>
                  <span className="text-[10px] text-[#A89F91] mt-1">PNG, JPG, or WEBP</span>
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="file"
                  id="qrUploadInput"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch("/api/admin/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      if (data.url) {
                        setSettings((prev: any) => ({ ...prev, upiQrCodeUrl: data.url }));
                      } else {
                        alert(data.error || "Failed to upload QR image.");
                      }
                    } catch {
                      alert("Upload error.");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("qrUploadInput")?.click()}
                  className="px-4 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E] transition shadow-sm"
                >
                  {settings.upiQrCodeUrl ? "Replace QR Code Image" : "Upload QR Code Image"}
                </button>
                <p className="text-[11px] text-[#736C66]">
                  Upload your Google Pay, PhonePe, or Paytm QR code (Max 5MB). It will be saved securely to Vercel Blob and displayed directly to buyers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Festival Special Announcement & Moving News Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#D4AF37]/40 shadow-sm space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4EBE6] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6A162B] to-[#3A1823] text-[#FFDF78] flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-[#FFDF78]" />
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-[#2C332D] flex items-center space-x-2">
                  <span>Festival Special Discounts & News Header</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0F3] text-[#800020] border border-[#E8C568]">
                    Homepage Banner
                  </span>
                </h2>
                <p className="text-xs text-[#736C66]">
                  Displays a moving ticker banner across the top of the homepage (below navbar, above hero) with custom discounts and auto-expiry.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={Boolean(settings.festivalDiscountActive)}
                onChange={(e) => setSettings({ ...settings, festivalDiscountActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6A162B]"></div>
              <span className="ml-3 text-xs font-bold text-[#2C332D]">
                {settings.festivalDiscountActive ? "Banner Active" : "Banner Disabled"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Festival Campaign Name
              </label>
              <input
                type="text"
                placeholder="e.g. Diwali & Festive Sparkle Celebration"
                value={settings.festivalName || ""}
                onChange={(e) => setSettings({ ...settings, festivalName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Highlight Discount (%)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20% or 25% OFF"
                  value={settings.festivalDiscountPercentage || ""}
                  onChange={(e) => setSettings({ ...settings, festivalDiscountPercentage: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Promo / Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. FESTIVE20"
                  value={settings.festivalCouponCode || ""}
                  onChange={(e) => setSettings({ ...settings, festivalCouponCode: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37] font-mono uppercase"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Moving News Header Tagline (Continuous Moving Text)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. ✨ FESTIVAL SPECIAL: Enjoy Flat 20% OFF on all Handcrafted Keepsakes, Geode Clocks & Floral Frames! Use Code FESTIVE20 at checkout ✨ Free Express Delivery across India over ₹999 ✨ Limited Period Festive Treats! ✨"
              value={settings.festivalTagline || ""}
              onChange={(e) => setSettings({ ...settings, festivalTagline: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37] leading-relaxed"
            />
            <p className="text-[11px] text-[#736C66] mt-1">
              This text continuously scrolls across the top news ticker header on the storefront.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#2C332D] flex items-center space-x-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#B8972E]" />
                <span>Expiry Date & Time *</span>
              </label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(settings.festivalExpiresAt)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    festivalExpiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37]"
              />
              <p className="text-[11px] text-[#736C66] mt-1">
                Banner automatically displays on homepage until this expiry timestamp.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Banner Background Palette
              </label>
              <select
                value={settings.festivalBannerBg || "royal_wine"}
                onChange={(e) => setSettings({ ...settings, festivalBannerBg: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="royal_wine">Royal Wine & Gold (Signature)</option>
                <option value="amber_gold">Amber Sunburst & Bronze</option>
                <option value="deep_forest">Emerald Forest & Gold</option>
                <option value="rose_noir">Midnight Noir & Rose</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                CTA Button Text & Link
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="e.g. Shop Festive"
                  value={settings.festivalCtaText || "Shop Festive"}
                  onChange={(e) => setSettings({ ...settings, festivalCtaText: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                />
                <input
                  type="text"
                  placeholder="e.g. /shop"
                  value={settings.festivalCtaUrl || "/shop"}
                  onChange={(e) => setSettings({ ...settings, festivalCtaUrl: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Real-time Ticker Preview Box */}
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E0D5] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#736C66]">
              <span className="font-semibold uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B8972E]" />
                <span>Live News Header Preview (Direction: Scrolling to Right)</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${settings.festivalDiscountActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {settings.festivalDiscountActive ? "Will Display on Homepage" : "Currently Inactive"}
              </span>
            </div>

            <div className="overflow-hidden relative rounded-lg border border-[#D4AF37]/50 py-2.5 bg-gradient-to-r from-[#3A1823] via-[#5C1D2E] to-[#3A1823] text-[#FFDF78]">
              <div className="flex w-max animate-[marqueeRight_22s_linear_infinite] whitespace-nowrap text-xs font-medium tracking-wide">
                <span className="px-6 flex items-center space-x-3">
                  <span className="bg-[#D4AF37] text-[#3A1823] text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    {settings.festivalName || "FESTIVAL SPECIAL"}
                  </span>
                  <span>{settings.festivalTagline || "✨ Special Festival Offers on Handcrafted Resin Art & Personalized Keepsakes! ✨"}</span>
                  {settings.festivalCouponCode && (
                    <span className="bg-white/20 border border-white/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white">
                      CODE: {settings.festivalCouponCode}
                    </span>
                  )}
                </span>
                <span className="px-6 flex items-center space-x-3">
                  <span className="bg-[#D4AF37] text-[#3A1823] text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    {settings.festivalName || "FESTIVAL SPECIAL"}
                  </span>
                  <span>{settings.festivalTagline || "✨ Special Festival Offers on Handcrafted Resin Art & Personalized Keepsakes! ✨"}</span>
                  {settings.festivalCouponCode && (
                    <span className="bg-white/20 border border-white/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white">
                      CODE: {settings.festivalCouponCode}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Policies & Resin Care Instructions */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
          <div className="border-b border-[#F4EBE6] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-base font-bold text-[#2C332D]">
                Dynamic Customer Policies & Resin Care Guide
              </h2>
              <p className="text-xs text-[#736C66]">
                These details dynamically power the public policy pages. Any updates saved here are instantly reflected live.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <Link
                href="/policies/shipping"
                target="_blank"
                className="inline-flex items-center space-x-1 text-[#8C6E79] hover:text-[#2C332D] underline"
              >
                <span>Shipping Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span>•</span>
              <Link
                href="/policies/returns"
                target="_blank"
                className="inline-flex items-center space-x-1 text-[#8C6E79] hover:text-[#2C332D] underline"
              >
                <span>Returns Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span>•</span>
              <Link
                href="/policies/care"
                target="_blank"
                className="inline-flex items-center space-x-1 text-[#8C6E79] hover:text-[#2C332D] underline"
              >
                <span>Care Guide</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span>•</span>
              <Link
                href="/policies/privacy"
                target="_blank"
                className="inline-flex items-center space-x-1 text-[#8C6E79] hover:text-[#2C332D] underline"
              >
                <span>Privacy Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* 1. Shipping & Dispatch Policy */}
          <div className="p-4 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5]/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2C332D] flex items-center space-x-2">
                <Truck className="w-4 h-4 text-[#B8972E]" />
                <span>1. Shipping & Dispatch Policy</span>
              </label>
              <Link
                href="/policies/shipping"
                target="_blank"
                className="text-[11px] text-[#B8972E] hover:underline flex items-center space-x-1"
              >
                <span>View Live Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <textarea
              rows={4}
              value={settings.shippingPolicy || ""}
              onChange={(e) => setSettings({ ...settings, shippingPolicy: e.target.value })}
              placeholder="Explain curing timelines, domestic dispatch duration, insured courier partners, free shipping thresholds, and tracking..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37] leading-relaxed"
            />
          </div>

          {/* 2. Returns & Exchange Policy */}
          <div className="p-4 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5]/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2C332D] flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-[#B8972E]" />
                <span>2. Returns & Exchange Policy</span>
              </label>
              <Link
                href="/policies/returns"
                target="_blank"
                className="text-[11px] text-[#B8972E] hover:underline flex items-center space-x-1"
              >
                <span>View Live Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <textarea
              rows={4}
              value={settings.returnPolicy || ""}
              onChange={(e) => setSettings({ ...settings, returnPolicy: e.target.value })}
              placeholder="Outline policies for handmade bespoke items, transit damage replacement guarantee, 7-day window, unboxing video requirements..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37] leading-relaxed"
            />
          </div>

          {/* 3. Resin Care Guide */}
          <div className="p-4 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5]/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2C332D] flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#B8972E]" />
                <span>3. Resin Care Guide & Maintenance</span>
              </label>
              <Link
                href="/policies/care"
                target="_blank"
                className="text-[11px] text-[#B8972E] hover:underline flex items-center space-x-1"
              >
                <span>View Live Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <textarea
              rows={4}
              value={settings.careInstructionsDefault || ""}
              onChange={(e) => setSettings({ ...settings, careInstructionsDefault: e.target.value })}
              placeholder="Explain cleaning instructions (microfiber, mild soap), temperature limits, avoidance of abrasive sponges, UV resistance..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37] leading-relaxed"
            />
          </div>

          {/* 4. Privacy Policy */}
          <div className="p-4 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5]/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2C332D] flex items-center space-x-2">
                <Lock className="w-4 h-4 text-[#B8972E]" />
                <span>4. Privacy & Data Protection Policy</span>
              </label>
              <Link
                href="/policies/privacy"
                target="_blank"
                className="text-[11px] text-[#B8972E] hover:underline flex items-center space-x-1"
              >
                <span>View Live Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <textarea
              rows={4}
              value={settings.privacyPolicy || ""}
              onChange={(e) => setSettings({ ...settings, privacyPolicy: e.target.value })}
              placeholder="Detail user data confidentiality, how delivery addresses and phone numbers are handled, secure payment protection..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37] leading-relaxed"
            />
          </div>

          {/* 5. Terms & Conditions */}
          <div className="p-4 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5]/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2C332D] flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#B8972E]" />
                <span>5. Terms & Conditions of Artisan Keepsakes</span>
              </label>
              <Link
                href="/policies/terms"
                target="_blank"
                className="text-[11px] text-[#B8972E] hover:underline flex items-center space-x-1"
              >
                <span>View Live Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <textarea
              rows={3}
              value={settings.termsPolicy || ""}
              onChange={(e) => setSettings({ ...settings, termsPolicy: e.target.value })}
              placeholder="Terms of custom handmade orders, petal placement variations, payment policies, cancellation window..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37] leading-relaxed"
            />
          </div>
        </div>
      </form>

      {/* Media Picker Modal for Admin Avatar */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        multiple={false}
        title="Select Admin Profile Photo"
        onSelect={handleSelectAvatarFromLibrary}
      />
    </div>
  );
}
