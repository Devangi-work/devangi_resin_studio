"use client";

import React, { useState, useEffect } from "react";
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
  Copy,
  Check,
  QrCode,
  Smartphone,
  UserCheck,
  UserPlus,
  ExternalLink,
  Info,
  X,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, appliedCoupon, setAppliedCoupon, clearCart } = useCart();

  // Authentication State
  const [authChecked, setAuthChecked] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Quick Auth Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [settings, setSettings] = useState<{
    upiId?: string;
    accountHolderName?: string;
    upiQrCodeUrl?: string;
    contactPhone?: string;
    whatsappNumber?: string;
    defaultShippingCharge?: string;
    freeShippingThreshold?: string;
  }>({
    upiId: "devangi0403@okaxis",
    accountHolderName: "Devangi Resin Studio",
    upiQrCodeUrl: "",
    contactPhone: "+91 9967313355",
    whatsappNumber: "+91 9967313355",
    defaultShippingCharge: "79.00",
    freeShippingThreshold: "999.00",
  });

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

  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [orderSuccessMessage, setOrderSuccessMessage] = useState("");

  // Fetch settings & Customer Session
  useEffect(() => {
    if (typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      setIsIOS(true);
    }

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSettings(data);
      })
      .catch((err) => console.error("Error loading settings:", err));

    fetch("/api/customer/me")
      .then((res) => res.json())
      .then((data) => {
        setAuthChecked(true);
        if (data.authenticated && data.customer) {
          setCustomer(data.customer);
          // Autofill checkout details from customer profile
          setFormData({
            customerName: data.customer.name || "",
            customerEmail: data.customer.email || "",
            customerPhone: data.customer.phone || "",
            shippingAddressLine1: data.customer.addressLine1 || "",
            shippingAddressLine2: data.customer.addressLine2 || "",
            shippingCity: data.customer.city || "",
            shippingState: data.customer.state || "",
            shippingPostalCode: data.customer.postalCode || "",
            orderNotes: "",
          });
        }
      })
      .catch((err) => {
        console.error("Customer session check:", err);
        setAuthChecked(true);
      });
  }, []);

  const freeThreshold = Number(settings.freeShippingThreshold || 999);
  const defaultShipFee = Number(settings.defaultShippingCharge || 79);
  const shippingCharge = subtotal >= freeThreshold ? 0 : defaultShipFee;
  const discount = appliedCoupon ? Number(appliedCoupon.discountAmount) : 0;
  // Strictly no round off - preserve exact decimals
  const finalTotal = Math.max(1, subtotal - discount + shippingCharge);

  const activeUpiId = settings.upiId || "devangibarai0403@okhdfcbank";
  const activePayeeName = settings.accountHolderName || "Devangi Banshilal Barai";
  const activePhone = (settings.contactPhone || settings.whatsappNumber || "9967313355").replace(/[^0-9]/g, "").slice(-10);

  // Exact UPI URI format requested:
  // upi://pay?pa=devangibarai0403@okhdfcbank&pn=Devangi%20Banshilal%20Barai&am=1.00&cu=INR&tn=Test%20Payment&tr=TESTUPI001
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(
    activeUpiId
  )}&pn=${encodeURIComponent(
    activePayeeName
  )}&am=${finalTotal.toFixed(2)}&cu=INR&tn=Test%20Payment&tr=TESTUPI001`;

  // App Launcher URLs (Directly opens App Home Screen - Image 2 - without triggering Image 1 collect block)
  const phonepeAppUrl = isIOS
    ? "phonepe://"
    : "intent://#Intent;scheme=phonepe;package=com.phonepe.app;end";
  const gpayAppUrl = isIOS
    ? "gpay://"
    : "intent://#Intent;scheme=gpay;package=com.google.android.apps.nbu.paisa.user;end";
  const paytmAppUrl = isIOS
    ? "paytmmp://"
    : "intent://#Intent;scheme=paytmmp;package=net.one97.paytm;end";

  // Dynamic QR Code generation if admin has not uploaded a static image
  const dynamicQrUrl = settings.upiQrCodeUrl
    ? settings.upiQrCodeUrl
    : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(
        upiIntentUri
      )}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const copyPhoneToClipboard = () => {
    navigator.clipboard.writeText(activePhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const copyAmountToClipboard = () => {
    navigator.clipboard.writeText(finalTotal.toFixed(2));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2500);
  };

  const handleOpenUpiApp = () => {
    setShowUpiModal(true);
  };

  const handleProceedToApp = () => {
    window.location.href = upiIntentUri;
  };

  // Quick In-Checkout Login
  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Login failed. Please check your credentials.");
        setAuthLoading(false);
        return;
      }

      // Re-fetch profile to autofill
      const meRes = await fetch("/api/customer/me");
      const meData = await meRes.json();
      if (meData.authenticated && meData.customer) {
        setCustomer(meData.customer);
        setFormData((prev) => ({
          ...prev,
          customerName: meData.customer.name || prev.customerName,
          customerEmail: meData.customer.email || prev.customerEmail,
          customerPhone: meData.customer.phone || prev.customerPhone,
          shippingAddressLine1: meData.customer.addressLine1 || prev.shippingAddressLine1,
          shippingAddressLine2: meData.customer.addressLine2 || prev.shippingAddressLine2,
          shippingCity: meData.customer.city || prev.shippingCity,
          shippingState: meData.customer.state || prev.shippingState,
          shippingPostalCode: meData.customer.postalCode || prev.shippingPostalCode,
        }));
      }
    } catch {
      setAuthError("Network error occurred during login.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Quick In-Checkout Register
  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch("/api/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Registration failed. Please check your details.");
        setAuthLoading(false);
        return;
      }

      setCustomer(data.customer);
      setFormData({
        customerName: data.customer.name || "",
        customerEmail: data.customer.email || "",
        customerPhone: data.customer.phone || "",
        shippingAddressLine1: data.customer.addressLine1 || "",
        shippingAddressLine2: data.customer.addressLine2 || "",
        shippingCity: data.customer.city || "",
        shippingState: data.customer.state || "",
        shippingPostalCode: data.customer.postalCode || "",
        orderNotes: "",
      });
    } catch {
      setAuthError("Network error occurred during registration.");
    } finally {
      setAuthLoading(false);
    }
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
          discountAmount: Number(data.discountAmount),
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

    if (!customer) {
      setErrorMessage("Please sign in or register to complete your order.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add items before checking out.");
      return;
    }

    if (!upiTransactionId.trim() || upiTransactionId.trim().length < 4) {
      setErrorMessage("Please enter your 12-digit UPI Reference / UTR Number after completing payment in your UPI app.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        customerId: customer.id,
        couponCode: appliedCoupon?.code || undefined,
        upiTransactionId: upiTransactionId.trim(),
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
        setErrorMessage(data.error || "Failed to submit order. Please verify your details.");
        setIsSubmitting(false);
        return;
      }

      // Order created successfully!
      setOrderSuccessMessage(
        "Thank you for shopping! Your payment is getting validated. After confirmation, your order will start processing."
      );
      clearCart();

      // Smoothly navigate to order confirmation
      setTimeout(() => {
        router.push(`/orders/${data.orderNumber}`);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !orderSuccessMessage) {
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

  // Mandatory Login Gate if user is not authenticated
  if (authChecked && !customer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#FAF4EC] rounded-full flex items-center justify-center text-[#B8972E] mx-auto border border-[#E8E0D5]">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C332D]">
            Sign in to Complete Your Purchase
          </h1>
          <p className="text-xs text-[#736C66] max-w-md mx-auto">
            You must be logged in to purchase handcrafted items. This allows you to track custom creation, courier delivery, and cancel within 1 hour if needed.
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-[#FDF2F2] border border-[#FADBD8] rounded-xl text-xs text-[#DF4C4C] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* 1-Click Google Sign-In */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E0D5] shadow-sm space-y-5">
          <button
            type="button"
            onClick={() => {
              window.location.href = `/api/auth/google?redirect=/checkout`;
            }}
            className="w-full py-3 px-4 bg-white border border-[#D5CEC5] hover:bg-[#FAF8F5] text-[#2C332D] text-xs font-semibold rounded-xl flex items-center justify-center space-x-3 shadow-xs transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm">Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E8E0D5] w-full" />
            <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#A0988F] absolute">
              or continue with email
            </span>
          </div>

          {/* Toggle between Login and Register */}
          <div className="flex bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E0D5]">
            <button
              type="button"
              onClick={() => setAuthTab("login")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                authTab === "login"
                  ? "bg-[#2C332D] text-white shadow-xs"
                  : "text-[#736C66] hover:text-[#2C332D]"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Already Registered? Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthTab("register")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                authTab === "register"
                  ? "bg-[#2C332D] text-white shadow-xs"
                  : "text-[#736C66] hover:text-[#2C332D]"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Customer? Register</span>
            </button>
          </div>

          {/* Login Tab */}
          {authTab === "login" ? (
            <form onSubmit={handleQuickLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 hover:bg-[#3D473E] transition-all disabled:opacity-50 mt-1"
              >
                <span>{authLoading ? "Signing in..." : "Sign In & Proceed to Checkout"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Register Tab */
            <form onSubmit={handleQuickRegister} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    placeholder="e.g. 9820154321"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Password (min 6 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={registerData.addressLine1}
                  onChange={(e) => setRegisterData({ ...registerData, addressLine1: e.target.value })}
                  placeholder="Flat / House No., Apartment, Street"
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.city}
                    onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })}
                    placeholder="Mumbai"
                    className="w-full px-2.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.state}
                    onChange={(e) => setRegisterData({ ...registerData, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full px-2.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.postalCode}
                    onChange={(e) => setRegisterData({ ...registerData, postalCode: e.target.value })}
                    placeholder="400001"
                    className="w-full px-2.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 hover:bg-[#3D473E] transition-all disabled:opacity-50 mt-1"
              >
                <span>{authLoading ? "Creating account..." : "Register & Continue to Checkout"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C332D]">
          Complete Your Order
        </h1>
        <p className="text-xs text-[#736C66] mt-1 flex items-center space-x-1.5">
          <Lock className="w-3.5 h-3.5 text-[#B8972E]" />
          <span>Logged in as <strong>{customer?.name} ({customer?.email})</strong> • Direct UPI Payment</span>
        </p>
      </div>

      {orderSuccessMessage && (
        <div className="p-5 rounded-2xl bg-[#E8EFE8] border border-[#C5D8C5] text-xs sm:text-sm text-[#2E7D32] flex items-center space-x-3 shadow-sm">
          <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-bold">{orderSuccessMessage}</p>
            <p className="text-xs text-[#2E7D32] mt-0.5">Redirecting to order confirmation page...</p>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
              <h2 className="font-serif text-base font-bold text-[#2C332D]">
                1. Contact Information
              </h2>
              <span className="text-[11px] text-[#2E7D32] bg-[#E8EFE8] px-2.5 py-0.5 rounded-full font-medium">
                Verified Account
              </span>
            </div>

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
                Email Address (for order receipts & tracking) *
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

          {/* Shipping Address (Auto-fetched & fully editable) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
              <h2 className="font-serif text-base font-bold text-[#2C332D]">
                2. Shipping & Delivery Address
              </h2>
              <span className="text-[11px] text-[#736C66]">
                Auto-fetched • Editable
              </span>
            </div>

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

        {/* ---------------- Right Column: Order Summary & UPI Payment ---------------- */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
            <h2 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
              Order Summary ({items.length} items)
            </h2>

            {/* Itemized Snapshot */}
            <div className="max-h-56 overflow-y-auto divide-y divide-[#F4EBE6] pr-1 space-y-3">
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
                        Custom: "{item.personalizationDetails.customName}"
                      </span>
                    )}
                    <p className="text-[11px] text-[#736C66] mt-0.5">
                      Qty: {item.quantity} × ₹{Number(item.price).toFixed(2)}
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
                  <span>Coupon <strong>{appliedCoupon.code}</strong> applied (-₹{Number(appliedCoupon.discountAmount).toFixed(2)})</span>
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

            {/* Price Breakdown (Strictly no rounding) */}
            <div className="space-y-2 text-xs text-[#736C66] border-t border-[#F4EBE6] pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#2C332D]">₹{subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-[#2E7D32]">
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
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
                <span className="text-[#B8972E] text-lg font-bold">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* ---------------- UPI & QR Code Payment Box ---------------- */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E0D5] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#B8972E]" />
                  <span>Step 1: Pay via UPI</span>
                </span>
                <span className="text-[11px] font-semibold text-[#2E7D32] bg-[#E8EFE8] px-2 py-0.5 rounded-full">
                  Instant UPI
                </span>
              </div>

              {/* Amount to Pay with Copy Button */}
              <div className="bg-white p-3 rounded-xl border border-[#E8E0D5] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#8C7A72] block font-medium">Amount to Enter in UPI App:</span>
                  <span className="text-lg font-bold text-[#B8972E]">₹{finalTotal.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={copyAmountToClipboard}
                  className="p-1.5 px-3 bg-[#FAF8F5] hover:bg-[#F4EBE6] text-[#2C332D] rounded-lg border border-[#E8E0D5] text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedAmount ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span className="text-[#2E7D32]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8C7A72]" />
                      <span>Copy Amount</span>
                    </>
                  )}
                </button>
              </div>

              {/* Single "Open UPI App" Button */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleOpenUpiApp}
                  className="w-full py-3 px-4 bg-[#2C332D] hover:bg-[#3D473E] text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-xs transition-all active:scale-[0.99] group cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-[#D4AF37]" />
                  <span>Open UPI App</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                </button>
                <p className="text-[10.5px] text-center text-[#8C7A72]">
                  Tap to view UPI details &amp; launch your UPI app (PhonePe / GPay / Paytm).
                </p>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#E8E0D5] w-full" />
                <span className="bg-[#FAF8F5] px-3 text-[10px] uppercase tracking-wider text-[#A0988F] absolute">
                  or scan QR / pay to details
                </span>
              </div>

              {/* QR Code Graphic Card */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-[#E8E0D5] shadow-xs">
                <div className="w-44 h-44 bg-white p-2 rounded-lg border border-[#F0E6DF] flex items-center justify-center">
                  <img
                    src={dynamicQrUrl}
                    alt="Scan UPI QR Code to Pay"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[11px] font-semibold text-[#2C332D] mt-2 text-center">
                  Pay to: <span className="text-[#B8972E]">{activePayeeName}</span>
                </p>
                <p className="text-[10px] text-[#8C7A72] text-center">
                  Scan and enter amount: <strong className="text-[#2C332D]">₹{finalTotal.toFixed(2)}</strong>
                </p>
              </div>

              {/* Direct UPI Options */}
              <div className="space-y-2 pt-1">
                {/* 1. Mobile Number / UPI Number */}
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-[#E8E0D5]">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9.5px] text-[#8C7A72] block">Pay to Mobile / UPI Number:</span>
                    <span className="font-mono text-xs font-bold text-[#2C332D]">{activePhone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyPhoneToClipboard}
                    className="p-1.5 px-2.5 bg-[#FAF8F5] hover:bg-[#F4EBE6] text-[#2C332D] rounded-lg border border-[#E8E0D5] text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    {copiedPhone ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                        <span className="text-[#2E7D32]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#8C7A72]" />
                        <span>Copy Mobile</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. UPI ID */}
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-[#E8E0D5]">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9.5px] text-[#8C7A72] block">Pay to UPI ID:</span>
                    <span className="font-mono text-xs font-bold text-[#2C332D] truncate block select-all">
                      {activeUpiId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="p-1.5 px-2.5 bg-[#FAF8F5] hover:bg-[#F4EBE6] text-[#2C332D] rounded-lg border border-[#E8E0D5] text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                        <span className="text-[#2E7D32]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#8C7A72]" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: UPI Reference ID Input */}
              <div className="pt-3 border-t border-[#E8E0D5]">
                <label className="text-xs font-bold text-[#2C332D] block mb-1">
                  Enter 12-Digit UPI Ref / UTR Number <span className="text-[#DF4C4C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 428901234567 or UPI Txn ID"
                  value={upiTransactionId}
                  onChange={(e) => setUpiTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-[#2C332D]"
                />
                <p className="text-[10px] text-[#8C7A72] mt-1">
                  After paying in your UPI app, paste the 12-digit UTR/Reference ID from the payment confirmation screen.
                </p>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#2C332D] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-[#3D473E] shadow-md transition-all disabled:opacity-60 group"
            >
              <span>{isSubmitting ? "Submitting Order..." : `Confirm Payment & Place Order (₹${finalTotal.toFixed(2)})`}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="text-center text-[11px] text-[#8C7A72] space-y-1">
              <p className="flex items-center justify-center space-x-1 text-[#2E7D32]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>1-Hour Free Cancellation • Handcrafted Quality Guarantee</span>
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* ---------------- UPI Payment Details & App Launcher Modal ---------------- */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] border border-[#E8E0D5] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 px-5 bg-white border-b border-[#E8E0D5] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#E8EFE8] flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-[#2E7D32]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C332D]">Pay via UPI App</h3>
                  <p className="text-[11px] text-[#8C7A72]">Copy details &amp; proceed to your UPI app</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                className="w-8 h-8 rounded-full hover:bg-[#F4EBE6] flex items-center justify-center text-[#8C7A72] hover:text-[#2C332D] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-3.5 overflow-y-auto text-[#2C332D]">
              {/* Amount to Pay */}
              <div className="bg-white p-3 rounded-xl border border-[#E8E0D5] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8C7A72] tracking-wider block">
                    Amount to Pay
                  </span>
                  <span className="text-lg font-bold text-[#B8972E]">₹{finalTotal.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={copyAmountToClipboard}
                  className="py-1.5 px-3 bg-[#FAF8F5] hover:bg-[#F4EBE6] text-[#2C332D] rounded-lg border border-[#E8E0D5] text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  {copiedAmount ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span className="text-[#2E7D32]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8C7A72]" />
                      <span>Copy Amount</span>
                    </>
                  )}
                </button>
              </div>

              {/* 1. Mobile Number / UPI Number */}
              <div className="bg-white p-3 rounded-xl border border-[#E8E0D5] flex items-center justify-between space-x-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-[#8C7A72] tracking-wider block">
                    Pay to Mobile Number (PhonePe / GPay)
                  </span>
                  <span className="font-mono text-sm font-bold text-[#2C332D] block">
                    {activePhone}
                  </span>
                  <span className="text-[10.5px] text-[#736C66] block truncate">
                    {activePayeeName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyPhoneToClipboard}
                  className="py-2 px-3 bg-[#2C332D] hover:bg-[#3D473E] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
                >
                  {copiedPhone ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#A3E635]" />
                      <span className="text-[#A3E635]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Copy Phone</span>
                    </>
                  )}
                </button>
              </div>

              {/* 2. UPI ID */}
              <div className="bg-white p-3 rounded-xl border border-[#E8E0D5] flex items-center justify-between space-x-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-[#8C7A72] tracking-wider block">
                    Or Pay to UPI ID
                  </span>
                  <span className="font-mono text-xs font-bold text-[#2C332D] block truncate select-all">
                    {activeUpiId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="py-1.5 px-3 bg-[#FAF8F5] hover:bg-[#F4EBE6] text-[#2C332D] rounded-lg border border-[#E8E0D5] text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span className="text-[#2E7D32]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8C7A72]" />
                      <span>Copy UPI ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Guidance Box for Home Screen Transfer */}
              <div className="bg-[#EBF3EB] border border-[#CDE1CD] rounded-xl p-3 text-[11px] text-[#204E24] leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1 text-[#173F1B]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>How to pay without any limit or error:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[10.5px] text-[#2C5731] pl-1 pt-0.5">
                  <li>
                    Tap <strong>Copy Phone ({activePhone})</strong> above.
                  </li>
                  <li>
                    Tap <strong>Open PhonePe App</strong> below to open PhonePe home screen.
                  </li>
                  <li>
                    On PhonePe home, tap <strong>&ldquo;To Mobile Number&rdquo;</strong>, paste <strong>{activePhone}</strong>, and send <strong>₹{finalTotal.toFixed(2)}</strong>.
                  </li>
                  <li>
                    Return here and enter the 12-digit UTR number below to confirm order.
                  </li>
                </ol>
              </div>
            </div>

            {/* Footer / App Home Launchers */}
            <div className="p-4 bg-white border-t border-[#E8E0D5] space-y-2.5">
              <a
                href={phonepeAppUrl}
                className="w-full py-3.5 px-4 bg-[#5f259f] hover:bg-[#4d1e82] text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-white" />
                <span>Open PhonePe App (Home Screen)</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={gpayAppUrl}
                  className="py-2.5 px-3 bg-white hover:bg-[#F4EBE6] text-[#2C332D] border border-[#E8E0D5] rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-[0.99] cursor-pointer"
                >
                  <span>Open Google Pay</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>

                <a
                  href={paytmAppUrl}
                  className="py-2.5 px-3 bg-white hover:bg-[#F4EBE6] text-[#002970] border border-[#E8E0D5] rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-[0.99] cursor-pointer"
                >
                  <span>Open Paytm</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                className="w-full py-1 text-xs text-[#8C7A72] hover:text-[#2C332D] text-center font-medium transition cursor-pointer"
              >
                Already Paid? Enter 12-Digit UTR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
