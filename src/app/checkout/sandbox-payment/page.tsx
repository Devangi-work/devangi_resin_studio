"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/store/cart";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Smartphone,
  CreditCard,
  Building,
  Lock,
} from "lucide-react";

function SandboxPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const orderId = searchParams.get("order_id");
  const amount = searchParams.get("amount");

  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");

  const handleSimulatePayment = async (status: "SUCCESS" | "FAILED") => {
    if (!orderId) return;
    setLoading(true);

    try {
      if (status === "SUCCESS") {
        const res = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        if (res.ok) {
          clearCart();
          router.push(`/orders/${orderId}?verified=true`);
          return;
        }
      }

      // If simulated failure
      alert("Payment simulation failed as selected. Order remains pending.");
      router.push(`/checkout`);
    } catch (e) {
      console.error(e);
      alert("Simulation error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-[#E8E0D5] shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#2C332D] text-white p-6 text-center space-y-1">
          <div className="inline-flex items-center space-x-1.5 text-xs text-[#D4AF37] bg-white/10 px-3 py-1 rounded-full mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cashfree Payments &bull; Sandbox Mode</span>
          </div>
          <h1 className="font-serif text-xl font-bold">Complete Your Payment</h1>
          <p className="text-xs text-white/70">Order #{orderId}</p>
        </div>

        {/* Amount Box */}
        <div className="p-6 bg-[#FAF8F5] border-b border-[#E8E0D5] text-center">
          <p className="text-xs text-[#736C66] uppercase tracking-wider font-semibold">
            Amount Payable
          </p>
          <p className="font-serif text-3xl font-bold text-[#2C332D] mt-1">
            ₹{amount ? Number(amount).toFixed(2) : "0.00"}
          </p>
        </div>

        {/* Payment Methods */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2C332D] uppercase tracking-wider block">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod("upi")}
                className={`p-3 rounded-xl border text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  method === "upi"
                    ? "bg-[#FAF4EC] border-[#B8972E] text-[#2C332D] font-bold"
                    : "bg-[#FAF8F5] border-[#E8E0D5] text-[#736C66]"
                }`}
              >
                <Smartphone className="w-4 h-4 text-[#B8972E]" />
                <span>UPI / QR</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("card")}
                className={`p-3 rounded-xl border text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  method === "card"
                    ? "bg-[#FAF4EC] border-[#B8972E] text-[#2C332D] font-bold"
                    : "bg-[#FAF8F5] border-[#E8E0D5] text-[#736C66]"
                }`}
              >
                <CreditCard className="w-4 h-4 text-[#B8972E]" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("netbanking")}
                className={`p-3 rounded-xl border text-xs flex flex-col items-center justify-center space-y-1.5 transition-all ${
                  method === "netbanking"
                    ? "bg-[#FAF4EC] border-[#B8972E] text-[#2C332D] font-bold"
                    : "bg-[#FAF8F5] border-[#E8E0D5] text-[#736C66]"
                }`}
              >
                <Building className="w-4 h-4 text-[#B8972E]" />
                <span>Net Banking</span>
              </button>
            </div>
          </div>

          {/* Action Simulation Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleSimulatePayment("SUCCESS")}
              disabled={loading}
              className="w-full py-3.5 bg-[#2E7D32] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-[#256628] shadow-md transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "Processing..." : "Simulate Successful Payment"}</span>
            </button>

            <button
              onClick={() => handleSimulatePayment("FAILED")}
              disabled={loading}
              className="w-full py-3 bg-[#FAF8F5] border border-[#E8E0D5] text-[#DF4C4C] rounded-xl font-semibold text-xs tracking-wider flex items-center justify-center space-x-2 hover:bg-[#FDF2F2] transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Simulate Payment Failure / Abandon</span>
            </button>
          </div>

          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-[#736C66] text-center pt-2">
            <Lock className="w-3.5 h-3.5 text-[#B8972E]" />
            <span>Sandbox environment active. No real funds are deducted.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SandboxPaymentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-[#736C66]">Loading payment sandbox...</div>}>
      <SandboxPaymentContent />
    </Suspense>
  );
}
