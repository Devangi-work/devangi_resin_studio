"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function CustomerAccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderNumber, setCancellingOrderNumber] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadData = async () => {
    try {
      const meRes = await fetch("/api/customer/me");
      const meData = await meRes.json();

      if (!meData.authenticated) {
        router.push("/account/login");
        return;
      }

      setCustomer(meData.customer);

      const ordRes = await fetch("/api/customer/orders");
      const ordData = await ordRes.json();
      if (ordData.orders) {
        setOrders(ordData.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/customer/logout", { method: "POST" });
    router.push("/");
  };

  const handleCancelOrder = async (orderNumber: string) => {
    setCancelLoading(true);
    setActionMessage("");

    try {
      const res = await fetch(`/api/customer/orders/${orderNumber}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Customer cancelled within 1-hour window" }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Could not cancel order.");
        setCancelLoading(false);
        return;
      }

      setActionMessage(`Order #${orderNumber} has been successfully cancelled.`);
      setCancellingOrderNumber(null);
      setCancelReason("");
      loadData();
    } catch {
      alert("Error cancelling order.");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-[#736C66]">
        Loading your account details...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      
      {/* Account Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-[#FAF4EC] border border-[#E8E0D5] flex items-center justify-center text-[#B8972E] text-xl font-bold font-serif">
            {customer?.name ? customer.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
              Hello, {customer?.name}
            </h1>
            <p className="text-xs text-[#736C66]">
              {customer?.email} {customer?.phone && `• ${customer.phone}`}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-[#E8E0D5] text-[#736C66] hover:text-[#DF4C4C] hover:bg-[#FDF2F2] rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-[#E8EFE8] border border-[#C5D8C5] rounded-2xl text-xs text-[#2E7D32] flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-[#2C332D] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#B8972E]" />
            <span>Your Order History</span>
          </h2>
          <span className="text-xs text-[#736C66]">
            {orders.length} {orders.length === 1 ? "order" : "orders"} placed
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E8E0D5] p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#B8972E] mx-auto border border-[#E8E0D5]">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2C332D]">No Orders Placed Yet</h3>
            <p className="text-xs text-[#736C66] max-w-sm mx-auto">
              Explore our boutique collection of handmade resin coasters, bespoke letter keychains, and floral jewelry.
            </p>
            <Link
              href="/shop"
              className="inline-block px-6 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-full hover:bg-[#3D473E] transition"
            >
              Explore Shop
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const createdAtTime = new Date(order.createdAt).getTime();
              const elapsedMinutes = (Date.now() - createdAtTime) / (1000 * 60);
              const isWithin1Hour = elapsedMinutes <= 60;
              const remainingMinutes = Math.max(0, Math.floor(60 - elapsedMinutes));
              const isCancelled = order.orderStatus === "cancelled";

              return (
                <div
                  key={order.id || order.orderNumber}
                  className="bg-white rounded-3xl border border-[#E8E0D5] p-6 shadow-sm space-y-4 hover:border-[#D4AF37]/50 transition-colors"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F4EBE6] gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#2C332D]">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                            isCancelled
                              ? "bg-[#FDF2F2] text-[#DF4C4C]"
                              : order.orderStatus === "delivered"
                              ? "bg-[#E8EFE8] text-[#2E7D32]"
                              : "bg-[#FAF4EC] text-[#B8972E]"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#736C66] mt-0.5">
                        Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      <p className="text-sm font-bold text-[#2C332D]">
                        ₹{Number(order.totalAmount).toFixed(2)}
                      </p>
                      <span className="text-[10px] text-[#8C7A72]">
                        Payment: {order.paymentStatus === "paid" ? "Verified" : "Pending Verification (UPI)"}
                      </span>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="divide-y divide-[#F4EBE6]">
                    {order.items &&
                      order.items.map((item: any, idx: number) => (
                        <div key={idx} className="py-2.5 first:pt-0 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-[#2C332D]">{item.productName}</span>
                            {item.variantName && (
                              <span className="text-[11px] text-[#8C7A72] ml-1.5">({item.variantName})</span>
                            )}
                            <span className="text-[11px] text-[#736C66] block">
                              Qty: {item.quantity} &times; ₹{Number(item.unitPrice || 0).toFixed(2)}
                            </span>
                          </div>
                          <span className="font-semibold text-[#2C332D]">
                            ₹{Number(item.totalPrice || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* 1-Hour Cancellation Notice & Action */}
                  <div className="pt-3 border-t border-[#F4EBE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      {isCancelled ? (
                        <p className="text-xs text-[#DF4C4C] flex items-center gap-1.5 font-medium">
                          <XCircle className="w-4 h-4" />
                          <span>Order Cancelled: {order.cancellationReason || "By customer request"}</span>
                        </p>
                      ) : isWithin1Hour ? (
                        <p className="text-xs text-[#B8972E] flex items-center gap-1.5 font-medium">
                          <Clock className="w-4 h-4 animate-spin-slow" />
                          <span>
                            Cancellation available for next <strong>{remainingMinutes} minutes</strong> (1-hour window)
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs text-[#736C66] flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
                          <span>In Production — Cancellation window closed (exceeded 1 hour)</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {isWithin1Hour && !isCancelled && (
                        <button
                          type="button"
                          onClick={() => setCancellingOrderNumber(order.orderNumber)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-[#DF4C4C] hover:bg-[#FDF2F2] border border-[#DF4C4C]/30 rounded-xl transition-colors"
                        >
                          Cancel Order
                        </button>
                      )}
                      <Link
                        href={`/orders/${order.orderNumber}`}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-[#FAF8F5] text-[#2C332D] hover:bg-[#F4EBE6] border border-[#E8E0D5] rounded-xl flex items-center gap-1 transition-colors"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Modal / Inline Cancellation Prompt */}
                  {cancellingOrderNumber === order.orderNumber && (
                    <div className="p-4 bg-[#FDF2F2] rounded-2xl border border-[#FADBD8] space-y-3 mt-3 animate-fadeIn">
                      <p className="text-xs font-bold text-[#DF4C4C]">
                        Are you sure you want to cancel Order #{order.orderNumber}?
                      </p>
                      <p className="text-[11px] text-[#736C66]">
                        Handmade orders cancelled within 1 hour will be stopped immediately and any UPI payment will be returned.
                      </p>
                      <input
                        type="text"
                        placeholder="Reason for cancellation (optional)"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E8E0D5] rounded-xl focus:outline-none"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          disabled={cancelLoading}
                          onClick={() => handleCancelOrder(order.orderNumber)}
                          className="px-4 py-2 bg-[#DF4C4C] text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition"
                        >
                          {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancellingOrderNumber(null)}
                          className="px-4 py-2 bg-white border border-[#E8E0D5] text-[#736C66] text-xs font-semibold rounded-xl hover:bg-[#FAF8F5] transition"
                        >
                          Keep Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
