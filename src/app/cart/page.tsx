"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Gift,
  Tag,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    subtotal,
    appliedCoupon,
    setAppliedCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const freeShippingThreshold = 999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponLoading(true);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), cartAmount: subtotal }),
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

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#B8972E] mx-auto border border-[#E8E0D5] shadow-sm">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#2C332D]">Your Cart is Empty</h1>
        <p className="text-sm text-[#736C66] max-w-sm mx-auto font-light">
          You haven't added any handmade resin wonders to your bag yet.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#2C332D] text-white rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-[#3D473E] shadow-sm transition-all"
        >
          <span>Explore Boutique</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C332D]">
          Your Shopping Cart
        </h1>
        <p className="text-xs text-[#736C66] mt-1">
          Review your handmade pieces and personalised details before secure checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Free Shipping Alert */}
          <div className="bg-[#FAF4EC] border border-[#E8E0D5] p-4 rounded-2xl flex items-center justify-between text-xs text-[#2C332D]">
            {remainingForFreeShipping > 0 ? (
              <span>
                Add <strong className="text-[#B8972E]">₹{remainingForFreeShipping.toFixed(2)}</strong> more to get <strong>Complimentary Insured Shipping</strong>
              </span>
            ) : (
              <span className="flex items-center text-[#2E7D32] font-semibold">
                <Sparkles className="w-4 h-4 mr-1 text-[#D4AF37]" />
                You have unlocked Complimentary Insured Shipping!
              </span>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E0D5] divide-y divide-[#F4EBE6] shadow-sm overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-5 items-start sm:items-center justify-between">
                
                <div className="flex space-x-4 items-center">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#E8E0D5] flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <Link
                      href={`/shop/${item.slug}`}
                      className="font-serif text-sm font-semibold text-[#2C332D] hover:text-[#B8972E]"
                    >
                      {item.name}
                    </Link>
                    {item.variantName && (
                      <p className="text-xs text-[#736C66] mt-0.5">{item.variantName}</p>
                    )}
                    {item.personalizationDetails?.customName && (
                      <p className="text-xs text-[#B8972E] font-medium mt-0.5">
                        Custom Name: "{item.personalizationDetails.customName}"
                      </p>
                    )}
                    {item.giftWrapped && (
                      <span className="inline-flex items-center space-x-1 text-[10px] bg-[#E8EFE8] text-[#2E7D32] px-2 py-0.5 rounded mt-1">
                        <Gift className="w-3 h-3" />
                        <span>Gift Wrapped</span>
                      </span>
                    )}
                    <p className="text-xs font-bold text-[#2C332D] mt-1 sm:hidden">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Quantity Controller */}
                  <div className="flex items-center border border-[#E8E0D5] rounded-lg bg-[#FAF8F5]">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1.5 text-[#736C66] hover:text-[#2C332D]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-[#2C332D]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1.5 text-[#736C66] hover:text-[#2C332D]"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-[#2C332D]">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-[#A69E96]">₹{item.price.toFixed(2)} each</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-[#A69E96] hover:text-[#DF4C4C] transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
            <h2 className="font-serif text-lg font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
              Order Summary
            </h2>

            {/* Coupon Box */}
            {appliedCoupon ? (
              <div className="bg-[#E8EFE8] text-[#2E7D32] text-xs p-3 rounded-xl border border-[#C5D8C5] flex items-center justify-between font-medium">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Coupon <strong>{appliedCoupon.code}</strong> applied (-₹{appliedCoupon.discountAmount.toFixed(2)})</span>
                </div>
                <button
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs underline hover:text-[#DF4C4C]"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-1">
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
                    type="submit"
                    disabled={couponLoading}
                    className="px-4 py-2 text-xs font-semibold bg-[#FAF8F5] border border-[#E8E0D5] text-[#2C332D] rounded-xl hover:bg-[#F4EBE6] transition-colors"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-[#DF4C4C]">{couponError}</p>}
              </form>
            )}

            {/* Calculations */}
            <div className="space-y-2 text-xs text-[#736C66] border-t border-[#F4EBE6] pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#2C332D]">₹{subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-[#2E7D32]">
                  <span>Coupon Discount</span>
                  <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-[#2C332D]">
                  {subtotal >= freeShippingThreshold ? (
                    <span className="text-[#2E7D32]">FREE</span>
                  ) : (
                    "Calculated at checkout"
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#2C332D] border-t border-[#E8E0D5] pt-3">
                <span>Estimated Total</span>
                <span className="text-[#B8972E] text-lg">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full py-3.5 bg-[#2C332D] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-[#3D473E] shadow-md transition-all group"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="flex items-center justify-center space-x-2 text-[11px] text-[#8C7A72] pt-2">
              <Lock className="w-3.5 h-3.5 text-[#B8972E]" />
              <span>100% Secure Direct UPI & QR Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
