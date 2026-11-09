"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  PenTool,
  Plus,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Copy,
  Activity,
  Eye,
  Video,
  BarChart3,
  Megaphone,
} from "lucide-react";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { getStoredAdminTheme, applyAdminTheme, AdminTheme } from "@/lib/admin-theme";
import { defaultPolicyTemplates } from "@/lib/policies-default";
import { findStateForLocation, INDIAN_STATES_DATA } from "@/lib/shipping";

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
    signatureUrl: "",
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
    festivalDiscountType: "percentage",
    festivalDiscountPercentage: "20%",
    festivalDiscountAmount: "",
    festivalCouponCode: "FESTIVE20",
    festivalExpiresAt: "",
    festivalBannerBg: "royal_wine",
    festivalCtaText: "Shop Festive Collection",
    festivalCtaUrl: "/shop?filter=festival",
    popupBannerActive: false,
    popupBannerTagline: "",
    popupBannerImageUrl: "",
    popupBannerLinkUrl: "/shop",
    popupBannerButtonText: "Explore Now",
    popupBannerExpiresAt: "",
    cityShippingRates: [] as Array<{ id: string; name: string; charge: string | number }>,
    policyPagesConfig: {} as Record<string, any>,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedPolicyType, setSelectedPolicyType] = useState<"shipping" | "returns" | "care" | "privacy" | "terms">("shipping");

  const getActivePolicyConfig = (type: string) => {
    const existing = settings.policyPagesConfig?.[type];
    if (existing && typeof existing === "object") {
      return {
        statement: existing.statement ?? "",
        highlights: Array.isArray(existing.highlights) ? existing.highlights : [],
        detailedSections: Array.isArray(existing.detailedSections) ? existing.detailedSections : [],
        alertBox: existing.alertBox ? { ...existing.alertBox } : { enabled: false, title: "", message: "", type: "note" },
      };
    }
    let legacyStatement = "";
    if (type === "shipping") legacyStatement = settings.shippingPolicy || "";
    if (type === "returns") legacyStatement = settings.returnPolicy || "";
    if (type === "care") legacyStatement = settings.careInstructionsDefault || "";
    if (type === "privacy") legacyStatement = settings.privacyPolicy || "";
    if (type === "terms") legacyStatement = settings.termsPolicy || "";

    const defaultTmpl = defaultPolicyTemplates[type];
    return {
      statement: legacyStatement || defaultTmpl?.statement || "",
      highlights: defaultTmpl?.highlights ? JSON.parse(JSON.stringify(defaultTmpl.highlights)) : [],
      detailedSections: defaultTmpl?.detailedSections ? JSON.parse(JSON.stringify(defaultTmpl.detailedSections)) : [],
      alertBox: defaultTmpl?.alertBox ? JSON.parse(JSON.stringify(defaultTmpl.alertBox)) : { enabled: true, title: "", message: "", type: "note" },
    };
  };

  const updateActivePolicy = (updater: (prev: any) => any) => {
    setSettings((prev: any) => {
      const cfg = { ...(prev.policyPagesConfig || {}) };
      const current = getActivePolicyConfig(selectedPolicyType);
      const updated = updater(current);
      cfg[selectedPolicyType] = updated;

      const legacyUpdates: any = {};
      if (selectedPolicyType === "shipping" && updated.statement !== undefined) legacyUpdates.shippingPolicy = updated.statement;
      if (selectedPolicyType === "returns" && updated.statement !== undefined) legacyUpdates.returnPolicy = updated.statement;
      if (selectedPolicyType === "care" && updated.statement !== undefined) legacyUpdates.careInstructionsDefault = updated.statement;
      if (selectedPolicyType === "privacy" && updated.statement !== undefined) legacyUpdates.privacyPolicy = updated.statement;
      if (selectedPolicyType === "terms" && updated.statement !== undefined) legacyUpdates.termsPolicy = updated.statement;

      return {
        ...prev,
        ...legacyUpdates,
        policyPagesConfig: cfg,
      };
    });
  };

  const handleLoadDefaultTemplate = (type: string) => {
    const defaultTmpl = defaultPolicyTemplates[type];
    if (!defaultTmpl) return;
    if (confirm(`Load the studio default template for "${defaultTmpl.name}"? This will populate standard highlight cards, procedures, and advisory notes.`)) {
      updateActivePolicy(() => ({
        statement: defaultTmpl.statement,
        highlights: JSON.parse(JSON.stringify(defaultTmpl.highlights || [])),
        detailedSections: JSON.parse(JSON.stringify(defaultTmpl.detailedSections || [])),
        alertBox: JSON.parse(JSON.stringify(defaultTmpl.alertBox || { enabled: true, title: "", message: "", type: "note" })),
      }));
    }
  };

  // Admin Profile & Appearance state
  const [adminUser, setAdminUser] = useState<any>(null);
  const [theme, setTheme] = useState<AdminTheme>("light");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");

  // Signature and Logo upload state
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureMsg, setSignatureMsg] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Keepsake Studio Showcase Images state
  const [isKeepsakeMediaPickerOpen, setIsKeepsakeMediaPickerOpen] = useState(false);
  const [activeKeepsakeSlot, setActiveKeepsakeSlot] = useState<number | null>(null);
  const [uploadingKeepsakeSlot, setUploadingKeepsakeSlot] = useState<number | null>(null);

  // Promotional Announcement Banner Media Picker state
  const [isBannerMediaPickerOpen, setIsBannerMediaPickerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setSettings({
            ...data,
            cityShippingRates: Array.isArray(data.cityShippingRates) ? data.cityShippingRates : [],
          });
        }
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

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSignature(true);
    setSignatureMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setSettings((prev: any) => ({ ...prev, signatureUrl: data.url }));
        setSignatureMsg("Signature uploaded successfully! Remember to click 'Save Settings' to apply across all generated receipts.");
      } else {
        alert(data.error || "Failed to upload signature image.");
      }
    } catch {
      alert("Signature upload error.");
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setSettings((prev: any) => ({ ...prev, logoUrl: data.url }));
      } else {
        alert(data.error || "Failed to upload logo image.");
      }
    } catch {
      alert("Logo upload error.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const DEFAULT_KEEPSAKE_IMAGES = ["", "", "", ""];

  const handleKeepsakeUrlChange = (index: number, val: string) => {
    const current = [
      ...(Array.isArray(settings.keepsakeStudioImages) && settings.keepsakeStudioImages.length > 0
        ? settings.keepsakeStudioImages
        : DEFAULT_KEEPSAKE_IMAGES),
    ];
    current[index] = val;
    setSettings((prev: any) => ({ ...prev, keepsakeStudioImages: current }));
  };

  const handleKeepsakeUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKeepsakeSlot(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const current = [
          ...(Array.isArray(settings.keepsakeStudioImages) && settings.keepsakeStudioImages.length > 0
            ? settings.keepsakeStudioImages
            : DEFAULT_KEEPSAKE_IMAGES),
        ];
        current[index] = data.url;
        setSettings((prev: any) => ({ ...prev, keepsakeStudioImages: current }));
      } else {
        alert(data.error || "Failed to upload image.");
      }
    } catch {
      alert("Error uploading keepsake image.");
    } finally {
      setUploadingKeepsakeSlot(null);
    }
  };

  const handleOpenKeepsakePicker = (index: number) => {
    setActiveKeepsakeSlot(index);
    setIsKeepsakeMediaPickerOpen(true);
  };

  const handleKeepsakeMediaSelect = (selected: { url: string }[]) => {
    if (!selected || selected.length === 0 || activeKeepsakeSlot === null) return;
    const current = [
      ...(Array.isArray(settings.keepsakeStudioImages) && settings.keepsakeStudioImages.length > 0
        ? settings.keepsakeStudioImages
        : DEFAULT_KEEPSAKE_IMAGES),
    ];
    current[activeKeepsakeSlot] = selected[0].url;
    setSettings((prev: any) => ({ ...prev, keepsakeStudioImages: current }));
    setIsKeepsakeMediaPickerOpen(false);
    setActiveKeepsakeSlot(null);
  };

  const handleResetKeepsakeDefaults = () => {
    if (confirm("Clear all Keepsake Studio showcase images?")) {
      setSettings((prev: any) => ({
        ...prev,
        keepsakeStudioImages: ["", "", "", ""],
      }));
    }
  };

  const handleSelectBannerFromLibrary = (selected: { url: string }[]) => {
    if (selected && selected.length > 0) {
      setSettings((prev: any) => ({ ...prev, popupBannerImageUrl: selected[0].url }));
    }
    setIsBannerMediaPickerOpen(false);
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
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("site-settings-updated"));
        }
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
                      accept="image/*,.heic,.heif,image/heic,image/heif"
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

        {/* Microsoft Clarity Analytics, Recordings & Heatmaps */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4EBE6] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF4EC] text-[#B8972E] border border-[#E8E0D5] flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-[#B8972E]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-serif text-base font-bold text-[#2C332D]">
                    Microsoft Clarity Analytics & Visitor Recordings
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8EFE8] text-[#2E7D32] border border-[#C5D8C5]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse mr-1" />
                    Tracking Active
                  </span>
                </div>
                <p className="text-xs text-[#736C66] mt-0.5">
                  Full behavior analytics: daily visitor counts, session recordings playback, heatmaps, and funnel insights.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href="https://clarity.microsoft.com/projects/view/z9u8cerkjx/dashboard"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#2C332D] text-white hover:bg-[#3D473E] text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Open Clarity Dashboard</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>

          {/* Quick Metrics & Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://clarity.microsoft.com/projects/view/z9u8cerkjx/dashboard"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5]/70 hover:bg-white hover:border-[#D4AF37] hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E0D5] flex items-center justify-center text-[#B8972E]">
                  <Eye className="w-4 h-4" />
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#8C827A] group-hover:text-[#2C332D]" />
              </div>
              <h3 className="text-xs font-bold text-[#2C332D]">Daily Traffic & Visitors</h3>
              <p className="text-[11px] text-[#736C66] mt-1 leading-relaxed">
                See exact daily traffic, distinct visitors, pages viewed per session, active live users, and top geographic cities across India.
              </p>
            </a>

            <a
              href="https://clarity.microsoft.com/projects/view/z9u8cerkjx/recordings"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5]/70 hover:bg-white hover:border-[#D4AF37] hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E0D5] flex items-center justify-center text-[#B8972E]">
                  <Video className="w-4 h-4" />
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#8C827A] group-hover:text-[#2C332D]" />
              </div>
              <h3 className="text-xs font-bold text-[#2C332D]">Visitor Session Recordings</h3>
              <p className="text-[11px] text-[#736C66] mt-1 leading-relaxed">
                Watch full video recordings of customers browsing your shop, selecting resin colors, adding to cart, and checking out.
              </p>
            </a>

            <a
              href="https://clarity.microsoft.com/projects/view/z9u8cerkjx/heatmaps"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5]/70 hover:bg-white hover:border-[#D4AF37] hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E0D5] flex items-center justify-center text-[#B8972E]">
                  <Activity className="w-4 h-4" />
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#8C827A] group-hover:text-[#2C332D]" />
              </div>
              <h3 className="text-xs font-bold text-[#2C332D]">Click & Scroll Heatmaps</h3>
              <p className="text-[11px] text-[#736C66] mt-1 leading-relaxed">
                Visual heatmaps on desktop and mobile revealing where visitors click the most and how deep down pages they scroll.
              </p>
            </a>
          </div>

          {/* Project Details Footer */}
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E0D5] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-[#736C66]">Clarity Project ID:</span>
              <code className="font-mono font-bold text-[#2C332D] bg-white px-2 py-0.5 rounded border border-[#E8E0D5]">
                z9u8cerkjx
              </code>
            </div>
            <span className="text-[11px] text-[#736C66]">
              Configured globally across storefront, cart, product catalogs, and checkout.
            </span>
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

          {/* Store Logo Customizer */}
          <div className="pt-3 border-t border-[#F4EBE6]">
            <label className="text-xs font-semibold text-[#2C332D] block mb-2">
              Official Store Brand Logo
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border border-[#E8E0D5] bg-[#FAF8F5] p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Store Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-[#A89F91]" />
                )}
              </div>
              <div className="space-y-1.5">
                <input
                  type="file"
                  id="logoUploadInput"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml, image/heic, image/heif, .heic, .heif"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById("logoUploadInput")?.click()}
                    disabled={uploadingLogo}
                    className="px-3.5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E] flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? "Uploading..." : settings.logoUrl ? "Change Store Logo" : "Upload Store Logo"}</span>
                  </button>
                  {settings.logoUrl && settings.logoUrl !== "/images/logo/resin_logo.png" && (
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logoUrl: "/images/logo/resin_logo.png" })}
                      className="px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-semibold rounded-xl transition"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#736C66]">
                  Rendered prominently on the website header and printed on official customer payment receipts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Authorized Signature with Stamp */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-5">
          <div className="border-b border-[#F4EBE6] pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FAF0F3] text-[#800020] flex items-center justify-center border border-[#E8C568]/40">
                <PenTool className="w-4 h-4 text-[#800020]" />
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-[#2C332D]">
                  Authorized Signature with Stamp
                </h2>
                <p className="text-xs text-[#736C66] mt-0.5">
                  Uploaded signature with stamp is automatically fetched and placed on official customer payment receipts and PDF invoices for paid orders.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D32] bg-[#E8EFE8] px-2.5 py-0.5 rounded-full border border-[#C5D8C5]">
              Receipt Ready
            </span>
          </div>

          {signatureMsg && (
            <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32] flex items-center justify-between">
              <span>{signatureMsg}</span>
              <button type="button" onClick={() => setSignatureMsg("")} className="underline text-[11px]">
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Signature with Stamp Upload & Preview Card */}
            <div className="p-5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2C332D]">
                  Signature with Stamp
                </span>
                <span className="text-[10px] text-[#8C7A72]">
                  {settings.signatureUrl ? "Configured" : "Not Set"}
                </span>
              </div>

              <div className="h-40 rounded-xl border border-dashed border-[#D4AF37]/60 bg-white flex flex-col items-center justify-center p-3 relative overflow-hidden shadow-inner">
                {settings.signatureUrl ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={settings.signatureUrl}
                      alt="Authorized Signature with Stamp"
                      className="max-h-24 max-w-full object-contain filter contrast-125"
                    />
                    <div className="w-48 border-t border-gray-400 mt-2 pt-1 text-center">
                      <span className="text-[10px] font-serif text-[#736C66] tracking-widest uppercase block font-semibold">
                        Authorized Signatory &amp; Stamp
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[#8C7A72] space-y-1.5">
                    <PenTool className="w-7 h-7 mx-auto text-[#C5B8B0]" />
                    <p className="text-xs font-medium text-[#2C332D]">No Signature with Stamp Uploaded Yet</p>
                    <p className="text-[11px] text-[#A89F91]">
                      Upload a photo or transparent PNG of your signature together with your official rubber stamp
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="file"
                  id="signatureUploadInput"
                  accept="image/png, image/jpeg, image/webp, image/heic, image/heif, .heic, .heif"
                  className="hidden"
                  onChange={handleSignatureUpload}
                  disabled={uploadingSignature}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("signatureUploadInput")?.click()}
                  disabled={uploadingSignature}
                  className="px-4 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E] flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {uploadingSignature
                      ? "Uploading..."
                      : settings.signatureUrl
                      ? "Replace Signature with Stamp"
                      : "Upload Signature with Stamp"}
                  </span>
                </button>

                {settings.signatureUrl && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, signatureUrl: "" })}
                    className="px-3.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded-xl transition flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>

            {/* Receipt Integration Guide */}
            <div className="p-5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2C332D] block">
                Automatic Receipt Integration
              </span>

              <div className="p-4 bg-white rounded-xl border border-[#E8E0D5] space-y-2 text-xs">
                <p className="font-semibold text-[#800020]">How it appears on customer receipts:</p>
                <ul className="space-y-1.5 text-[11px] text-[#736C66] list-disc list-inside">
                  <li>Positioned cleanly in the authorized signatory space at the bottom right.</li>
                  <li>Seamlessly integrated without inner partitioning lines.</li>
                  <li>Accompanied by the studio logo rendered as a subtle background watermark.</li>
                  <li>Ready to download as PDF or print immediately for paid orders.</li>
                </ul>
              </div>

              <p className="text-[11px] text-[#736C66] leading-relaxed">
                When an order is marked as <strong>Paid</strong> in Admin Orders, clicking <strong>&ldquo;Receipt (PDF)&rdquo;</strong> generates the complete receipt featuring this official signature with stamp.
              </p>
            </div>
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

          {/* City / State Specific Shipping Charges */}
          <div className="pt-4 border-t border-[#F4EBE6] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-[#2C332D] flex items-center gap-1.5 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-[#B8972E]" />
                  <span>City & State Specific Shipping Charges</span>
                </h3>
                <p className="text-[11px] text-[#736C66] mt-0.5">
                  Set custom delivery fees for specific cities or states. Rates set for any city (e.g. Mumbai) or state (e.g. Maharashtra) automatically apply to the entire state and all cities within it, unless a specific city rate is defined.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentRates = Array.isArray(settings.cityShippingRates) ? settings.cityShippingRates : [];
                  setSettings({
                    ...settings,
                    cityShippingRates: [
                      ...currentRates,
                      { id: `city_${Date.now()}`, name: "", charge: "40.00" },
                    ],
                  });
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F3EEE6] text-[#2C332D] border border-[#E8E0D5] rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#B8972E]" />
                <span>Add City / State</span>
              </button>
            </div>

            {/* Indian State & City Suggestions Datalist */}
            <datalist id="indian-region-suggestions">
              {Object.keys(INDIAN_STATES_DATA).map((state) => (
                <option key={state} value={state}>
                  {state} (Entire State)
                </option>
              ))}
              <option value="Mumbai">Mumbai (Maharashtra)</option>
              <option value="Pune">Pune (Maharashtra)</option>
              <option value="Nagpur">Nagpur (Maharashtra)</option>
              <option value="Nashik">Nashik (Maharashtra)</option>
              <option value="Thane">Thane (Maharashtra)</option>
              <option value="Bengaluru">Bengaluru (Karnataka)</option>
              <option value="Mysuru">Mysuru (Karnataka)</option>
              <option value="Mangaluru">Mangaluru (Karnataka)</option>
              <option value="Ahmedabad">Ahmedabad (Gujarat)</option>
              <option value="Surat">Surat (Gujarat)</option>
              <option value="Vadodara">Vadodara (Gujarat)</option>
              <option value="Rajkot">Rajkot (Gujarat)</option>
              <option value="Jaipur">Jaipur (Rajasthan)</option>
              <option value="Jodhpur">Jodhpur (Rajasthan)</option>
              <option value="Udaipur">Udaipur (Rajasthan)</option>
              <option value="Delhi">Delhi NCR</option>
              <option value="Noida">Noida (Uttar Pradesh)</option>
              <option value="Lucknow">Lucknow (Uttar Pradesh)</option>
              <option value="Kanpur">Kanpur (Uttar Pradesh)</option>
              <option value="Kolkata">Kolkata (West Bengal)</option>
              <option value="Chennai">Chennai (Tamil Nadu)</option>
              <option value="Coimbatore">Coimbatore (Tamil Nadu)</option>
              <option value="Hyderabad">Hyderabad (Telangana)</option>
              <option value="Kochi">Kochi (Kerala)</option>
              <option value="Chandigarh">Chandigarh</option>
              <option value="Panaji">Panaji (Goa)</option>
            </datalist>

            {Array.isArray(settings.cityShippingRates) && settings.cityShippingRates.length > 0 ? (
              <div className="border border-[#E8E0D5] rounded-xl overflow-hidden divide-y divide-[#F4EBE6] bg-[#FAF8F5]">
                <div className="grid grid-cols-12 px-3.5 py-2 text-[10px] font-bold text-[#8C7A72] uppercase tracking-wider bg-[#F4EBE6]/60">
                  <div className="col-span-6 sm:col-span-7">City or State Name</div>
                  <div className="col-span-4 sm:col-span-4">Shipping Price (₹)</div>
                  <div className="col-span-2 sm:col-span-1 text-right">Action</div>
                </div>
                {settings.cityShippingRates.map((rate: any, index: number) => {
                  const resolvedState = rate.name ? findStateForLocation(rate.name) : null;
                  const isDirectState =
                    resolvedState &&
                    rate.name.trim().toLowerCase() === resolvedState.toLowerCase();

                  return (
                    <div key={rate.id || index} className="grid grid-cols-12 items-center px-3 py-2.5 gap-2 bg-white hover:bg-[#FAF8F5] transition-colors">
                      <div className="col-span-6 sm:col-span-7">
                        <input
                          type="text"
                          list="indian-region-suggestions"
                          placeholder="e.g. Mumbai, Maharashtra, Rajasthan, Delhi..."
                          value={rate.name || ""}
                          onChange={(e) => {
                            const updated = [...settings.cityShippingRates];
                            updated[index] = { ...updated[index], name: e.target.value };
                            setSettings({ ...settings, cityShippingRates: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                        {resolvedState && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#2F5233]">
                            <CheckCircle2 className="w-3 h-3 text-[#2F5233] shrink-0" />
                            <span>
                              {isDirectState
                                ? `State: ${resolvedState} (Applies to all cities in ${resolvedState})`
                                : `Belongs to ${resolvedState} (Applies to all cities in ${resolvedState})`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="col-span-4 sm:col-span-4 flex items-center gap-1">
                        <span className="text-xs text-[#736C66] font-semibold">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="40.00"
                          value={rate.charge ?? ""}
                          onChange={(e) => {
                            const updated = [...settings.cityShippingRates];
                            updated[index] = { ...updated[index], charge: e.target.value };
                            setSettings({ ...settings, cityShippingRates: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = settings.cityShippingRates.filter((_: any, i: number) => i !== index);
                            setSettings({ ...settings, cityShippingRates: updated });
                          }}
                          className="p-1.5 text-[#DF4C4C] hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove city rate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-[#E8E0D5] bg-[#FAF8F5] text-center">
                <p className="text-xs text-[#736C66]">
                  No custom city rates added yet. The default domestic shipping fee of ₹{settings.defaultShippingCharge || "79.00"} will apply to all cities.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      cityShippingRates: [
                        { id: `city_${Date.now()}_1`, name: "Mumbai", charge: "40.00" },
                        { id: `city_${Date.now()}_2`, name: "Maharashtra", charge: "60.00" },
                        { id: `city_${Date.now()}_3`, name: "Rajasthan", charge: "80.00" },
                      ],
                    });
                  }}
                  className="mt-2 text-[11px] font-bold text-[#B8972E] hover:underline"
                >
                  + Add Sample Rates (Mumbai ₹40, Maharashtra ₹60, Rajasthan ₹80)
                </button>
              </div>
            )}
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
                  accept="image/png, image/jpeg, image/webp, image/heic, image/heif, .heic, .heif"
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

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={settings.festivalDiscountType || "percentage"}
                    onChange={(e) => {
                      const type = e.target.value;
                      setSettings({
                        ...settings,
                        festivalDiscountType: type,
                        festivalDiscountPercentage: type === "fixed" && settings.festivalDiscountAmount ? `₹${settings.festivalDiscountAmount} OFF` : settings.festivalDiscountPercentage,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <option value="percentage">Percentage (%) Discount</option>
                    <option value="fixed">Direct Fixed Amount (₹) Discount</option>
                  </select>
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

              <div>
                {settings.festivalDiscountType === "fixed" ? (
                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Direct Fixed Discount Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-[#D4AF37]">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="e.g. 150 (for ₹150 OFF)"
                        value={settings.festivalDiscountAmount || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings({
                            ...settings,
                            festivalDiscountAmount: val,
                            festivalDiscountPercentage: val ? `₹${val} OFF` : "",
                          });
                        }}
                        className="w-full pl-8 pr-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37] font-semibold text-[#6A162B]"
                      />
                    </div>
                    <p className="text-[10px] text-[#7A5E68] mt-1">
                      Customers will receive a flat direct ₹{Number(settings.festivalDiscountAmount || 0)} discount.
                    </p>
                  </div>
                ) : (
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
                    <p className="text-[10px] text-[#7A5E68] mt-1">
                      Percentage discount applied across festival catalog and announcement banners.
                    </p>
                  </div>
                )}
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

        {/* Promotional Announcement Banner & 3-Second Welcome Popup */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4EBE6] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0F3] text-[#B84A67] flex items-center justify-center shadow-xs">
                <Megaphone className="w-5 h-5 text-[#B84A67]" />
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-[#2C332D] flex items-center space-x-2">
                  <span>Promotional Tagline & 3-Second Welcome Popup Banner</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0F3] text-[#800020] border border-[#EFE3E7]">
                    Popup + Moving Strip
                  </span>
                </h2>
                <p className="text-xs text-[#736C66]">
                  Upload an announcement image or write a studio tagline with an expiration timer. Visitors see a welcome popup 3 seconds after opening the website (dismissible by clicking [✕] or anywhere on the screen), and the tagline moves as a header strip at the same top location until expiry.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={Boolean(settings.popupBannerActive)}
                onChange={(e) => setSettings({ ...settings, popupBannerActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6A162B]"></div>
              <span className="ml-3 text-xs font-bold text-[#2C332D]">
                {settings.popupBannerActive ? "Active" : "Disabled"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Form Controls */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Announcement Tagline (Moving Header Strip & Popup Headline)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. ✨ Studio Special: Complimentary Custom Gift Packaging on all Personalized Keepsakes! Handcrafted with Love ✨"
                  value={settings.popupBannerTagline || ""}
                  onChange={(e) => setSettings({ ...settings, popupBannerTagline: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37]"
                />
                <p className="text-[10px] text-[#7A5E68] mt-1">
                  When set, this is displayed as a moving ticker strip across the top of the website (at the same place as the festive strip).
                </p>
              </div>

              {/* Expiry Date & Time */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#2C332D]">
                    Duration & Expiration (Date & Time)
                  </label>
                  {settings.popupBannerExpiresAt && (
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, popupBannerExpiresAt: null })}
                      className="text-[10px] text-red-600 hover:underline"
                    >
                      Clear Expiry (No Expiry)
                    </button>
                  )}
                </div>
                <input
                  type="datetime-local"
                  value={toDateTimeLocal(settings.popupBannerExpiresAt)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings({
                      ...settings,
                      popupBannerExpiresAt: val ? new Date(val).toISOString() : null,
                    });
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37]"
                />
                <p className="text-[10px] text-[#7A5E68] mt-1">
                  After this date & time, both the 3-second popup and announcement strip will automatically stop displaying.
                </p>
              </div>

              {/* Target Link & Button Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Explore Now / Shop Deals"
                    value={settings.popupBannerButtonText || ""}
                    onChange={(e) => setSettings({ ...settings, popupBannerButtonText: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Target Link URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /shop or /custom-orders"
                    value={settings.popupBannerLinkUrl || ""}
                    onChange={(e) => setSettings({ ...settings, popupBannerLinkUrl: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Image Upload for Popup */}
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Popup Banner Image (Optional)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    id="popupBannerImageInput"
                    accept="image/png, image/jpeg, image/webp, image/heic, image/heif, .heic, .heif"
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
                          setSettings((prev: any) => ({ ...prev, popupBannerImageUrl: data.url }));
                        } else {
                          alert(data.error || "Failed to upload banner image.");
                        }
                      } catch {
                        alert("Upload error.");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("popupBannerImageInput")?.click()}
                    className="px-4 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E] transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{settings.popupBannerImageUrl ? "Upload New File" : "Upload Banner Image"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBannerMediaPickerOpen(true)}
                    className="px-3.5 py-2 bg-[#FAF4EC] border border-[#D4AF37] text-[#7A6117] hover:bg-[#F3EAD9] text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Select an image from existing media library"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#B8972E]" />
                    <span>Select from Media Gallery</span>
                  </button>

                  {settings.popupBannerImageUrl && (
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, popupBannerImageUrl: "" })}
                      className="px-3 py-2 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#7A5E68] mt-1">
                  Upload promotional banner artwork (PNG, JPEG, WEBP). Recommended: 1200×630px or 16:9 banner format.
                </p>
              </div>
            </div>

            {/* Right Column: Live Previews */}
            <div className="space-y-4">
              <label className="text-xs font-semibold text-[#2C332D] block">
                Live Preview: 3-Second Welcome Popup Modal
              </label>
              <div className="bg-[#FAF8F5] border border-[#E8E0D5] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
                <div className="w-full max-w-sm bg-white rounded-2xl border border-[#D4AF37]/40 shadow-lg overflow-hidden text-center relative">
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-[11px] font-bold z-10">
                    ✕
                  </div>
                  {settings.popupBannerImageUrl ? (
                    <div className="relative w-full bg-gradient-to-br from-[#1F0712] via-[#2D0B1B] to-[#15040C] flex items-center justify-center overflow-hidden">
                      <img
                        src={settings.popupBannerImageUrl}
                        alt="Preview"
                        className="w-full h-auto max-h-52 object-contain block mx-auto"
                      />
                    </div>
                  ) : null}
                  <div className="p-4 space-y-2">
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#800020] bg-[#FAF0F3] px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      <span>Studio Announcement</span>
                    </span>
                    <p className="text-xs font-serif font-bold text-[#260B14] line-clamp-2 px-1">
                      {settings.popupBannerTagline || "Your announcement tagline will appear here"}
                    </p>
                    <div className="pt-1">
                      <span className="inline-block px-4 py-1.5 rounded-full bg-[#260B14] text-[#FFF6E5] text-[10px] font-bold uppercase tracking-wider">
                        {settings.popupBannerButtonText || "Explore Now"} →
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    settings.popupBannerActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {settings.popupBannerActive ? "● Active on Website" : "○ Currently Inactive"}
                  </span>
                </div>
              </div>

              {/* Strip Preview */}
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Live Preview: Header Announcement Strip
                </label>
                <div className="w-full bg-[#260B14] border-y border-[#D4AF37]/40 py-2 px-3 text-white flex items-center space-x-3 text-xs overflow-hidden rounded-xl">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0 animate-pulse" />
                  <span className="truncate text-[#FFECC7] text-xs flex-1">
                    {settings.popupBannerTagline || "✨ Announcement tagline moves across the full width here ✨"}
                  </span>
                  <span className="flex-shrink-0 text-[10px] font-bold bg-[#D4AF37] text-[#260B14] px-2 py-0.5 rounded-full">
                    {settings.popupBannerButtonText || "Explore Now"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personalised Keepsake Studio Showcase Images */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4EBE6] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0F3] text-[#B84A67] flex items-center justify-center shadow-xs">
                <ImageIcon className="w-5 h-5 text-[#B84A67]" />
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-[#2C332D] flex items-center space-x-2">
                  <span>Personalised Keepsake Studio Showcase Images</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0F3] text-[#800020] border border-[#EFE3E7]">
                    Homepage Showcase
                  </span>
                </h2>
                <p className="text-xs text-[#736C66]">
                  Select or upload the 4 images displayed in the homepage &quot;Turn Precious Memories into Everlasting Art&quot; keepsake studio section.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetKeepsakeDefaults}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#8C6E79] hover:text-[#3A1823] border border-[#E8E0D5] hover:border-[#D4AF37] rounded-xl bg-[#FAF8F5] transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Showcase Images</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                slot: 0,
                title: "Slot 1: Square Main Frame",
                ratio: "Aspect 1:1 (Square)",
                desc: "Illuminated photo frame or keepsake block",
              },
              {
                slot: 1,
                title: "Slot 2: Keychain / Initial",
                ratio: "Aspect 4:3 (Landscape)",
                desc: "Custom letter keychain or small pendant",
              },
              {
                slot: 2,
                title: "Slot 3: Entrance Nameplate",
                ratio: "Aspect 4:3 (Landscape)",
                desc: "Resin nameplate or home plaque",
              },
              {
                slot: 3,
                title: "Slot 4: Garland Preservation",
                ratio: "Aspect 1:1 (Square)",
                desc: "Wedding garland preservation dish",
              },
            ].map(({ slot, title, ratio, desc }) => {
              const currentImages = Array.isArray(settings.keepsakeStudioImages) && settings.keepsakeStudioImages.length > 0
                ? settings.keepsakeStudioImages
                : DEFAULT_KEEPSAKE_IMAGES;
              const imgUrl = currentImages[slot] || "";
              const isUploadingThis = uploadingKeepsakeSlot === slot;

              return (
                <div
                  key={slot}
                  className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E0D5] hover:border-[#D4AF37] transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-xs font-bold text-[#2C332D]">
                        {title}
                      </span>
                      <span className="text-[10px] text-[#8C6E79] font-mono">
                        #{slot + 1}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#736C66] line-clamp-1">
                      {desc}
                    </p>

                    {/* Image Preview */}
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-white border border-[#E8E0D5] shadow-xs group">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#8C6E79] p-3 text-center text-xs space-y-1">
                          <ImageIcon className="w-7 h-7 text-[#D5C2CA]" />
                          <span className="font-medium text-[11px] text-[#736C66]">No Image Set</span>
                          <span className="text-[10px] text-[#A89FA4]">Tap Upload or Library below</span>
                        </div>
                      )}

                      {isUploadingThis && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold">
                          <Loader2 className="w-5 h-5 animate-spin mr-1.5" />
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & URL Input */}
                  <div className="space-y-2 pt-2 border-t border-[#E8E0D5]">
                    <div>
                      <label className="text-[10px] font-semibold text-[#736C66] block mb-1">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={imgUrl || ""}
                        onChange={(e) => handleKeepsakeUrlChange(slot, e.target.value)}
                        placeholder="https://..."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8E0D5] rounded-lg font-mono text-[11px] focus:ring-1 focus:ring-[#D4AF37]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {/* Direct Upload Button */}
                      <label className="cursor-pointer px-2 py-1.5 bg-white border border-[#E8E0D5] hover:border-[#D4AF37] hover:bg-[#FAF0F3] text-[#3A1823] rounded-lg text-[10px] font-semibold flex items-center justify-center space-x-1 transition-all active:scale-95 text-center">
                        <Upload className="w-3 h-3 text-[#B84A67]" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*,.heic,.heif,image/heic,image/heif"
                          onChange={(e) => handleKeepsakeUpload(slot, e)}
                          className="hidden"
                          disabled={isUploadingThis}
                        />
                      </label>

                      {/* Pick from Media Library */}
                      <button
                        type="button"
                        onClick={() => handleOpenKeepsakePicker(slot)}
                        className="px-2 py-1.5 bg-white border border-[#E8E0D5] hover:border-[#D4AF37] hover:bg-[#FAF0F3] text-[#3A1823] rounded-lg text-[10px] font-semibold flex items-center justify-center space-x-1 transition-all active:scale-95 text-center"
                      >
                        <ImageIcon className="w-3 h-3 text-[#D4AF37]" />
                        <span>Library</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Policies & Resin Care Instructions - Structured Studio Editor */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
          <div className="border-b border-[#F4EBE6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#B8972E]" />
                <h2 className="font-serif text-base font-bold text-[#2C332D]">
                  Customer Policy Pages & Resin Care Studio Editor
                </h2>
              </div>
              <p className="text-xs text-[#736C66] mt-1">
                Configure structured policy content matching the live page design: Official Statement, Key Highlight Cards, Detailed Guidelines & Tips, and Highlighted Advisory Callout boxes.
              </p>
            </div>

            {/* Quick Live Links */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-[#8C827A] font-medium">Live pages:</span>
              <Link
                href="/policies/shipping"
                target="_blank"
                className="inline-flex items-center space-x-1 text-[#8C6E79] hover:text-[#2C332D] underline font-medium"
              >
                <span>Shipping</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
              <span>•</span>
              <Link
                href="/policies/returns"
                target="_blank"
                className="inline-flex items-center space-x-1 text-[#8C6E79] hover:text-[#2C332D] underline font-medium"
              >
                <span>Returns</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
              <span>•</span>
              <Link
                href="/policies/care"
                target="_blank"
                className="inline-flex items-center space-x-1 text-[#8C6E79] hover:text-[#2C332D] underline font-medium"
              >
                <span>Care Guide</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
              <span>•</span>
              <Link
                href="/policies/privacy"
                target="_blank"
                className="inline-flex items-center space-x-1 text-[#8C6E79] hover:text-[#2C332D] underline font-medium"
              >
                <span>Privacy</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
              <span>•</span>
              <Link
                href="/policies/terms"
                target="_blank"
                className="inline-flex items-center space-x-1 text-[#8C6E79] hover:text-[#2C332D] underline font-medium"
              >
                <span>Terms</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>

          {/* 5 Policy Selection Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#FAF8F5] p-2 rounded-xl border border-[#E8E0D5]">
            {([
              { key: "shipping", label: "Shipping Policy", icon: Truck },
              { key: "returns", label: "Returns & Exchange", icon: RotateCcw },
              { key: "care", label: "Resin Care Guide", icon: Sparkles },
              { key: "privacy", label: "Privacy Policy", icon: Lock },
              { key: "terms", label: "Terms & Conditions", icon: FileText },
            ] as const).map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = selectedPolicyType === tab.key;
              return (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => setSelectedPolicyType(tab.key)}
                  className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-[#2C332D] text-white shadow-sm"
                      : "bg-white text-[#5C554E] hover:text-[#2C332D] hover:bg-[#F2ECE4] border border-[#E8E0D5]"
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isSelected ? "text-[#D4AF37]" : "text-[#8C827A]"}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Policy Config Editor */}
          {(() => {
            const activePolicy = getActivePolicyConfig(selectedPolicyType);
            const template = defaultPolicyTemplates[selectedPolicyType];

            return (
              <div className="space-y-6 pt-2">
                {/* Policy Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5]">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8972E] bg-white px-2 py-0.5 rounded-full border border-[#E8E0D5]">
                        Editing Policy Page
                      </span>
                      <h3 className="text-sm font-bold text-[#2C332D] font-serif">
                        {template?.name || selectedPolicyType}
                      </h3>
                    </div>
                    <p className="text-xs text-[#736C66] mt-0.5">
                      Configure custom data for this policy, or load pre-curated studio defaults anytime.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/policies/${selectedPolicyType}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-white text-[#2C332D] hover:text-[#B8972E] text-xs font-semibold rounded-lg border border-[#E8E0D5] flex items-center space-x-1.5 transition-colors"
                    >
                      <span>View Live Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleLoadDefaultTemplate(selectedPolicyType)}
                      className="px-3 py-1.5 bg-[#F4EBE6] hover:bg-[#EADED7] text-[#2C332D] text-xs font-semibold rounded-lg border border-[#DAC9BF] flex items-center space-x-1.5 transition-colors"
                      title="Reset or prefill this policy with standard studio cards and sections"
                    >
                      <Copy className="w-3 h-3 text-[#B8972E]" />
                      <span>Load Studio Default Template</span>
                    </button>
                  </div>
                </div>

                {/* 1. Official Studio Policy Statement */}
                <div className="p-4 rounded-xl border border-[#E8E0D5] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#2C332D] flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#B8972E]" />
                      <span>1. Official Studio Policy Statement</span>
                    </label>
                    <span className="text-[11px] text-[#736C66]">
                      Top highlighted statement on the live page
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={activePolicy.statement || ""}
                    onChange={(e) =>
                      updateActivePolicy((prev: any) => ({
                        ...prev,
                        statement: e.target.value,
                      }))
                    }
                    placeholder="Enter the official introductory policy statement..."
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5]/50 border border-[#E8E0D5] rounded-xl focus:ring-1 focus:ring-[#D4AF37] leading-relaxed"
                  />
                </div>

                {/* 2. Key Highlight Cards */}
                <div className="p-4 rounded-xl border border-[#E8E0D5] bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-[#B8972E]" />
                        <label className="text-xs font-bold text-[#2C332D]">
                          2. Key Highlight Cards
                        </label>
                        <span className="text-[10px] font-bold text-[#B8972E] bg-[#FAF4EC] px-2 py-0.5 rounded-full border border-[#E8E0D5]">
                          {activePolicy.highlights?.length || 0} Cards
                        </span>
                      </div>
                      <p className="text-[11px] text-[#736C66] mt-0.5">
                        Feature overview cards displayed in the top visual grid of the policy page.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateActivePolicy((prev: any) => ({
                          ...prev,
                          highlights: [
                            ...(prev.highlights || []),
                            { title: "", desc: "" },
                          ],
                        }))
                      }
                      className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#2C332D] text-xs font-semibold rounded-lg border border-[#E8E0D5] flex items-center space-x-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>Add Display Card</span>
                    </button>
                  </div>

                  {(!activePolicy.highlights || activePolicy.highlights.length === 0) ? (
                    <div className="p-4 text-center rounded-xl border border-dashed border-[#E8E0D5] bg-[#FAF8F5] text-xs text-[#736C66]">
                      No highlight cards added yet. Click &quot;Add Display Card&quot; or &quot;Load Studio Default Template&quot; above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activePolicy.highlights.map((card: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5]/60 space-y-2 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] bg-white px-2 py-0.5 rounded border border-[#E8E0D5]">
                              Card #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateActivePolicy((prev: any) => ({
                                  ...prev,
                                  highlights: (prev.highlights || []).filter(
                                    (_: any, i: number) => i !== idx
                                  ),
                                }))
                              }
                              className="p-1 text-[#8C827A] hover:text-[#DC2626] transition-colors rounded"
                              title="Delete this card"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-[#5C554E] uppercase tracking-wider block mb-1">
                              Card Title
                            </label>
                            <input
                              type="text"
                              value={card.title || ""}
                              onChange={(e) =>
                                updateActivePolicy((prev: any) => {
                                  const next = [...(prev.highlights || [])];
                                  next[idx] = { ...next[idx], title: e.target.value };
                                  return { ...prev, highlights: next };
                                })
                              }
                              placeholder="e.g. 3-5 Days Curing Time"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8E0D5] rounded-lg focus:ring-1 focus:ring-[#D4AF37]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-[#5C554E] uppercase tracking-wider block mb-1">
                              Card Description
                            </label>
                            <textarea
                              rows={2}
                              value={card.desc || ""}
                              onChange={(e) =>
                                updateActivePolicy((prev: any) => {
                                  const next = [...(prev.highlights || [])];
                                  next[idx] = { ...next[idx], desc: e.target.value };
                                  return { ...prev, highlights: next };
                                })
                              }
                              placeholder="Brief description for this highlight card..."
                              className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8E0D5] rounded-lg focus:ring-1 focus:ring-[#D4AF37] leading-relaxed"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Comprehensive Policy Guidelines & Procedures */}
                <div className="p-4 rounded-xl border border-[#E8E0D5] bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-[#B8972E]" />
                        <label className="text-xs font-bold text-[#2C332D]">
                          3. Comprehensive Policy Guidelines & Procedures
                        </label>
                        <span className="text-[10px] font-bold text-[#B8972E] bg-[#FAF4EC] px-2 py-0.5 rounded-full border border-[#E8E0D5]">
                          {activePolicy.detailedSections?.length || 0} Sections
                        </span>
                      </div>
                      <p className="text-[11px] text-[#736C66] mt-0.5">
                        In-depth clauses, procedure timelines, and bullet point tips for the policy page.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateActivePolicy((prev: any) => ({
                          ...prev,
                          detailedSections: [
                            ...(prev.detailedSections || []),
                            { title: "", desc: "", tips: [] },
                          ],
                        }))
                      }
                      className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#2C332D] text-xs font-semibold rounded-lg border border-[#E8E0D5] flex items-center space-x-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#B8972E]" />
                      <span>Add Guideline Section</span>
                    </button>
                  </div>

                  {(!activePolicy.detailedSections || activePolicy.detailedSections.length === 0) ? (
                    <div className="p-4 text-center rounded-xl border border-dashed border-[#E8E0D5] bg-[#FAF8F5] text-xs text-[#736C66]">
                      No guideline sections added yet. Click &quot;Add Guideline Section&quot; to begin.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activePolicy.detailedSections.map((sec: any, idx: number) => {
                        const tipsText = Array.isArray(sec.tips)
                          ? sec.tips.join("\n")
                          : typeof sec.tips === "string"
                          ? sec.tips
                          : "";

                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5]/60 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] bg-white px-2.5 py-0.5 rounded border border-[#E8E0D5]">
                                Guideline Section #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateActivePolicy((prev: any) => ({
                                    ...prev,
                                    detailedSections: (prev.detailedSections || []).filter(
                                      (_: any, i: number) => i !== idx
                                    ),
                                  }))
                                }
                                className="p-1 text-[#8C827A] hover:text-[#DC2626] transition-colors rounded"
                                title="Delete this section"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-[#5C554E] uppercase tracking-wider block mb-1">
                                Section Heading / Title
                              </label>
                              <input
                                type="text"
                                value={sec.title || ""}
                                onChange={(e) =>
                                  updateActivePolicy((prev: any) => {
                                    const next = [...(prev.detailedSections || [])];
                                    next[idx] = { ...next[idx], title: e.target.value };
                                    return { ...prev, detailedSections: next };
                                  })
                                }
                                placeholder="e.g. 1. Order Processing & Artisan Crafting Schedule"
                                className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8E0D5] rounded-lg focus:ring-1 focus:ring-[#D4AF37]"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-[#5C554E] uppercase tracking-wider block mb-1">
                                Policy Clause Description
                              </label>
                              <textarea
                                rows={3}
                                value={sec.desc || ""}
                                onChange={(e) =>
                                  updateActivePolicy((prev: any) => {
                                    const next = [...(prev.detailedSections || [])];
                                    next[idx] = { ...next[idx], desc: e.target.value };
                                    return { ...prev, detailedSections: next };
                                  })
                                }
                                placeholder="Full procedure details, guidelines, or policy explanation..."
                                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E0D5] rounded-lg focus:ring-1 focus:ring-[#D4AF37] leading-relaxed"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-[#5C554E] uppercase tracking-wider block mb-1">
                                Actionable Tips & Bullet Points (One per line)
                              </label>
                              <textarea
                                rows={2}
                                value={tipsText}
                                onChange={(e) =>
                                  updateActivePolicy((prev: any) => {
                                    const next = [...(prev.detailedSections || [])];
                                    const lines = e.target.value
                                      .split("\n")
                                      .map((l) => l.trim())
                                      .filter(Boolean);
                                    next[idx] = { ...next[idx], tips: lines };
                                    return { ...prev, detailedSections: next };
                                  })
                                }
                                placeholder="Optional bullet points or guidelines (one per line)..."
                                className="w-full px-3 py-2 text-xs bg-white border border-[#E8E0D5] rounded-lg focus:ring-1 focus:ring-[#D4AF37] leading-relaxed font-mono"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Highlighted Note / Studio Advisory Callout */}
                <div className="p-4 rounded-xl border border-[#E8E0D5] bg-white space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-[#B8972E]" />
                      <label className="text-xs font-bold text-[#2C332D]">
                        4. Highlighted Note / Studio Advisory Callout
                      </label>
                    </div>

                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-[#2C332D]">
                      <input
                        type="checkbox"
                        checked={activePolicy.alertBox?.enabled !== false}
                        onChange={(e) =>
                          updateActivePolicy((prev: any) => ({
                            ...prev,
                            alertBox: {
                              ...(prev.alertBox || {}),
                              enabled: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 text-[#2C332D] rounded border-[#E8E0D5] focus:ring-[#D4AF37]"
                      />
                      <span>Show Advisory Box on Live Page</span>
                    </label>
                  </div>

                  {activePolicy.alertBox?.enabled !== false && (
                    <div className="p-4 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5]/60 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-[#5C554E] uppercase tracking-wider block mb-1">
                            Callout Style
                          </label>
                          <select
                            value={activePolicy.alertBox?.type || "note"}
                            onChange={(e) =>
                              updateActivePolicy((prev: any) => ({
                                ...prev,
                                alertBox: {
                                  ...(prev.alertBox || {}),
                                  type: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8E0D5] rounded-lg focus:ring-1 focus:ring-[#D4AF37]"
                          >
                            <option value="note">Artisan Studio Note (Amber / Warm Gold)</option>
                            <option value="warning">Important Warning / Claim Requirement (Rose / Red Alert)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#5C554E] uppercase tracking-wider block mb-1">
                            Advisory Box Title
                          </label>
                          <input
                            type="text"
                            value={activePolicy.alertBox?.title || ""}
                            onChange={(e) =>
                              updateActivePolicy((prev: any) => ({
                                ...prev,
                                alertBox: {
                                  ...(prev.alertBox || {}),
                                  title: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g. How to File a Quick Claim or Artisan Note"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8E0D5] rounded-lg focus:ring-1 focus:ring-[#D4AF37]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#5C554E] uppercase tracking-wider block mb-1">
                          Advisory Message & Guidance
                        </label>
                        <textarea
                          rows={2}
                          value={activePolicy.alertBox?.message || ""}
                          onChange={(e) =>
                            updateActivePolicy((prev: any) => ({
                              ...prev,
                              alertBox: {
                                ...(prev.alertBox || {}),
                                message: e.target.value,
                              },
                            }))
                          }
                          placeholder="e.g. Simply WhatsApp our studio with your unboxing video..."
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E8E0D5] rounded-lg focus:ring-1 focus:ring-[#D4AF37] leading-relaxed"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
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

      {/* Media Picker Modal for Personalised Keepsake Studio Images */}
      <MediaPickerModal
        isOpen={isKeepsakeMediaPickerOpen}
        onClose={() => {
          setIsKeepsakeMediaPickerOpen(false);
          setActiveKeepsakeSlot(null);
        }}
        multiple={false}
        title={
          activeKeepsakeSlot !== null
            ? `Select Image for Keepsake Studio Slot #${activeKeepsakeSlot + 1}`
            : "Select Keepsake Showcase Image"
        }
        onSelect={handleKeepsakeMediaSelect}
      />

      {/* Media Picker Modal for Promotional Announcement Banner */}
      <MediaPickerModal
        isOpen={isBannerMediaPickerOpen}
        onClose={() => setIsBannerMediaPickerOpen(false)}
        multiple={false}
        title="Select Promotional Banner from Media Gallery"
        onSelect={handleSelectBannerFromLibrary}
      />
    </div>
  );
}
