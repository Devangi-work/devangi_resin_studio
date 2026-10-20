"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Gift,
  Tag,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    subtotal,
    appliedCoupon,
    setAppliedCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const freeShippingGoal = 999;
  const progressPercent = Math.min(100, (subtotal / freeShippingGoal) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingGoal - subtotal);

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

  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FCFAF8] shadow-2xl flex flex-col border-l border-[#EFE3E7]">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-white border-b border-[#EFE3E7] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#3A1823]" />
              <h2 className="font-serif text-lg font-bold text-[#3A1823]">Your Cart</h2>
              <span className="text-xs bg-[#FAF0F3] text-[#7A5E68] px-2 py-0.5 rounded-full font-medium">
                {items.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-[#7A5E68] hover:text-[#3A1823] hover:bg-[#FAF0F3] rounded-full transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[#FAF0F3] px-6 py-3 border-b border-[#EFE3E7]">
            <div className="flex items-center justify-between text-xs text-[#3A1823] mb-1.5">
              {remainingForFreeShipping > 0 ? (
                <span>
                  Add <strong className="text-[#B84A67]">₹{remainingForFreeShipping.toFixed(2)}</strong> more for <strong>FREE Insured Shipping</strong>
                </span>
              ) : (
                <span className="flex items-center text-[#2E7D32] font-semibold">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-[#D4AF37]" />
                  Complimentary Insured Shipping Unlocked!
                </span>
              )}
              <span className="text-[11px] text-[#7A5E68]">{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-[#EFE3E7] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#B84A67] to-[#D4AF37] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-[#736C66] space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#F4EBE6] flex items-center justify-center text-[#B8972E]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#2C332D]">Your cart is empty</h3>
                <p className="text-xs max-w-xs text-[#A69E96]">
                  Explore our handcrafted resin coasters, floral keychains, and botanical jewellery.
                </p>
                <Link
                  href="/shop"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 inline-flex items-center space-x-2 text-xs font-semibold bg-[#2C332D] text-white px-5 py-2.5 rounded-full hover:bg-[#3D473E] transition-colors"
                >
                  <span>Explore Boutique</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-xl border border-[#E8E0D5] flex space-x-3.5 shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-[#FAF8F5] rounded-lg overflow-hidden flex-shrink-0 border border-[#E8E0D5]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <Link
                          href={`/shop/${item.slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-xs font-semibold text-[#2C332D] hover:text-[#B8972E] line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#A69E96] hover:text-[#DF4C4C] p-1 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant & Personalization badges */}
                      {item.variantName && (
                        <p className="text-[11px] text-[#736C66] mt-0.5">
                          {item.variantName}
                        </p>
                      )}

                      {item.personalizationDetails?.customName && (
                        <span className="inline-block mt-1 text-[10px] bg-[#F4EBE6] text-[#B8972E] font-medium px-2 py-0.5 rounded">
                          Name: "{item.personalizationDetails.customName}"
                        </span>
                      )}

                      {item.giftWrapped && (
                        <span className="inline-flex items-center space-x-1 mt-1 text-[10px] bg-[#E8EFE8] text-[#2E7D32] px-2 py-0.5 rounded ml-1">
                          <Gift className="w-2.5 h-2.5" />
                          <span>Gift Wrapped</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F4EBE6]">
                      <div className="flex items-center space-x-2 border border-[#E8E0D5] rounded-md px-1 py-0.5 bg-[#FAF8F5]">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 text-[#736C66] hover:text-[#2C332D]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold text-[#2C332D] px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 text-[#736C66] hover:text-[#2C332D]"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-[#2C332D]">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer with Coupon & Checkout */}
          {items.length > 0 && (
            <div className="p-6 bg-white border-t border-[#E8E0D5] space-y-4">
              
              {/* Coupon Code Section */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-[#E8EFE8] text-[#2E7D32] text-xs px-3 py-2 rounded-lg font-medium border border-[#C5D8C5]">
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
                      <Tag className="w-3.5 h-3.5 text-[#7A5E68] absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Coupon code (e.g. WELCOME10)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="w-full pl-8 pr-3 py-2 text-xs uppercase bg-[#FCFAF8] border border-[#EFE3E7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="px-4 py-2 text-xs font-semibold bg-[#FAF0F3] border border-[#EFE3E7] text-[#3A1823] rounded-lg hover:bg-[#F5E2E8] transition-colors"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-[#DF4C4C]">{couponError}</p>}
                </form>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-[#7A5E68] pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#3A1823]">₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-[#2E7D32]">
                    <span>Coupon Discount</span>
                    <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-[#3A1823]">
                    {subtotal >= freeShippingGoal ? (
                      <span className="text-[#2E7D32] font-semibold">FREE</span>
                    ) : (
                      "Calculated at checkout"
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#3A1823] pt-2 border-t border-[#EFE3E7]">
                  <span>Estimated Total</span>
                  <span className="text-[#B84A67] text-base">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3.5 bg-[#3A1823] text-white rounded-xl font-semibold text-xs tracking-wide flex items-center justify-center space-x-2 hover:bg-[#4E2230] active:scale-98 shadow-md transition-all group"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
