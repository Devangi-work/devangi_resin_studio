"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Tag, ArrowRight, Clock, Check, Copy } from "lucide-react";

export interface FestivalNewsHeaderProps {
  settings: {
    festivalDiscountActive?: boolean;
    festivalName?: string;
    festivalTagline?: string;
    festivalDiscountPercentage?: string;
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

  const name = settings.festivalName || "FESTIVAL SPECIAL CELEBRATION";
  const tagline =
    settings.festivalTagline ||
    "✨ Special Festival Offers on Handcrafted Resin Art & Keepsakes! Enjoy Flat 20% OFF ✨ Free Express Delivery across India over ₹999 ✨ Limited Period Festive Treats! ✨";
  const discount = settings.festivalDiscountPercentage || "20% OFF";
  const coupon = settings.festivalCouponCode || "FESTIVE20";
  const ctaText = settings.festivalCtaText || "Explore Festival Deals";
  const ctaUrl = settings.festivalCtaUrl || "/shop";
  const bgTheme = settings.festivalBannerBg || "royal_wine";

  // Check expiry
  let expiryText = "";
  let isExpired = false;
  if (settings.festivalExpiresAt) {
    try {
      const expiryDate = new Date(settings.festivalExpiresAt);
      if (!isNaN(expiryDate.getTime())) {
        const diffMs = expiryDate.getTime() - Date.now();
        if (diffMs <= 0) {
          isExpired = true;
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
  const colorMap: Record<string, { bg: string; border: string; badge: string; text: string; glow: string }> = {
    royal_wine: {
      bg: "bg-gradient-to-r from-[#260B14] via-[#4A1525] to-[#260B14]",
      border: "border-[#D4AF37]/40",
      badge: "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#260B14]",
      text: "text-[#FFF6E5]",
      glow: "shadow-[#D4AF37]/10",
    },
    amber_gold: {
      bg: "bg-gradient-to-r from-[#291705] via-[#4D2D0C] to-[#291705]",
      border: "border-[#F1C40F]/40",
      badge: "bg-gradient-to-r from-[#F39C12] to-[#F1C40F] text-[#291705]",
      text: "text-[#FFF9E6]",
      glow: "shadow-[#F1C40F]/10",
    },
    deep_forest: {
      bg: "bg-gradient-to-r from-[#071F12] via-[#103D24] to-[#071F12]",
      border: "border-[#D4AF37]/40",
      badge: "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#071F12]",
      text: "text-[#E8F8F0]",
      glow: "shadow-[#2ECC71]/10",
    },
    rose_noir: {
      bg: "bg-gradient-to-r from-[#1A0D15] via-[#381628] to-[#1A0D15]",
      border: "border-[#E899AA]/40",
      badge: "bg-gradient-to-r from-[#C04E6C] to-[#E899AA] text-white",
      text: "text-[#FFF0F4]",
      glow: "shadow-[#C04E6C]/10",
    },
  };

  const currentTheme = colorMap[bgTheme] || colorMap.royal_wine;

  return (
    <div
      className={`relative w-full overflow-hidden border-y ${currentTheme.border} ${currentTheme.bg} shadow-md ${currentTheme.glow} z-30`}
    >
      {/* Decorative Gold Sheen Line at top */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

      <div className="max-w-7xl mx-auto flex items-center justify-between py-2 sm:py-2.5 px-3 sm:px-6 relative">
        
        {/* Left Sticky News Header Badge */}
        <div className="flex-shrink-0 flex items-center space-x-2 z-20 pr-3 sm:pr-4">
          <span
            className={`inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm ${currentTheme.badge}`}
          >
            <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: "6s" }} />
            <span className="whitespace-nowrap">{name}</span>
          </span>

          {discount && (
            <span className="hidden md:inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/15 text-[#FFDF78] border border-[#FFDF78]/30 font-mono">
              {discount}
            </span>
          )}
        </div>

        {/* Center Scrolling News Ticker (Scrolling to Right) */}
        <div className="relative flex-1 overflow-hidden mx-2 sm:mx-4 mask-marquee">
          <div className="animate-festival-marquee-right flex items-center space-x-8 whitespace-nowrap text-xs sm:text-sm font-medium tracking-wide text-white/95">
            {/* Ticker Content Chunk 1 */}
            <div className="flex items-center space-x-8">
              <span className="flex items-center space-x-2 text-[#FFECC7]">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                <span>{tagline}</span>
              </span>

              {coupon && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-white/15 hover:bg-white/25 border border-[#FFDF78]/50 text-[#FFDF78] font-mono text-[11px] font-bold transition-colors cursor-pointer"
                  title="Click to copy coupon code"
                >
                  <Tag className="w-3 h-3 text-[#FFDF78]" />
                  <span>CODE: {coupon}</span>
                  {copied ? (
                    <Check className="w-3 h-3 text-green-300" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 opacity-70" />
                  )}
                </button>
              )}

              {expiryText && (
                <span className="inline-flex items-center space-x-1 text-[11px] text-amber-200/90 bg-black/30 px-2 py-0.5 rounded-full border border-amber-300/20">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  <span>{expiryText}</span>
                </span>
              )}
            </div>

            {/* Ticker Content Chunk 2 (Duplicate for continuous seamless loop) */}
            <div className="flex items-center space-x-8">
              <span className="flex items-center space-x-2 text-[#FFECC7]">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                <span>{tagline}</span>
              </span>

              {coupon && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-white/15 hover:bg-white/25 border border-[#FFDF78]/50 text-[#FFDF78] font-mono text-[11px] font-bold transition-colors cursor-pointer"
                  title="Click to copy coupon code"
                >
                  <Tag className="w-3 h-3 text-[#FFDF78]" />
                  <span>CODE: {coupon}</span>
                  {copied ? (
                    <Check className="w-3 h-3 text-green-300" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 opacity-70" />
                  )}
                </button>
              )}

              {expiryText && (
                <span className="inline-flex items-center space-x-1 text-[11px] text-amber-200/90 bg-black/30 px-2 py-0.5 rounded-full border border-amber-300/20">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  <span>{expiryText}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right CTA Button */}
        {ctaText && (
          <div className="flex-shrink-0 z-20 pl-2 sm:pl-4">
            <Link
              href={ctaUrl}
              className="inline-flex items-center space-x-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-white text-[#260B14] hover:bg-[#FFDF78] hover:shadow-md transition-all duration-200 active:scale-95 whitespace-nowrap shadow-xs"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Decorative Gold Sheen Line at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />
    </div>
  );
}
