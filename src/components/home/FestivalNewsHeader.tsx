"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Tag, ArrowRight, Clock, Check, Copy } from "lucide-react";

export interface FestivalNewsHeaderProps {
  settings: {
    festivalDiscountActive?: boolean;
    festivalName?: string;
    festivalTagline?: string;
    festivalDiscountType?: "percentage" | "fixed" | string | null;
    festivalDiscountPercentage?: string;
    festivalDiscountAmount?: number | string | null;
    festivalCouponCode?: string;
    festivalExpiresAt?: string | null;
    festivalBannerBg?: string;
    festivalCtaText?: string;
    festivalCtaUrl?: string;
  };
}

export function FestivalNewsHeader({ settings }: FestivalNewsHeaderProps) {
  const [copied, setCopied] = useState(false);

  // If banner is disabled, do not render
  if (!settings?.festivalDiscountActive) {
    return null;
  }

  const tagline =
    settings.festivalTagline ||
    "Special Festival Offers on Handcrafted Resin Art & Keepsakes! Enjoy Special Savings • Free Express Delivery across India over ₹999";
  const discount =
    settings.festivalDiscountType === "fixed" && settings.festivalDiscountAmount
      ? `₹${Number(settings.festivalDiscountAmount)} OFF`
      : settings.festivalDiscountPercentage || "20% OFF";
  const coupon = settings.festivalCouponCode || "FESTIVE20";
  const ctaText = settings.festivalCtaText || "Explore Festival Deals";
  const ctaUrl = settings.festivalCtaUrl || "/shop";
  const bgTheme = settings.festivalBannerBg || "royal_wine";

  // Check expiry
  let expiryText = "";
  if (settings.festivalExpiresAt) {
    try {
      const expiryDate = new Date(settings.festivalExpiresAt);
      if (!isNaN(expiryDate.getTime())) {
        const diffMs = expiryDate.getTime() - Date.now();
        if (diffMs <= 0) {
          expiryText = "Offer Expired";
        } else {
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
          if (days > 0) {
            expiryText = `Ends in ${days}d ${hours}h`;
          } else {
            expiryText = `Ends in ${hours}h`;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!coupon) return;
    navigator.clipboard?.writeText(coupon);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Color schemes matched to Devangi Resin Studio themes
  const colorMap: Record<
    string,
    {
      bg: string;
      border: string;
      fadeLeft: string;
      fadeRight: string;
      glow: string;
    }
  > = {
    royal_wine: {
      bg: "bg-gradient-to-r from-[#260B14] via-[#4A1525] to-[#260B14]",
      border: "border-[#D4AF37]/40",
      fadeLeft: "from-[#260B14]",
      fadeRight: "from-[#260B14]",
      glow: "shadow-[#D4AF37]/10",
    },
    amber_gold: {
      bg: "bg-gradient-to-r from-[#291705] via-[#4D2D0C] to-[#291705]",
      border: "border-[#F1C40F]/40",
      fadeLeft: "from-[#291705]",
      fadeRight: "from-[#291705]",
      glow: "shadow-[#F1C40F]/10",
    },
    deep_forest: {
      bg: "bg-gradient-to-r from-[#071F12] via-[#103D24] to-[#071F12]",
      border: "border-[#D4AF37]/40",
      fadeLeft: "from-[#071F12]",
      fadeRight: "from-[#071F12]",
      glow: "shadow-[#2ECC71]/10",
    },
    rose_noir: {
      bg: "bg-gradient-to-r from-[#1A0D15] via-[#381628] to-[#1A0D15]",
      border: "border-[#E899AA]/40",
      fadeLeft: "from-[#1A0D15]",
      fadeRight: "from-[#1A0D15]",
      glow: "shadow-[#C04E6C]/10",
    },
  };

  const currentTheme = colorMap[bgTheme] || colorMap.royal_wine;

  const renderTickerItem = (keyPrefix: string) => (
    <div
      key={keyPrefix}
      className="inline-flex items-center space-x-3 sm:space-x-5 px-3 sm:px-6"
    >
      {/* Tagline text */}
      <span className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-[#FFECC7] tracking-wide whitespace-nowrap">
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0 animate-pulse" />
        <span>{tagline}</span>
      </span>

      {/* Discount badge */}
      {discount && (
        <span className="inline-flex items-center text-[10px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#260B14] shadow-xs font-mono whitespace-nowrap">
          {discount}
        </span>
      )}

      {/* Coupon Code Pill (with copy functionality) */}
      {coupon && (
        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-[#FFDF78]/50 text-[#FFDF78] font-mono text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs"
          title="Tap to copy coupon code"
        >
          <Tag className="w-3 h-3 text-[#FFDF78]" />
          <span>CODE: {coupon}</span>
          {copied ? (
            <span className="inline-flex items-center text-emerald-300 font-extrabold ml-1">
              <Check className="w-3 h-3 mr-0.5" /> COPIED!
            </span>
          ) : (
            <Copy className="w-2.5 h-2.5 opacity-80 ml-0.5" />
          )}
        </button>
      )}

      {/* Expiry countdown */}
      {expiryText && (
        <span className="inline-flex items-center space-x-1 text-[10px] sm:text-xs text-amber-200/90 bg-black/40 px-2.5 py-0.5 rounded-full border border-amber-300/25 whitespace-nowrap font-mono">
          <Clock className="w-3 h-3 text-[#D4AF37]" />
          <span>{expiryText}</span>
        </span>
      )}

      {/* CTA Button */}
      {ctaText && (
        <Link
          href={ctaUrl}
          className="inline-flex items-center space-x-1.5 px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-white text-[#260B14] hover:bg-[#FFDF78] hover:text-[#260B14] active:scale-95 transition-all shadow-xs whitespace-nowrap"
        >
          <span>{ctaText}</span>
          <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </Link>
      )}

      {/* Decorative luxury star separator */}
      <span className="text-[#D4AF37]/60 text-xs sm:text-sm select-none pl-1">✦</span>
    </div>
  );

  return (
    <div
      className={`relative w-full overflow-hidden border-y ${currentTheme.border} ${currentTheme.bg} shadow-md ${currentTheme.glow} z-30 select-none`}
      style={{ touchAction: "pan-y" }}
    >
      {/* Decorative Gold Sheen Line at top */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80 pointer-events-none" />

      {/* Edge gradient feathering so text smoothly glides on and off screen */}
      <div
        className={`pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-16 bg-gradient-to-r ${currentTheme.fadeLeft} to-transparent z-10`}
      />
      <div
        className={`pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:w-16 bg-gradient-to-l ${currentTheme.fadeRight} to-transparent z-10`}
      />

      {/* Full-width continuous moving news strip */}
      <div className="w-full flex items-center py-2 sm:py-2.5 overflow-hidden">
        <div className="animate-festival-marquee flex items-center whitespace-nowrap">
          {/* Half 1 */}
          <div className="flex items-center">
            {renderTickerItem("h1-1")}
            {renderTickerItem("h1-2")}
            {renderTickerItem("h1-3")}
          </div>

          {/* Half 2 (Exact duplicate for seamless continuous infinite loop) */}
          <div className="flex items-center" aria-hidden="true">
            {renderTickerItem("h2-1")}
            {renderTickerItem("h2-2")}
            {renderTickerItem("h2-3")}
          </div>
        </div>
      </div>

      {/* Decorative Gold Sheen Line at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent pointer-events-none" />
    </div>
  );
}
