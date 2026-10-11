import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dbStore } from "@/lib/db";
import { ShieldCheck, Truck, RotateCcw, Sparkles, FileText, Lock } from "lucide-react";

interface PolicyPageProps {
  params: Promise<{ type: string }>;
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { type } = await params;
  const settings = await dbStore.getSiteSettings();

  const policies: Record<string, { title: string; icon: any; content: string }> = {
    shipping: {
      title: "Shipping & Dispatch Policy",
      icon: Truck,
      content:
        settings.shippingPolicy ||
        "All ready-made resin pieces are dispatched within 2 business days. Made-to-order and custom pieces require 3 to 5 business days for proper curing before secure dispatch.",
    },
    returns: {
      title: "Returns & Refund Policy",
      icon: RotateCcw,
      content:
        settings.returnPolicy ||
        "Because each resin art creation is custom handcrafted, returns are accepted within 7 days exclusively for items that arrive damaged or defective in transit.",
    },
    care: {
      title: "Resin Art Care Instructions",
      icon: Sparkles,
      content:
        settings.careInstructionsDefault ||
        "Keep away from prolonged direct high heat or sunlight. Clean gently with a soft microfiber cloth and mild soap. Avoid harsh chemical cleaners or abrasive scouring pads.",
    },
    privacy: {
      title: "Privacy & Data Protection Policy",
      icon: Lock,
      content:
        settings.privacyPolicy ||
        "We respect your privacy and never share your email, phone, or shipping address with third parties except for order fulfillment and payment processing.",
    },
    terms: {
      title: "Terms & Conditions of Sale",
      icon: FileText,
      content:
        settings.termsPolicy ||
        "By placing an order on Devangi Resin Studio, you acknowledge that handmade art may exhibit slight organic variations in petal placement, pigment swirling, and foil flakes, which is the hallmark of genuine artisan craftsmanship.",
    },
  };

  const policy = policies[type];
  if (!policy) notFound();

  const Icon = policy.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-8">
      <div className="border-b border-[#E8E0D5] pb-6 space-y-2">
        <div className="flex items-center space-x-2 text-xs text-[#8C7A72]">
          <Link href="/" className="hover:text-[#2C332D]">Home</Link>
          <span>/</span>
          <span>Studio Policies</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C332D] flex items-center space-x-3">
          <Icon className="w-8 h-8 text-[#B8972E]" />
          <span>{policy.title}</span>
        </h1>
      </div>

      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#E8E0D5] shadow-sm text-sm text-[#736C66] leading-relaxed space-y-6">
        <div className="whitespace-pre-line text-sm sm:text-base font-light text-[#2C332D]">
          {policy.content}
        </div>

        <div className="pt-6 border-t border-[#F4EBE6] text-xs text-[#8C7A72]">
          Have questions regarding our policies? Message our artisan team directly on WhatsApp or email{" "}
          <strong className="text-[#2C332D]">{settings.contactEmail}</strong>.
        </div>
      </div>
    </div>
  );
}
