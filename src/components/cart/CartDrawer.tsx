"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  MessageCircle,
} from "lucide-react";
import { buildCartWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp";

export function CartDrawer() {
  const router = useRouter();
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

  // Authentication & WhatsApp redirection states
  const [customer, setCustomer] = useState<any>(null);
  const [adminPhone, setAdminPhone] = useState("+91 9967313355");
  const [defaultShippingCharge, setDefaultShippingCharge] = useState(79);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(999);
  const [redirectingWhatsApp, setRedirectingWhatsApp] = useState(false);

  useEffect(() => {
    // Check if customer is logged in
    fetch("/api/customer/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.customer) {
          setCustomer(data.customer);
        }
      })
      .catch(() => {});

    // Fetch site settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((s) => {
        if (s?.whatsappNumber || s?.contactPhone) {
          setAdminPhone(s.whatsappNumber || s.contactPhone);
        }
        if (s?.defaultShippingCharge) {
          setDefaultShippingCharge(Number(s.defaultShippingCharge) || 79);
        }
        if (s?.freeShippingThreshold) {
          setFreeShippingThreshold(Number(s.freeShippingThreshold) || 999);
        }
      })
      .catch(() => {});
  }, [isCartOpen]);

  const freeShippingGoal = freeShippingThreshold;
  const progressPercent = Math.min(100, (subtotal / freeShippingGoal) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingGoal - subtotal);
  const discount = appliedCoupon ? Number(appliedCoupon.discountAmount) : 0;
  const shippingCharge = subtotal >= freeShippingGoal || subtotal === 0 ? 0 : defaultShippingCharge;
  const finalTotal = Math.max(0, subtotal - discount + shippingCharge);

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

  const triggerWhatsAppCheckout = async (cust?: any) => {
    if (items.length === 0) return;
    setRedirectingWhatsApp(true);

    let createdOrderNumber: string | null = null;
    try {
      const res = await fetch("/api/orders/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId || null,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            variantId: i.variantId || null,
            variantName: i.variantName || null,
            image: i.image || null,
            personalizationDetails: i.personalizationDetails || null,
            referenceImageUrl: i.referenceImageUrl || null,
            giftWrapped: Boolean(i.giftWrapped),
            giftWrapCharge: i.giftWrapped ? Number(i.giftWrapCharge || 0) : 0,
          })),
          subtotal,
          discountAmount: discount,
          couponCode: appliedCoupon?.code || null,
          shippingCharge,
          finalTotal,
          orderNotes: "Cart Drawer Checkout via WhatsApp",
        }),
      });
      const data = await res.json();
      if (data?.orderNumber) {
        createdOrderNumber = data.orderNumber;
      }
    } catch (err) {
      console.error("Failed to create WhatsApp cart order:", err);
    }

    const message = buildCartWhatsAppMessage({
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        variantName: i.variantName,
        personalizationDetails: i.personalizationDetails,
        giftWrapped: i.giftWrapped,
        giftWrapCharge: i.giftWrapCharge,
        referenceImageUrl: i.referenceImageUrl,
      })),
      subtotal,
      discountAmount: discount,
      couponCode: appliedCoupon?.code || null,
      shippingCharge,
      finalTotal,
      customer: cust || customer,
      orderNumber: createdOrderNumber,
    });

    const url = getWhatsAppUrl(adminPhone, message);
    setIsCartOpen(false);
    window.location.href = url;
  };

  const handleProceedToCheckout = async () => {
    if (items.length === 0) return;

    // 1. Check if user is logged in
    try {
      const res = await fetch("/api/customer/me");
      const data = await res.json();
      if (data?.authenticated && data?.customer) {
        setCustomer(data.customer);
        triggerWhatsAppCheckout(data.customer);
        return;
      }
    } catch {}

    // 2. Not logged in -> close cart and redirect to login
    setIsCartOpen(false);
    const returnUrl = "/cart?checkout=whatsapp";
    router.push(`/account/login?redirect=${encodeURIComponent(returnUrl)}`);
  };

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

                      {item.isFestivalSpecial && (
                        <span className="inline-flex items-center space-x-1 mt-1 text-[10px] bg-[#FFF0F4] text-[#800020] border border-[#D4AF37]/40 px-2 py-0.5 rounded font-bold">
                          <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                          <span>
                            {item.festivalDiscountPercentage
                              ? `${String(item.festivalDiscountPercentage).replace(/%/g, "")}% Festive Deal`
                              : "Festive Deal"}
                          </span>
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

                      <div className="text-right">
                        <span className="text-xs font-bold text-[#2C332D]">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="block text-[10px] text-[#A69E96] line-through">
                            ₹{(item.originalPrice * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>
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
                {appliedCoupon && appliedCoupon.code.toUpperCase().includes("FESTIVE") ? (
                  <div className="flex justify-between text-[#800020] font-semibold bg-[#FFF0F4] px-2 py-1 rounded-md border border-[#D4AF37]/30">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      <span>Festive Deal Savings ({appliedCoupon.code})</span>
                    </span>
                    <span>
                      -₹{appliedCoupon.discountAmount.toFixed(2)}
                    </span>
                  </div>
                ) : appliedCoupon ? (
                  <div className="flex justify-between text-[#2E7D32] font-semibold">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-[#3A1823]">
                    {shippingCharge === 0 ? (
                      <span className="text-[#2E7D32] font-semibold">FREE</span>
                    ) : (
                      `₹${shippingCharge.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#3A1823] pt-2 border-t border-[#EFE3E7]">
                  <span>Estimated Total</span>
                  <span className="text-[#B84A67] text-base">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={redirectingWhatsApp}
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all group active:scale-[0.99] disabled:opacity-70"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>
                  {redirectingWhatsApp
                    ? "Opening WhatsApp..."
                    : "Proceed to Secure Checkout"}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center justify-between text-[11px] text-[#7A5E68] pt-1">
                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="underline hover:text-[#3A1823] font-medium"
                >
                  View Full Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="underline hover:text-[#3A1823]"
                >
                  Web Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
