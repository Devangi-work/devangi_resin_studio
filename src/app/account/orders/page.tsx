"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountLayoutShell } from "@/components/customer/AccountLayoutShell";
import {
  Package,
  ShoppingBag,
  Clock,
  ArrowRight,
  ExternalLink,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Truck,
  Sparkles,
} from "lucide-react";

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancellation State
  const [cancellingOrderNumber, setCancellingOrderNumber] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadData = async () => {
    try {
      const meRes = await fetch("/api/customer/me");
      const meData = await meRes.json();

      if (!meData.authenticated) {
        router.push("/account/login?redirect=/account/orders");
        return;
      }

      setCustomer(meData.customer);

      const ordRes = await fetch("/api/customer/orders");
      const ordData = await ordRes.json();
      if (ordData.orders) {
        setOrders(ordData.orders);
      }
    } catch (err) {
      console.error("Orders page error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmCancel = async (orderNumber: string) => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }

    setCancelLoading(true);
    try {
      const res = await fetch(`/api/customer/orders/${orderNumber}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to cancel order.");
      } else {
        setActionMessage(`Order #${orderNumber} cancelled successfully.`);
        setCancellingOrderNumber(null);
        setCancelReason("");
        loadData();
      }
    } catch {
      alert("Error cancelling order.");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-[#736C66]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D4AF37] mb-3" />
        <p className="text-sm font-medium">Loading your orders and purchases...</p>
      </div>
    );
  }

  return (
    <AccountLayoutShell customer={customer} ordersCount={orders.length}>
      <div className="space-y-6">
        {actionMessage && (
          <div className="p-4 bg-[#E8EFE8] border border-[#C5D8C5] rounded-2xl flex items-center justify-between text-xs text-[#2E7D32]">
            <span className="font-semibold">{actionMessage}</span>
            <button onClick={() => setActionMessage("")} className="font-bold underline text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white p-10 sm:p-14 rounded-3xl border border-[#E8E0D5] text-center space-y-5 shadow-xs">
            <div className="w-16 h-16 bg-[#FAF4EC] text-[#B8972E] rounded-full flex items-center justify-center mx-auto shadow-inner border border-[#D4AF37]/30">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="font-serif text-2xl font-bold text-[#2C332D]">
                No Orders Placed Yet
              </h3>
              <p className="text-xs sm:text-sm text-[#736C66] leading-relaxed font-light">
                Your bespoke resin journey begins here. Explore our handcrafted collection of geode clocks, preserved floral jewellery, and personalised gifts.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 py-3.5 px-7 bg-[#2C332D] hover:bg-[#3D473E] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2C332D]">
                Order History &amp; Status
              </h2>
              <span className="text-xs text-[#8C7A72]">
                Total Orders: <strong className="text-[#2C332D]">{orders.length}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {orders.map((ord) => {
                const isPaid = ord.paymentStatus === "paid";
                const isCancelled = ord.orderStatus === "cancelled";
                const isDelivered = ord.orderStatus === "delivered";

                // Check 1-hour cancellation window
                const orderTime = new Date(ord.createdAt).getTime();
                const now = Date.now();
                const diffMinutes = Math.floor((now - orderTime) / (1000 * 60));
                const canCancel = diffMinutes < 60 && !isCancelled && !isDelivered;
                const remainingMinutes = Math.max(0, 60 - diffMinutes);

                return (
                  <div
                    key={ord.id}
                    className="bg-white rounded-2xl border border-[#E8E0D5] p-5 sm:p-6 space-y-4 hover:border-[#D4AF37]/60 transition-all shadow-xs"
                  >
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#E8E0D5] gap-3">
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xs font-bold text-[#2C332D] tracking-wide">
                            Order #{ord.orderNumber}
                          </span>
                          {!isDelivered && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                                isCancelled
                                  ? "bg-[#FDF2F2] text-[#DF4C4C] border-[#FADBD8]"
                                  : isPaid
                                  ? "bg-[#FFF8E1] text-[#B8972E] border-[#FFE082]"
                                  : "bg-[#FAF8F5] text-[#736C66] border-[#E8E0D5]"
                              }`}
                            >
                              {ord.orderStatus.replace("_", " ")}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8C7A72] mt-1">
                          Placed on{" "}
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-auto">
                        <span className="font-serif text-lg font-bold text-[#2C332D]">
                          ₹{Number(ord.totalAmount).toFixed(2)}
                        </span>
                        {isDelivered ? (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#E8EFE8] text-[#2E7D32] border border-[#C5D8C5] rounded-xl text-xs font-bold shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                            <span>Order Delivered</span>
                          </span>
                        ) : (
                          <Link
                            href={`/orders/${ord.orderNumber}`}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#2C332D] hover:bg-[#3D473E] text-white rounded-xl text-xs font-bold transition-all shadow-xs group"
                          >
                            <Truck className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
                            <span>Track Status</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      {(ord.items || []).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] flex items-center justify-center font-bold text-xs text-[#B84A67] shrink-0 overflow-hidden">
                              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#2C332D] text-xs">
                                {item.productName}
                              </p>
                              {item.variantName && (
                                <p className="text-[10px] text-[#8C7A72]">
                                  {item.variantName}
                                </p>
                              )}
                              <p className="text-[10px] text-[#8C7A72]">
                                Qty: {item.quantity} × ₹{Number(item.unitPrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-[#2C332D]">
                            ₹{Number(item.totalPrice).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tracking details if available */}
                    {ord.trackingNumber && (
                      <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E0D5] flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4 text-[#B8972E]" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8C7A72] block">
                              Courier Tracking ({ord.courierName || "Express Courier"})
                            </span>
                            <span className="font-mono font-bold text-[#2C332D]">
                              {ord.trackingNumber}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/orders/${ord.orderNumber}`}
                          className="text-[#B84A67] font-bold text-xs hover:underline flex items-center space-x-1"
                        >
                          <span>Track Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {/* Cancellation Window Action */}
                    {canCancel && (
                      <div className="pt-2 border-t border-[#E8E0D5] flex items-center justify-between">
                        <span className="text-[11px] text-[#8C7A72] flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>
                            Eligible for cancellation within next <strong>{remainingMinutes}m</strong>
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setCancellingOrderNumber(ord.orderNumber)}
                          className="text-xs font-bold text-[#DF4C4C] hover:underline"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancellation Modal */}
        {cancellingOrderNumber && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 border border-[#E8E0D5] shadow-2xl">
              <div className="w-12 h-12 bg-[#FDF2F2] rounded-full flex items-center justify-center text-[#DF4C4C] mx-auto border border-[#FADBD8]">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-serif text-xl font-bold text-[#2C332D]">
                  Cancel Order #{cancellingOrderNumber}?
                </h3>
                <p className="text-xs text-[#736C66]">
                  Custom handcrafted items are immediately prepped for precision curing. Please let us know the reason:
                </p>
              </div>

              <textarea
                rows={3}
                placeholder="Reason for cancellation (e.g., entered wrong shipping address, change of mind)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-[#2C332D]"
              />

              <div className="flex space-x-3">
                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={() => handleConfirmCancel(cancellingOrderNumber)}
                  className="flex-1 py-2.5 bg-[#DF4C4C] hover:bg-[#C93B3B] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
                </button>
                <button
                  type="button"
                  onClick={() => setCancellingOrderNumber(null)}
                  className="py-2.5 px-4 bg-[#FAF8F5] text-[#2C332D] text-xs font-semibold rounded-xl border border-[#E8E0D5] hover:bg-white"
                >
                  Keep Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AccountLayoutShell>
  );
}

