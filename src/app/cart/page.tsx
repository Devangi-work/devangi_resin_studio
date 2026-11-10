"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  MessageCircle,
  MapPin,
  Check,
  X,
} from "lucide-react";
import { buildCartWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp";
import { resolveShippingCharge } from "@/lib/shipping";
import DynamicUpiPaymentModal from "@/components/payment/DynamicUpiPaymentModal";

function CartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    appliedCoupon,
    setAppliedCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Authentication & WhatsApp redirection states
  const [customer, setCustomer] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [adminPhone, setAdminPhone] = useState("+91 9967313355");
  const [redirectingWhatsApp, setRedirectingWhatsApp] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [orderLaterNotice, setOrderLaterNotice] = useState<string | null>(null);

  const configuredCityRates: Array<{ id: string; name: string; charge: number | string }> =
    Array.isArray(siteSettings?.cityShippingRates) ? siteSettings.cityShippingRates : [];

  useEffect(() => {
    // Check if customer is logged in
    fetch("/api/customer/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.customer) {
          setCustomer(data.customer);
        }
      })
      .catch(() => { });

    // Fetch site settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((s) => {
        if (s && !s.error) {
          setSiteSettings(s);
          if (s?.whatsappNumber || s?.contactPhone) {
            setAdminPhone(s.whatsappNumber || s.contactPhone);
          }
        }
      })
      .catch(() => { });
  }, []);

  // Automatically determine city and shipping rate from the customer's completed profile
  const userCity = (customer?.city || customer?.state || "").trim();

  const shippingInfo = resolveShippingCharge({
    subtotal,
    cityName: userCity || null,
    stateName: customer?.state || null,
    postalCode: customer?.postalCode || null,
    cityRates: configuredCityRates,
    defaultShippingCharge: siteSettings?.defaultShippingCharge,
    freeShippingThreshold: siteSettings?.freeShippingThreshold,
  });

  const freeShippingThreshold = shippingInfo.freeShippingThreshold;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const discount = appliedCoupon ? Number(appliedCoupon.discountAmount) : 0;
  const shippingCharge = subtotal === 0 ? 0 : shippingInfo.charge;
  const finalTotal = Math.max(0, subtotal - discount + shippingCharge);
  const totalItemsSavings = items.reduce((acc, it) => {
    if (it.originalPrice && it.originalPrice > it.price) {
      return acc + (it.originalPrice - it.price) * it.quantity;
    }
    return acc;
  }, 0);

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
          items: items.map((it) => ({
            productId: it.productId,
            price: it.price,
            quantity: it.quantity,
          })),
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

  const triggerWhatsAppCheckout = async (cust?: any) => {
    if (items.length === 0) return;
    if (cust) setCustomer(cust);
    setIsPaymentModalOpen(true);
  };

  const handlePaidSubmit = async (paymentReference: string, screenshotUrl?: string | null) => {
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
          paymentReference,
          paymentScreenshotUrl: screenshotUrl || null,
          orderNotes: "Cart Checkout via Dynamic UPI QR",
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
      customer,
      orderNumber: createdOrderNumber,
      paymentReference,
      paymentStatus: "Pending Verification",
      paymentScreenshotUrl: screenshotUrl || null,
    });

    setIsPaymentModalOpen(false);
    // Cart management for Cart Checkout + Paid:
    // Remove the purchased cart items after successful submission of the Paid option.
    clearCart();
    const url = getWhatsAppUrl(adminPhone, message);
    window.location.href = url;
  };

  const handleWillOrderLater = () => {
    // Cart Checkout: Keep all existing cart products. Preserve their quantities.
    // Do not remove any products. Do not clear the cart. Do not modify the cart contents.
    setIsPaymentModalOpen(false);
    setOrderLaterNotice("Your items have been saved in your cart! You can continue shopping and place your order whenever you're ready.");
    setTimeout(() => setOrderLaterNotice(null), 6000);
  };

  // If redirected back from login with ?checkout=whatsapp
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isWhatsAppReturn = searchParams.get("checkout") === "whatsapp";
    if (isWhatsAppReturn && items.length > 0) {
      fetch("/api/customer/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.authenticated && data?.customer) {
            setCustomer(data.customer);
            window.history.replaceState({}, "", window.location.pathname);
            triggerWhatsAppCheckout(data.customer);
          }
        })
        .catch(() => { });
    }
  }, [searchParams, items.length, subtotal, discount, shippingCharge, finalTotal, adminPhone]);

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
    } catch { }

    // 2. Not logged in -> redirect to login with return redirect back to /cart?checkout=whatsapp
    const returnUrl = "/cart?checkout=whatsapp";
    router.push(`/account/login?redirect=${encodeURIComponent(returnUrl)}`);
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
          {/* Free Shipping Alert (only if threshold is set > 0) */}
          {freeShippingThreshold > 0 && (
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
          )}

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
                      <p className="text-xs text-[#736C66] mt-0.5 leading-snug">{item.variantName}</p>
                    )}
                    {item.personalizationDetails?.color && (
                      <p className="text-xs text-[#800020] font-semibold mt-0.5">
                        Color Theme: {item.personalizationDetails.color}
                      </p>
                    )}
                    {item.personalizationDetails?.customName && (
                      <p className="text-xs text-[#B8972E] font-medium mt-0.5">
                        Custom Name: "{item.personalizationDetails.customName}"
                      </p>
                    )}
                    {item.referenceImageUrl && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <img src={item.referenceImageUrl} alt="Reference" className="w-6 h-6 rounded object-cover border border-[#E8E0D5]" />
                        <a
                          href={item.referenceImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#2E7D32] underline font-medium hover:text-[#1e5822]"
                        >
                          View Reference Photo
                        </a>
                      </div>
                    )}
                    {item.giftWrapped && (
                      <span className="inline-flex items-center space-x-1 text-[10px] bg-[#E8EFE8] text-[#2E7D32] px-2 py-0.5 rounded mt-1">
                        <Gift className="w-3 h-3" />
                        <span>Gift Wrapped</span>
                      </span>
                    )}
                    {item.isFestivalSpecial && (
                      <span className="inline-flex items-center space-x-1 text-[10px] bg-[#FFF0F4] text-[#800020] border border-[#D4AF37]/40 px-2 py-0.5 rounded font-bold mt-1">
                        <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                        <span>
                          {item.festivalDiscountType === "fixed" && item.festivalDiscountAmount
                            ? `₹${Number(item.festivalDiscountAmount)} Festive Deal`
                            : item.festivalDiscountPercentage
                              ? `${String(item.festivalDiscountPercentage).replace(/%/g, "")}% Festive Deal`
                              : item.festivalDiscountAmount
                                ? `₹${Number(item.festivalDiscountAmount)} Festive Deal`
                                : "Festive Deal"}
                        </span>
                      </span>
                    )}
                    <div className="sm:hidden mt-1 flex items-baseline space-x-2">
                      <p className="text-xs font-bold text-[#2C332D]">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <p className="text-[10px] text-[#A69E96] line-through">
                          ₹{(item.originalPrice * item.quantity).toFixed(2)}
                        </p>
                      )}
                    </div>
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
                    <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                      <p className="text-[11px] text-[#A69E96]">₹{item.price.toFixed(2)} each</p>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <p className="text-[11px] text-[#C04E6C] line-through font-medium">
                          ₹{item.originalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
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
              {totalItemsSavings > 0 && (
                <div className="flex justify-between text-[#2E7D32] font-semibold">
                  <span>Product Savings</span>
                  <span>-₹{totalItemsSavings.toFixed(2)}</span>
                </div>
              )}
              {appliedCoupon && appliedCoupon.code.toUpperCase().includes("FESTIVE") ? (
                <div className="flex justify-between text-[#800020] font-semibold bg-[#FFF0F4] px-2.5 py-1.5 rounded-lg border border-[#D4AF37]/30">
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
              {/* Saved Delivery Address Card (Auto-detected from profile) */}
              <div className="py-2.5 px-3 rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#2C332D] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#B8972E] flex-shrink-0" />
                    <span>
                      {customer?.addressLine1 && customer?.city ? (
                        <>Deliver to: {customer.name || "Customer"}</>
                      ) : customer ? (
                        <>Delivery Address</>
                      ) : (
                        <>Delivering across India</>
                      )}
                    </span>
                  </span>
                  {customer?.addressLine1 && customer?.city ? (
                    <Link href="/account/profile" className="text-[11px] text-[#B84A67] font-semibold hover:underline">
                      Edit
                    </Link>
                  ) : customer ? (
                    <Link href="/account/profile" className="text-[11px] text-[#B84A67] font-semibold hover:underline">
                      + Add Address
                    </Link>
                  ) : (
                    <Link href="/account/login?redirect=/cart" className="text-[11px] text-[#B84A67] font-semibold hover:underline">
                      Sign In
                    </Link>
                  )}
                </div>
                {customer?.addressLine1 && customer?.city ? (
                  <>
                    <p className="text-[11px] text-[#736C66] leading-snug">
                      {[customer.addressLine1, customer.addressLine2, customer.city, customer.state, customer.postalCode].filter(Boolean).join(", ")}
                    </p>
                    {shippingInfo.matchedCityName && (
                      <div className="text-[10px] text-[#B84A67] font-semibold bg-[#FAF0F3] px-2 py-0.5 rounded border border-[#EFE3E7] inline-block">
                        📍 {shippingInfo.matchedCityName} City Rate ({shippingInfo.isFree ? "FREE" : `₹${shippingInfo.charge.toFixed(2)}`}) Applied Automatically
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-[#A69E96]">
                    {customer
                      ? "Add your address in your profile to auto-apply your city delivery charges."
                      : "Sign in to apply your saved delivery address and city shipping price."}
                  </p>
                )}
              </div>

              <div className="flex justify-between">
                <span>
                  Insured Delivery {shippingInfo.matchedCityName ? `(${shippingInfo.matchedCityName})` : ""}
                </span>
                <span className="font-semibold text-[#2C332D]">
                  {shippingInfo.isFree ? (
                    <span className="text-[#2E7D32]">FREE (Complimentary)</span>
                  ) : (
                    `₹${shippingCharge.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#2C332D] border-t border-[#E8E0D5] pt-3">
                <span>Estimated Total</span>
                <span className="text-[#B8972E] text-lg">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

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

            <div className="text-center">
              <Link
                href="/checkout"
                className="text-[11px] text-[#736C66] hover:text-[#2C332D] underline font-medium"
              >
                Or proceed with standard web checkout
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-2 text-[11px] text-[#8C7A72] pt-2">
              <Lock className="w-3.5 h-3.5 text-[#B8972E]" />
              <span>100% Secure WhatsApp & UPI Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Toast for Will Order Later */}
      {orderLaterNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#2C332D] text-white p-4 rounded-2xl shadow-2xl border border-[#D4AF37]/50 flex items-start space-x-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-6 h-6 rounded-full bg-[#2E7D32] flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-[#FFDF78]">Items Saved in Cart</p>
            <p className="mt-0.5 text-white/90 leading-relaxed">{orderLaterNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setOrderLaterNotice(null)}
            className="p-1 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dynamic UPI Payment Popup */}
      {isPaymentModalOpen && (
        <DynamicUpiPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          payableAmount={finalTotal}
          subtotal={subtotal}
          shippingCharge={shippingCharge}
          discountAmount={discount}
          couponCode={appliedCoupon?.code || null}
          upiId={siteSettings?.upiId}
          accountHolderName={siteSettings?.accountHolderName}
          storeName={siteSettings?.storeName || "Devangi Resin Studio"}
          customer={customer}
          itemsSummary={items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            variantName: i.variantName,
          }))}
          onPaidSubmit={handlePaidSubmit}
          onWillOrderLater={handleWillOrderLater}
        />
      )}
    </div>
  );
}

export default function CartPage() {
  return (
    <React.Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-[#8C7A72]">Loading cart...</div>}>
      <CartContent />
    </React.Suspense>
  );
}
