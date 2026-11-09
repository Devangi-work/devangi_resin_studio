"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Copy,
  Check,
  Gift,
  Tag,
  Zap,
  ArrowRight,
  ShieldCheck,
  Lock,
  Eye,
  X,
} from "lucide-react";

interface EarlyAccessLaunchPageProps {
  onUnlockPreview?: () => void;
  currentPath?: string;
}

export function EarlyAccessLaunchPage({ onUnlockPreview }: EarlyAccessLaunchPageProps) {
  const [copied, setCopied] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  const whatsappCommunityUrl = "https://chat.whatsapp.com/JoLX86jc5TRH6emxHo9nrQ";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(whatsappCommunityUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === "Deepa@04") {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("devangi_preview_unlocked", "true");
      }
      setShowAdminModal(false);
      if (onUnlockPreview) {
        onUnlockPreview();
      } else {
        window.location.reload();
      }
    } else {
      setPasscodeError(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#18060F] via-[#260C18] to-[#12040B] text-[#FAF4EE] selection:bg-[#D4AF37]/30 overflow-x-hidden flex flex-col justify-between">
      
      {/* Luxury Royal Wine & Gold Ambient Glowing Auras */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[420px] sm:w-[650px] h-[420px] sm:h-[650px] bg-gradient-to-br from-[#8E2B45]/25 via-[#D4AF37]/15 to-transparent rounded-full blur-3xl opacity-85" />
        <div className="absolute top-1/4 -right-28 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-bl from-[#D4AF37]/20 via-[#B84A67]/20 to-transparent rounded-full blur-3xl opacity-80" />
        <div className="absolute -bottom-32 left-1/4 w-[450px] sm:w-[700px] h-[450px] sm:h-[700px] bg-gradient-to-tr from-[#3A1823]/40 via-[#8E2B45]/15 to-transparent rounded-full blur-3xl opacity-75" />
        {/* Subtle Luxury Gold Stardust Grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(#D4AF37 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Top Header with Brand Logo & Name */}
      <header className="relative z-10 w-full pt-5 pb-4 px-4 sm:px-8 border-b border-[#D4AF37]/20 backdrop-blur-md bg-[#18060F]/65">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full p-0.5 bg-gradient-to-br from-[#D4AF37] via-[#F3E5AB] to-[#B88B32] shadow-[0_0_18px_rgba(212,175,55,0.35)] flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full bg-[#230E16] p-0.5 flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/logo/resin_logo.png"
                  alt="Devangi Resin Studio Logo"
                  width={52}
                  height={52}
                  priority
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
            <div>
              <span className="font-serif text-lg sm:text-2xl font-bold tracking-wide text-[#FAF4EE] block leading-tight">
                Devangi Resin Studio
              </span>
              <span className="text-[10px] sm:text-xs text-[#E5B5C2] font-medium tracking-wider uppercase block">
                Handcrafted Keepsakes & Botanical Art
              </span>
            </div>
          </div>

          {/* VIP Status Pill */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#361120] border border-[#D4AF37]/35 text-[#F3E5AB] text-[11px] sm:text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
            <span>Early Access Gate</span>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16 max-w-4xl mx-auto w-full text-center">
        
        {/* Animated Greeting Pill */}
        <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-[#3A1423] border border-[#B84A67]/50 text-[#FCE7ED] text-xs sm:text-sm font-semibold shadow-md mb-6 sm:mb-8 transition-transform hover:scale-105">
          <span className="text-sm sm:text-base animate-pulse">❤️</span>
          <span>Looks like you're excited to explore our website!</span>
        </div>

        {/* Hero Card Container in Dark Luxury Resin Theme */}
        <div className="w-full max-w-2xl mx-auto p-6 sm:p-10 rounded-3xl bg-[#260C18]/90 border border-[#D4AF37]/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative overflow-hidden mb-10 transition-all">
          
          {/* Ambient Golden Light in Corner */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#B84A67]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Main Headline */}
          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-[#FAF4EE] tracking-tight leading-[1.25] mb-4 sm:mb-5">
            Join our WhatsApp Community to get{" "}
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#F1B6C4]">
              early access to our website launch
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-[#D9C4CC] max-w-xl mx-auto leading-relaxed mb-6 sm:mb-7 font-normal">
            Along with the latest product updates, exclusive offers, discount coupon codes, festive deals, and much more!
          </p>

          {/* Subtitle Callout */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#341121]/80 border border-[#D4AF37]/25 mb-7">
            <p className="font-serif text-sm sm:text-base font-bold text-[#FAF4EE]">
              Be the first to know about everything happening at{" "}
              <span className="text-[#F3E5AB]">Devangi Resin Studio!</span>
            </p>
          </div>

          {/* WhatsApp CTA Action Section */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <a
              href={whatsappCommunityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-4.5 rounded-full text-base sm:text-lg font-bold text-white bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#28E06E] hover:to-[#17A392] shadow-[0_10px_35px_rgba(37,211,102,0.35)] hover:shadow-[0_15px_45px_rgba(37,211,102,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ring-4 ring-[#25D366]/25"
            >
              {/* WhatsApp Official SVG Logo */}
              <svg
                className="w-6 h-6 fill-current shrink-0 animate-bounce"
                style={{ animationDuration: "2s" }}
                viewBox="0 0 24 24"
              >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Click Here to Join WhatsApp Community</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </a>

            {/* Direct Link & 1-Click Copy */}
            <div className="w-full pt-4 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-[#D9C4CC]">
              <div className="flex items-center gap-1.5 truncate max-w-full">
                <span className="font-semibold text-[#FAF4EE]">Join here:</span>
                <a
                  href={whatsappCommunityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-[#F3E5AB] hover:text-white underline truncate max-w-[210px] sm:max-w-[280px]"
                >
                  {whatsappCommunityUrl}
                </a>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3D1424] hover:bg-[#4E1B30] text-[#F3E5AB] font-semibold transition-all active:scale-95 border border-[#D4AF37]/30"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#25D366]" />
                    <span className="text-[#25D366]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-[#CBB5BD]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#25D366]" />
            <span>Official Devangi Resin Studio WhatsApp Group • Instant 1-Click Access</span>
          </div>
        </div>

        {/* 4 Engaging Community Benefits Cards */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-left">
          
          <div className="p-4 sm:p-5 rounded-2xl bg-[#240B16]/85 border border-[#D4AF37]/25 shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[#D4AF37]/50">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#361120] text-[#F3E5AB] flex items-center justify-center mb-2.5 sm:mb-3">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
            </div>
            <h3 className="font-serif text-xs sm:text-sm font-bold text-[#FAF4EE] mb-1">
              Early Launch Access
            </h3>
            <p className="text-[11px] sm:text-xs text-[#CBB5BD] leading-relaxed">
              Explore and place orders on our official website before public opening.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#240B16]/85 border border-[#D4AF37]/25 shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[#D4AF37]/50">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#361120] text-[#F3E5AB] flex items-center justify-center mb-2.5 sm:mb-3">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-[#F1B6C4]" />
            </div>
            <h3 className="font-serif text-xs sm:text-sm font-bold text-[#FAF4EE] mb-1">
              Secret Coupons & Deals
            </h3>
            <p className="text-[11px] sm:text-xs text-[#CBB5BD] leading-relaxed">
              Unlock exclusive festival codes, launch discount vouchers & flash sales.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#240B16]/85 border border-[#D4AF37]/25 shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[#D4AF37]/50">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#361120] text-[#F3E5AB] flex items-center justify-center mb-2.5 sm:mb-3">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
            </div>
            <h3 className="font-serif text-xs sm:text-sm font-bold text-[#FAF4EE] mb-1">
              Latest Product Drops
            </h3>
            <p className="text-[11px] sm:text-xs text-[#CBB5BD] leading-relaxed">
              Be the first to see new botanical jewellery, geode clocks & keepsakes.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#240B16]/85 border border-[#D4AF37]/25 shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[#D4AF37]/50">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#361120] text-[#F3E5AB] flex items-center justify-center mb-2.5 sm:mb-3">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-[#E5B5C2]" />
            </div>
            <h3 className="font-serif text-xs sm:text-sm font-bold text-[#FAF4EE] mb-1">
              Priority Custom Orders
            </h3>
            <p className="text-[11px] sm:text-xs text-[#CBB5BD] leading-relaxed">
              Get VIP reservation slots for wedding garland preservation & bespoke gifts.
            </p>
          </div>

        </div>

      </main>

      {/* Footer with Studio Info & Subtle Studio Owner Access */}
      <footer className="relative z-10 w-full py-6 px-4 sm:px-8 border-t border-[#D4AF37]/20 text-center text-xs text-[#B89FA8] bg-[#16060E]/75 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>© {new Date().getFullYear()} Devangi Resin Studio</span>
            <span>•</span>
            <span>Handmade with Love in India 🇮🇳</span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium">
            <a
              href="https://www.instagram.com/devangi_resin_studio?cplk=dGV0MmUydXN2azcy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E5B5C2] hover:text-[#F3E5AB] transition-colors"
            >
              Instagram @devangi_resin_studio
            </a>

            <span>•</span>

            {/* Discreet Studio Owner Preview Button (Without any hint or admin route) */}
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="text-[#9E858E] hover:text-[#FAF4EE] transition-colors underline flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              <span>Owner Preview</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Owner Preview Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#260C18] p-6 shadow-2xl border border-[#D4AF37]/35 text-[#FAF4EE]">
            <button
              type="button"
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 text-[#CBB5BD] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-4">
              <div className="w-10 h-10 rounded-full bg-[#361120] text-[#D4AF37] flex items-center justify-center mx-auto mb-2 border border-[#D4AF37]/30">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#FAF4EE]">
                Studio Owner Preview
              </h3>
              <p className="text-xs text-[#CBB5BD] mt-1">
                Enter your studio preview key to inspect the website.
              </p>
            </div>

            <form onSubmit={handlePasscodeSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="Enter preview key"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError(false);
                }}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs bg-[#18060F] text-[#FAF4EE] placeholder-[#8C6E79] focus:outline-none focus:ring-2 ${
                  passcodeError
                    ? "border-[#DF4C4C] focus:ring-[#DF4C4C]"
                    : "border-[#D4AF37]/40 focus:ring-[#D4AF37]"
                }`}
              />
              {passcodeError && (
                <p className="text-[11px] text-[#FF8585]">Incorrect preview key. Please try again.</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B88B32] hover:from-[#E5C358] hover:to-[#C59838] text-[#230E16] text-xs font-bold transition-all shadow-md active:scale-98"
              >
                Unlock Preview Mode
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
