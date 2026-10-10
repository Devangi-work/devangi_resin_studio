"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/store/cart";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function CheckoutVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { clearCart } = useCart();

  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      setErrorMessage("No order reference provided.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          clearCart();
          setStatus("success");
          setTimeout(() => {
            router.push(`/orders/${orderId}?verified=true`);
          }, 1500);
        } else {
          setStatus("failed");
          setErrorMessage(data.message || "Payment verification failed or was abandoned.");
        }
      } catch (err: any) {
        setStatus("failed");
        setErrorMessage(err.message || "Verification request failed.");
      }
    };

    verify();
  }, [orderId, clearCart, router]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="bg-white p-8 rounded-3xl border border-[#E8E0D5] shadow-lg space-y-4">
        {status === "verifying" && (
          <>
            <div className="w-14 h-14 bg-[#FAF4EC] rounded-full flex items-center justify-center text-[#B8972E] mx-auto animate-spin">
              <Loader2 className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-xl font-bold text-[#2C332D]">
              Verifying Payment with Cashfree...
            </h1>
            <p className="text-xs text-[#736C66]">
              Please hold on while we confirm transaction status and allocate studio inventory.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 bg-[#E8EFE8] rounded-full flex items-center justify-center text-[#2E7D32] mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-xl font-bold text-[#2C332D]">
              Payment Verified!
            </h1>
            <p className="text-xs text-[#736C66]">
              Redirecting to your order confirmation receipt...
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-14 h-14 bg-[#FDF2F2] rounded-full flex items-center justify-center text-[#DF4C4C] mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-xl font-bold text-[#2C332D]">
              Payment Incomplete
            </h1>
            <p className="text-xs text-[#736C66]">{errorMessage}</p>
            <div className="pt-2">
              <a
                href="/checkout"
                className="inline-block px-6 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-full hover:bg-[#3D473E]"
              >
                Return to Checkout
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutVerifyPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-[#736C66]">Verifying with gateway...</div>}>
      <CheckoutVerifyContent />
    </Suspense>
  );
}
