"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Sparkles, ArrowRight, Clock } from "lucide-react";

export interface PromotionalPopupModalProps {
  initialSettings?: {
    popupBannerActive?: boolean;
    popupBannerTagline?: string;
    popupBannerImageUrl?: string;
    popupBannerLinkUrl?: string;
    popupBannerButtonText?: string;
    popupBannerExpiresAt?: string | null;
  };
}

export function PromotionalPopupModal({ initialSettings }: PromotionalPopupModalProps) {
  const [settings, setSettings] = useState(initialSettings || null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // If already dismissed in this session, don't show
    try {
      if (typeof window !== "undefined" && sessionStorage.getItem("resin_popup_banner_dismissed") === "true") {
        setHasDismissed(true);
        return;
      }
    } catch {
      // ignore
    }

    // If initialSettings wasn't provided, fetch settings
    if (!settings) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setSettings(data);
          }
        })
        .catch(() => {});
    }
  }, [settings]);

  useEffect(() => {
    if (hasDismissed || !settings) return;

    // Check if active
    if (!settings.popupBannerActive) return;

    // Must have either an image or tagline
    const hasImage = Boolean(settings.popupBannerImageUrl?.trim());
    const hasTagline = Boolean(settings.popupBannerTagline?.trim());
    if (!hasImage && !hasTagline) return;

    // Check expiry
    if (settings.popupBannerExpiresAt) {
      const expiry = new Date(settings.popupBannerExpiresAt).getTime();
      if (!isNaN(expiry) && expiry <= Date.now()) {
        return; // Expired, do not show
      }
    }

    let timer: NodeJS.Timeout | null = null;

    const startTimer = () => {
      timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
    };

    startTimer();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [settings, hasDismissed]);

  const handleClose = () => {
    setIsOpen(false);
    setHasDismissed(true);
    try {
      sessionStorage.setItem("resin_popup_banner_dismissed", "true");
    } catch {
      // ignore
    }
  };

  if (!isOpen || !settings || !settings.popupBannerActive) {
    return null;
  }

  // Double-check expiry
  if (settings.popupBannerExpiresAt) {
    const expiry = new Date(settings.popupBannerExpiresAt).getTime();
    if (!isNaN(expiry) && expiry <= Date.now()) {
      return null;
    }
  }

  const imageUrl = settings.popupBannerImageUrl?.trim();
  const tagline = settings.popupBannerTagline?.trim();
  const ctaUrl = settings.popupBannerLinkUrl?.trim() || "/shop";
  const ctaText = settings.popupBannerButtonText?.trim() || "Explore Now";

  // Check expiry text
  let expiryCountdown = "";
  if (settings.popupBannerExpiresAt) {
    try {
      const diffMs = new Date(settings.popupBannerExpiresAt).getTime() - Date.now();
      if (diffMs > 0) {
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        expiryCountdown = days > 0 ? `Ends in ${days}d ${hours}h` : `Ends in ${hours}h`;
      }
    } catch {
      // ignore
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
    >
      {/* Modal Dialog Card (Clicking card does not dismiss unless cross is clicked or backdrop clicked) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#FCFAF8] rounded-3xl border border-[#D4AF37]/50 shadow-2xl overflow-hidden cursor-default animate-in zoom-in-95 duration-300 max-h-[92vh] flex flex-col"
      >
        {/* Top Gold Sheen Border */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent z-20" />

        {/* Floating High-Contrast Close Button [✕] */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close Announcement"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-[#260B14]/80 hover:bg-[#260B14] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-[#D4AF37]/40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Banner Image (If Uploaded) */}
        {imageUrl && (
          <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] bg-gradient-to-br from-[#260B14] to-[#4A1525] overflow-hidden flex-shrink-0">
            <Image
              src={imageUrl}
              alt="Announcement Banner"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 92vw, 512px"
              priority
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Expiry Pill over image if present */}
            {expiryCountdown && (
              <div className="absolute bottom-3 left-3 z-10 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#D4AF37]/40 text-[#FFDF78] text-[11px] font-mono font-semibold">
                <Clock className="w-3 h-3 text-[#D4AF37]" />
                <span>{expiryCountdown}</span>
              </div>
            )}
          </div>
        )}

        {/* Card Body */}
        <div className="p-5 sm:p-7 space-y-4 text-center overflow-y-auto">
          {/* Studio Brand Header */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FAF0F3] border border-[#EFE3E7] text-[#800020] text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Devangi Resin Studio Announcement</span>
          </div>

          {/* Tagline / Announcement Message */}
          {tagline ? (
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#260B14] leading-snug tracking-tight px-2">
              {tagline}
            </h3>
          ) : (
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#260B14] leading-snug tracking-tight">
              Exclusive Handmade Resin Art & Keepsakes
            </h3>
          )}

          {/* Countdown if no image */}
          {!imageUrl && expiryCountdown && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FAF0F3] border border-[#D4AF37]/30 text-[#800020] text-xs font-mono font-medium">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Limited Time Offer: {expiryCountdown}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={ctaUrl}
              onClick={handleClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-[#260B14] to-[#4A1525] hover:from-[#38101E] hover:to-[#5E1B30] text-[#FFF6E5] font-semibold text-xs sm:text-sm tracking-wide uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 border border-[#D4AF37]/50 active:scale-98"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>

            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#FAF8F5] hover:bg-[#F2ECE6] text-[#736C66] hover:text-[#2C332D] text-xs font-semibold transition-colors border border-[#E8E0D5]"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Bottom Gold Accent Line */}
        <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
