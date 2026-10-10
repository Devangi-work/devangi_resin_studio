"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Search, AlertCircle, ArrowRight } from "lucide-react";

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [verificationInput, setVerificationInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setError("");

    const cleanOrderNumber = orderNumber.trim();
    const cleanVerification = verificationInput.trim();

    router.push(`/orders/${encodeURIComponent(cleanOrderNumber)}?token=${encodeURIComponent(cleanVerification)}`);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white p-8 rounded-3xl border border-[#E8E0D5] shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#FAF4EC] rounded-full flex items-center justify-center text-[#B8972E] mx-auto border border-[#E8E0D5]">
            <Package className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Track Your Resin Art Order
          </h1>
          <p className="text-xs text-[#736C66]">
            Enter your order number and customer email to view crafting progress and tracking information.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#FDF2F2] border border-[#FADBD8] rounded-xl text-xs text-[#DF4C4C] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Order Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. RA-20261008-7241"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Email Address or Phone *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. priya@example.com / 9820154321"
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#2C332D] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-[#3D473E] shadow-sm transition-all"
          >
            <span>{loading ? "Searching..." : "Track Order Status"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
