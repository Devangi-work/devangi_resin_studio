"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccountLayoutShell } from "@/components/customer/AccountLayoutShell";
import {
  Sparkles,
  ShieldCheck,
  Sun,
  Flame,
  Droplets,
  Heart,
  MessageCircle,
  HelpCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function CustomerGuidePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customer/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push("/account/login?redirect=/account/guide");
          return;
        }
        setCustomer(data.customer);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-[#736C66]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D4AF37] mb-3" />
        <p className="text-sm font-medium">Loading resin care & preservation guide...</p>
      </div>
    );
  }

  const careTips = [
    {
      icon: Sun,
      title: "1. Sunlight & UV Preservation",
      desc: "Our creations are crafted with premium UV-stabilized optical-grade epoxy resin to prevent yellowing over time. To maintain crystal-clear transparency and floral vibrancy for decades, display your pieces indoors away from prolonged harsh direct midday sunlight.",
      tag: "Preservation",
    },
    {
      icon: Flame,
      title: "2. Heat Resistance Guidelines",
      desc: "Fully cured resin coasters and trays easily withstand warm mugs of coffee and tea up to 50°C (122°F). However, avoid placing boiling cookware, sizzling frying pans, or open flames directly onto the surface to prevent thermal softening.",
      tag: "Thermal Safety",
    },
    {
      icon: Droplets,
      title: "3. Gentle Cleaning & Polishing",
      desc: "Wipe clean using a soft, non-abrasive microfiber cloth dampened with lukewarm water and mild dish soap. Never use acetone, alcohol, bleach, ammonia, or harsh scrubbing pads, as they will dull the glass-like mirror sheen.",
      tag: "Daily Care",
    },
    {
      icon: ShieldCheck,
      title: "4. Water & Moisture Resistance",
      desc: "Our resin pieces undergo a meticulous 72-hour multi-stage curing process, making them completely waterproof and impervious to cold beverage condensation, spills, and humidity.",
      tag: "Waterproof",
    },
    {
      icon: Sparkles,
      title: "5. Restoring Brilliant Glass Shine",
      desc: "If minor surface smudges or micro-dulling occur after extended use, gently buff the surface with a clean microfiber cloth and a drop of plastic polish or pure mineral oil to bring back the brilliant high-gloss showroom finish.",
      tag: "Artisan Secret",
    },
  ];

  return (
    <AccountLayoutShell customer={customer}>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8972E]">
                Official Studio Guidelines
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2C332D] mt-0.5">
              Resin Art Care &amp; Preservation Guide
            </h2>
          </div>

          <span className="text-xs text-[#2E7D32] bg-[#E8EFE8] px-3.5 py-1.5 rounded-full font-bold border border-[#C5D8C5] self-start sm:self-auto">
            Handcrafted Longevity
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-[#FAF8F5] border border-[#E8E0D5] rounded-3xl p-6 sm:p-8 space-y-3">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2C332D]">
            Treasured Handcrafted Keepsakes, Preserved Forever
          </h3>
          <p className="text-xs sm:text-sm text-[#736C66] leading-relaxed font-light">
            Every piece from Devangi Resin Studio is handcrafted with passion, real botanicals, gold leaf accents, and high-clarity epoxy resin. With basic gentle care, your resin art will remain as sparkling and vibrant as the day it arrived.
          </p>
        </div>

        {/* Care Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {careTips.map((tip, idx) => {
            const Icon = tip.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-[#E8E0D5] p-6 space-y-3.5 shadow-xs hover:border-[#D4AF37] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAF0F3] group-hover:bg-[#FAF4EC] text-[#B84A67] group-hover:text-[#B8972E] flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A72] bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#E8E0D5]">
                    {tip.tag}
                  </span>
                </div>

                <h4 className="font-serif text-base font-bold text-[#2C332D]">
                  {tip.title}
                </h4>

                <p className="text-xs text-[#736C66] leading-relaxed font-light">
                  {tip.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Support Help Banner */}
        <div className="bg-gradient-to-r from-[#FAF0F3] to-[#FAF8F5] rounded-3xl border border-[#EFE3E7] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-serif text-base sm:text-lg font-bold text-[#3A1823]">
              Have a Specific Question About Your Custom Piece?
            </h4>
            <p className="text-xs text-[#7A5E68]">
              Our artisan studio is always here to advise you on framing, flower preservation, and upkeep.
            </p>
          </div>

          <Link
            href="/custom-orders"
            className="py-2.5 px-5 bg-[#3A1823] hover:bg-[#4E2230] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Contact Studio Artisan</span>
          </Link>
        </div>
      </div>
    </AccountLayoutShell>
  );
}

