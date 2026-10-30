"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/lib/store/cart";
import {
  Package,
  MapPin,
  Sparkles,
  LogOut,
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  ShoppingBag,
} from "lucide-react";

interface AccountShellProps {
  children: React.ReactNode;
  customer: any;
  ordersCount?: number;
  onCustomerUpdated?: (updated: any) => void;
}

export function AccountLayoutShell({
  children,
  customer,
  ordersCount = 0,
  onCustomerUpdated,
}: AccountShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearCart } = useCart();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file (JPEG, PNG, WebP).");
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
      } else {
        setAvatarSuccess("Profile photo updated successfully!");
        if (onCustomerUpdated) {
          onCustomerUpdated({ ...customer, avatarUrl: data.avatarUrl });
        }
        window.dispatchEvent(new Event("customer-profile-updated"));
        window.dispatchEvent(new Event("customer-auth-changed"));
        setTimeout(() => setAvatarSuccess(""), 3000);
      }
    } catch {
      setAvatarError("Network error while updating avatar.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/customer/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    clearCart();
    window.dispatchEvent(new Event("customer-auth-changed"));
    router.push("/account/login");
  };

  const navLinks = [
    {
      name: "View Orders",
      href: "/account/orders",
      icon: Package,
      badge: ordersCount > 0 ? `${ordersCount}` : undefined,
    },
    {
      name: "Shipping Details",
      href: "/account/profile",
      icon: MapPin,
    },
    {
      name: "Care Guide",
      href: "/account/guide",
      icon: Sparkles,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* ---------------- 1. LUXURY CUSTOMER HERO CARD ---------------- */}
      <div className="relative bg-gradient-to-br from-[#3A1823] via-[#4D2230] to-[#2E121C] text-white rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden border border-[#D4AF37]/30">
        {/* Subtle Decorative Golden Glow Accent */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-radial from-[#D4AF37]/20 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
          {/* Avatar & Name */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-lg bg-[#2E121C] flex items-center justify-center">
                {customer?.avatarUrl ? (
                  <img
                    src={customer.avatarUrl}
                    alt={customer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-serif font-bold text-[#D4AF37]">
                    {customer?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>

              {/* Upload trigger overlay */}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                title="Change Profile Photo"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-0.5 text-[#D4AF37]" />
                    <span>Change</span>
                  </>
                )}
              </label>
              <input
                ref={fileInputRef}
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingAvatar}
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#FAF4EE]">
                  {customer?.name || "Valued Collector"}
                </h1>
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                  <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                  <span>Verified Client</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#E0D9D0] mt-1 font-sans font-light">
                {customer?.email}
              </p>
              {customer?.city && (
                <p className="text-xs text-[#D1C7BD] mt-1 flex items-center justify-center sm:justify-start space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>
                    {customer.city}, {customer.state || customer.country || "India"}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics / Action Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-[#FAF4EE] rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {avatarSuccess && (
          <div className="mt-4 p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{avatarSuccess}</span>
          </div>
        )}
        {avatarError && (
          <div className="mt-4 p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{avatarError}</span>
          </div>
        )}
      </div>

      {/* ---------------- 2. TOP HORIZONTAL NAVIGATION TABS ---------------- */}
      <div className="flex border-b border-[#E8E0D5] gap-2 sm:gap-6 text-xs sm:text-sm font-bold overflow-x-auto pb-px">
        {navLinks.map((item) => {
          const isActive = pathname === item.href || (item.href === "/account/orders" && pathname === "/account");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`pb-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap px-1 cursor-pointer ${
                isActive
                  ? "border-[#3A1823] text-[#3A1823] font-extrabold"
                  : "border-transparent text-[#736C66] hover:text-[#3A1823] hover:border-[#D4AF37]"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-[#B84A67]" : "text-[#8C7A72]"
                }`}
              />
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-1 px-2 py-0.5 text-[10px] bg-[#FAF0F3] text-[#B84A67] border border-[#EFE3E7] rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ---------------- 3. DEDICATED PAGE CONTENT ---------------- */}
      <div className="min-h-[400px]">{children}</div>
    </div>
  );
}

