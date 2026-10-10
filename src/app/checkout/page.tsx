"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, appliedCoupon, setAppliedCoupon, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingCity: "",
    shippingState: "",
    shippingPostalCode: "",
    orderNotes: "",
  });

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const freeShippingThreshold = 999;
  const shippingCharge = subtotal >= freeShippingThreshold ? 0 : 79;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(1, subtotal - discount + shippingCharge);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponLoading(true);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim(),
          cartAmount: subtotal,
          customerEmail: formData.customerEmail || undefined,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: data.discountAmount,
        });
        setCouponInput("");
      } else {
        setCouponError(data.message || "Invalid coupon code.");
      }
    } catch {
      setCouponError("Could not validate coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add items before checking out.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        couponCode: appliedCoupon?.code || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || null,
          quantity: i.quantity,
          personalizationDetails: i.personalizationDetails || null,
          referenceImageUrl: i.referenceImageUrl || null,
          giftWrapped: i.giftWrapped || false,
        })),
      };

      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to initiate order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // If mock sandbox mode, redirect to interactive sandbox simulator
      if (data.sandboxPaymentUrl) {
        router.push(data.sandboxPaymentUrl);
        return;
      }

      // If live Cashfree payment session exists
      if (data.paymentSessionId) {
        // Redirect to Cashfree PG or return URL
        const redirectUrl = `/checkout/verify?order_id=${data.orderNumber}`;
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#B8972E] mx-auto border border-[#E8E0D5]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#2C332D]">Your Cart is Empty</h1>
        <p className="text-xs text-[#736C66]">Please select your favorite pieces from our shop before checkout.</p>
        <Link
          href="/shop"
          className="inline-block mt-2 px-6 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-full hover:bg-[#3D473E]"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C332D]">
          Secure Checkout
        </h1>
        <p className="text-xs text-[#736C66] mt-1 flex items-center space-x-1.5">
          <Lock className="w-3.5 h-3.5 text-[#B8972E]" />
          <span>Encrypted with Cashfree Payment Gateway &bull; 100% Safe & Insured</span>
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#FADBD8] text-xs text-[#DF4C4C] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ---------------- Left Column: Customer & Shipping ---------------- */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Customer Contact */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-4">
            <h2 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
              1. Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  name="customerName"
                  placeholder="e.g. Priya Sharma"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Mobile Number (for delivery updates) *
                </label>
                <input
                  type="tel"
                  required
                  name="customerPhone"
                  placeholder="e.g. 9820154321"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Email Address (for order confirmation & invoice) *
              </label>
              <input
                type="email"
                required
                name="customerEmail"
                placeholder="e.g. priya@example.com"
                value={formData.customerEmail}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-4">
            <h2 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
              2. Shipping Address
            </h2>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                House / Flat / Building & Street Address *
              </label>
              <input
                type="text"
                required
                name="shippingAddressLine1"
                placeholder="e.g. Flat 402, Green Meadows, 5th Main Road"
                value={formData.shippingAddressLine1}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Apartment, Suite, Landmark (Optional)
              </label>
              <input
                type="text"
                name="shippingAddressLine2"
                placeholder="e.g. Near Metro Station, Indiranagar"
                value={formData.shippingAddressLine2}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  name="shippingCity"
                  placeholder="e.g. Bengaluru"
                  value={formData.shippingCity}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  name="shippingState"
                  placeholder="e.g. Karnataka"
                  value={formData.shippingState}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Pincode (6 digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  name="shippingPostalCode"
                  placeholder="e.g. 560038"
                  value={formData.shippingPostalCode}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Order Notes / Delivery Instructions (Optional)
              </label>
              <textarea
                name="orderNotes"
                rows={2}
                placeholder="e.g. Please ring bell twice or leave with security."
                value={formData.orderNotes}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        {/* ---------------- Right Column: Order Summary & Payment ---------------- */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
            <h2 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
              Order Summary ({items.length} items)
            </h2>

            {/* Itemized Snapshot */}
            <div className="max-h-60 overflow-y-auto divide-y divide-[#F4EBE6] pr-1 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex space-x-3 items-center">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#FAF8F5] border border-[#E8E0D5] flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#2C332D] line-clamp-1">{item.name}</p>
                    {item.variantName && <p className="text-[11px] text-[#736C66]">{item.variantName}</p>}
                    {item.personalizationDetails?.customName && (
                      <span className="text-[10px] text-[#B8972E] block">
                        Custom: &ldquo;{item.personalizationDetails.customName}&rdquo;
                      </span>
                    )}
                    <p className="text-[11px] text-[#736C66] mt-0.5">
                      Qty: {item.quantity} &times; ₹{item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-[#2C332D]">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            {appliedCoupon ? (
              <div className="bg-[#E8EFE8] text-[#2E7D32] text-xs p-3 rounded-xl border border-[#C5D8C5] flex items-center justify-between font-medium">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Coupon <strong>{appliedCoupon.code}</strong> applied (-₹{appliedCoupon.discountAmount})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs underline hover:text-[#DF4C4C]"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#8C7A72] absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="w-full pl-8 pr-3 py-2 text-xs uppercase bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="px-4 py-2 text-xs font-semibold bg-[#FAF8F5] border border-[#E8E0D5] text-[#2C332D] rounded-xl hover:bg-[#F4EBE6]"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-[#DF4C4C]">{couponError}</p>}
              </div>
            )}

            {/* Price Calculations */}
            <div className="space-y-2 text-xs text-[#736C66] border-t border-[#F4EBE6] pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#2C332D]">₹{subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-[#2E7D32]">
                  <span>Discount</span>
                  <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Insured Shipping</span>
                <span className="font-semibold text-[#2C332D]">
                  {shippingCharge === 0 ? (
                    <span className="text-[#2E7D32]">FREE</span>
                  ) : (
                    `₹${shippingCharge.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#2C332D] border-t border-[#E8E0D5] pt-3">
                <span>Total Payable</span>
                <span className="text-[#B8972E] text-lg">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#2C332D] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-[#3D473E] shadow-md transition-all disabled:opacity-60 group"
            >
              <span>{isSubmitting ? "Initiating Cashfree Payment..." : `Pay ₹${finalTotal.toFixed(2)} via Cashfree`}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="text-center text-[11px] text-[#8C7A72] space-y-1">
              <p>Supported: UPI, Google Pay, PhonePe, Debit/Credit Cards, NetBanking</p>
              <p className="flex items-center justify-center space-x-1 text-[#2E7D32]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Secure Payment Powered by Cashfree Payments</span>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
