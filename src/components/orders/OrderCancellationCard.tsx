"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, XCircle, CheckCircle } from "lucide-react";

interface OrderCancellationCardProps {
  orderNumber: string;
  createdAt: string | Date;
  currentStatus: string;
  cancellationReason?: string | null;
}

export function OrderCancellationCard({
  orderNumber,
  createdAt,
  currentStatus,
  cancellationReason,
}: OrderCancellationCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createdTime = new Date(createdAt).getTime();
  const elapsedMinutes = (Date.now() - createdTime) / (1000 * 60);
  const isWithin1Hour = elapsedMinutes <= 60;
  const remainingMinutes = Math.max(0, Math.floor(60 - elapsedMinutes));
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className="bg-[#FDF2F2] p-5 rounded-2xl border border-[#FADBD8] text-xs text-[#DF4C4C] space-y-1">
        <p className="font-bold flex items-center gap-1.5 text-sm">
          <XCircle className="w-4 h-4" />
          <span>This order has been cancelled</span>
        </p>
        <p className="text-[11px] text-[#736C66]">
          Reason: {cancellationReason || "Customer requested cancellation within 1-hour window"}
        </p>
      </div>
    );
  }

  const handleCancel = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/customer/orders/${orderNumber}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "Customer cancelled within 1-hour window" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to cancel order.");
        setLoading(false);
        return;
      }

      router.refresh();
      window.location.reload();
    } catch {
      setError("Network error while cancelling order.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {isWithin1Hour ? (
            <div>
              <p className="text-xs font-bold text-[#B8972E] flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>1-Hour Cancellation Window Active ({remainingMinutes} mins left)</span>
              </p>
              <p className="text-[11px] text-[#736C66] mt-0.5">
                Handmade resin art orders can be modified or cancelled within 60 minutes of placing.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-[#2E7D32] flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>In Production (Cancellation window closed)</span>
              </p>
              <p className="text-[11px] text-[#736C66] mt-0.5">
                Orders can only be cancelled within 1 hour. Our resin artists have begun pouring and curing your pieces.
              </p>
            </div>
          )}
        </div>

        {isWithin1Hour && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 border border-[#DF4C4C]/40 text-[#DF4C4C] hover:bg-[#FDF2F2] text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto"
          >
            Cancel Order
          </button>
        )}
      </div>

      {isOpen && (
        <div className="pt-3 border-t border-[#F4EBE6] space-y-3">
          {error && <p className="text-xs text-[#DF4C4C]">{error}</p>}
          <label className="text-xs font-semibold text-[#2C332D] block">
            Reason for cancellation (optional):
          </label>
          <input
            type="text"
            placeholder="e.g. Changed my mind / Ordered wrong item"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none"
          />
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleCancel}
              className="px-4 py-2 bg-[#DF4C4C] text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition"
            >
              {loading ? "Cancelling..." : "Confirm Cancellation"}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-white border border-[#E8E0D5] text-[#736C66] text-xs font-semibold rounded-xl hover:bg-[#FAF8F5] transition"
            >
              Keep My Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
