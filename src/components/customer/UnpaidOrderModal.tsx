"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function UnpaidOrderModal() {
  const router = useRouter();
  const [unpaidInfo, setUnpaidInfo] = useState<{
    orderNumber: string;
    orderId?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if the current logged-in customer has an unpaid order
    fetch("/api/customer/unpaid-check")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasUnpaidOrder && data.orderNumber) {
          setUnpaidInfo({ orderNumber: data.orderNumber, orderId: data.orderId });
        }
      })
      .catch((err) => console.error("Unpaid check error:", err));
  }, []);

  const handleAcknowledge = async () => {
    if (!unpaidInfo) return;
    setLoading(true);

    try {
      await fetch("/api/customer/unpaid-discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: unpaidInfo.orderNumber }),
      });
    } catch (e) {
      console.error("Error discarding unpaid order:", e);
    } finally {
      setUnpaidInfo(null);
      setLoading(false);
      router.push("/shop");
    }
  };

  if (!unpaidInfo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-[#E8E0D5] shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-[#FDF2F2] rounded-full flex items-center justify-center text-[#DF4C4C] mx-auto border border-[#FADBD8]">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-bold text-[#8C7A72]">
            Order #{unpaidInfo.orderNumber}
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2C332D]">
            Payment Update
          </h2>
          <div className="p-4 bg-[#FAF8F5] border border-[#E8E0D5] rounded-2xl">
            <p className="text-xs sm:text-sm font-medium text-[#2C332D] leading-relaxed">
              Your last order payment was not done, try again. Thank you for visiting again.
            </p>
          </div>
          <p className="text-[11px] text-[#736C66] leading-relaxed">
            The previous unpaid order has been cleared from your account so you can restart your purchase smoothly.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleAcknowledge}
          className="w-full py-3.5 bg-[#2C332D] hover:bg-[#3D473E] text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all"
        >
          <span>{loading ? "Updating..." : "Try Again / Continue Shopping"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
