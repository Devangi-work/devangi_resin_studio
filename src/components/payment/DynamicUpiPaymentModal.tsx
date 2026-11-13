"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  QrCode,
  Camera,
  UploadCloud,
  CheckCircle2,
  Image as ImageIcon,
  MessageCircle,
  Package,
  ExternalLink,
  MapPin,
  Loader2,
} from "lucide-react";
import { buildUpiPaymentUri, generateUpiQrCodeDataUrl, generatePaymentReference } from "@/lib/upi";
import { formatCombinedAddress } from "@/lib/whatsapp";

export interface ShippingCustomerDetails {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface DynamicUpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payableAmount: number;
  subtotal: number;
  shippingCharge: number;
  discountAmount?: number;
  couponCode?: string | null;
  upiId?: string;
  accountHolderName?: string;
  storeName?: string;
  itemsSummary?: Array<{
    name: string;
    quantity: number;
    price: number;
    variantName?: string | null;
  }>;
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null;
  onPaidSubmit: (
    paymentReference: string,
    screenshotUrl?: string | null,
    shippingDetails?: ShippingCustomerDetails | null
  ) => Promise<{ orderNumber?: string | null; whatsappUrl?: string } | void>;
  onWillOrderLater: () => void;
  onCustomerUpdate?: (updated: ShippingCustomerDetails) => void;
}

const PAYMENT_SESSION_DURATION_SECONDS = 300; // 5 minutes

export default function DynamicUpiPaymentModal({
  isOpen,
  onClose,
  payableAmount,
  subtotal,
  shippingCharge,
  discountAmount = 0,
  couponCode,
  upiId,
  accountHolderName,
  storeName = "Devangi Resin Studio",
  itemsSummary = [],
  customer,
  onPaidSubmit,
  onWillOrderLater,
  onCustomerUpdate,
}: DynamicUpiPaymentModalProps) {
  const [timeLeft, setTimeLeft] = useState<number>(PAYMENT_SESSION_DURATION_SECONDS);
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isQrLoading, setIsQrLoading] = useState<boolean>(true);
  const [selectedOption, setSelectedOption] = useState<"paid" | "later" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [copiedOrderNum, setCopiedOrderNum] = useState<boolean>(false);

  // Cancel Confirmation Popup State
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);

  // Success Popup State (after Paid submission + screenshot)
  const [successData, setSuccessData] = useState<{
    orderNumber?: string | null;
    whatsappUrl?: string;
    paymentReference: string;
    amountPaid: number;
  } | null>(null);

  // Shipping details state initialized from customer prop
  const [shippingDetails, setShippingDetails] = useState<ShippingCustomerDetails>({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    addressLine1: customer?.addressLine1 || "",
    addressLine2: customer?.addressLine2 || "",
    city: customer?.city || "",
    state: customer?.state || "",
    postalCode: customer?.postalCode || "",
    country: customer?.country || "India",
  });

  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [addressForm, setAddressForm] = useState<{
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
  }>({
    name: customer?.name || "",
    phone: customer?.phone || "",
    addressLine1: customer?.addressLine1 || "",
    addressLine2: customer?.addressLine2 || "",
    city: customer?.city || "",
    state: customer?.state || "",
    postalCode: customer?.postalCode || "",
  });
  const [addressFormError, setAddressFormError] = useState<string>("");
  const [isSavingAddress, setIsSavingAddress] = useState<boolean>(false);

  // Sync with incoming customer prop when provided
  useEffect(() => {
    if (customer) {
      setShippingDetails((prev) => ({
        name: prev.name || customer.name || "",
        phone: prev.phone || customer.phone || "",
        email: customer.email || prev.email || "",
        addressLine1: prev.addressLine1 || customer.addressLine1 || "",
        addressLine2: prev.addressLine2 || customer.addressLine2 || "",
        city: prev.city || customer.city || "",
        state: prev.state || customer.state || "",
        postalCode: prev.postalCode || customer.postalCode || "",
        country: customer.country || prev.country || "India",
      }));
    }
  }, [customer]);

  const hasAddress = Boolean(
    shippingDetails.addressLine1?.trim() && shippingDetails.city?.trim()
  );

  // Screenshot upload states
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState<boolean>(false);
  const [screenshotError, setScreenshotError] = useState<string>("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  const activeUpiId = (upiId || "").trim();
  const activePayeeName = (accountHolderName || "").trim();
  const isExpired = timeLeft <= 0;

  // Initialize or regenerate a new payment session
  const initializeSession = async () => {
    // If order has already succeeded, do not overwrite or reset success screen
    if (successData) return;

    const newRef = generatePaymentReference();
    setPaymentReference(newRef);
    setTimeLeft(PAYMENT_SESSION_DURATION_SECONDS);
    setSelectedOption(null);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setScreenshotUrl(null);
    setScreenshotError("");
    setShowCancelConfirm(false);
    setSuccessData(null);
    setIsQrLoading(true);

    try {
      const upiUri = buildUpiPaymentUri({
        upiId: activeUpiId,
        accountHolderName: activePayeeName,
        amount: payableAmount,
        orderReference: newRef,
        transactionId: newRef,
      });
      const dataUrl = await generateUpiQrCodeDataUrl(upiUri);
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error("Failed to generate dynamic QR code:", err);
    } finally {
      setIsQrLoading(false);
    }
  };

  // Reset and start countdown timer on modal open (transition from false to true only)
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      hasInitializedRef.current = false;
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initializeSession();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Countdown timer interval (60s -> 0s)
  useEffect(() => {
    if (!isOpen) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, paymentReference]);

  if (!isOpen) return null;

  // Format seconds into MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const copyUpiToClipboard = () => {
    if (!activeUpiId) return;
    navigator.clipboard.writeText(activeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const copyAmountToClipboard = () => {
    navigator.clipboard.writeText(payableAmount.toFixed(2));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // Handle Payment Screenshot Upload
  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotError("");
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    if (!file.type.startsWith("image/") && !isHeic) {
      setScreenshotError("Please select a valid image file (JPEG, PNG, WebP, HEIC).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setScreenshotError("File size exceeds 10MB limit. Please upload a smaller image.");
      return;
    }

    setScreenshotFile(file);
    const localPreview = URL.createObjectURL(file);
    setScreenshotPreview(localPreview);
    setIsUploadingScreenshot(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/payment-receipt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        setScreenshotError(data.error || "Failed to upload screenshot. Please retry.");
        setIsUploadingScreenshot(false);
        return;
      }

      setScreenshotUrl(data.url);
    } catch (err: any) {
      console.error("Screenshot upload failed:", err);
      setScreenshotError("Failed to upload screenshot. Please try again.");
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setScreenshotUrl(null);
    setScreenshotError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Address removal and edit handlers
  const handleRemoveAddress = () => {
    setAddressForm({
      name: shippingDetails.name,
      phone: shippingDetails.phone,
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
    });
    setAddressFormError("");
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async () => {
    setAddressFormError("");
    const cleanName = addressForm.name.trim();
    const cleanPhone = addressForm.phone.replace(/[^0-9]/g, "");
    const cleanAddr1 = addressForm.addressLine1.trim();
    const cleanAddr2 = addressForm.addressLine2.trim();
    const cleanCity = addressForm.city.trim();
    const cleanState = addressForm.state.trim();
    const cleanPin = addressForm.postalCode.trim();

    if (!cleanName || cleanName.length < 2) {
      setAddressFormError("Please enter a valid receiver name (at least 2 letters).");
      return;
    }
    if (cleanPhone.length < 10) {
      setAddressFormError("Please enter a valid 10-digit contact phone number.");
      return;
    }
    if (!cleanAddr1 || cleanAddr1.length < 3) {
      setAddressFormError("Please enter flat, house no, building or street address.");
      return;
    }
    if (!cleanCity || cleanCity.length < 2) {
      setAddressFormError("Please enter a city.");
      return;
    }
    if (!cleanState || cleanState.length < 2) {
      setAddressFormError("Please enter a state.");
      return;
    }
    if (!/^\d{6}$/.test(cleanPin)) {
      setAddressFormError("Please enter a valid 6-digit PIN code.");
      return;
    }

    setIsSavingAddress(true);
    const updated: ShippingCustomerDetails = {
      name: cleanName,
      phone: addressForm.phone.trim(),
      email: shippingDetails.email,
      addressLine1: cleanAddr1,
      addressLine2: cleanAddr2,
      city: cleanCity,
      state: cleanState,
      postalCode: cleanPin,
      country: shippingDetails.country || "India",
    };

    try {
      await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phone: addressForm.phone.trim(),
          addressLine1: cleanAddr1,
          addressLine2: cleanAddr2 || undefined,
          city: cleanCity,
          state: cleanState,
          postalCode: cleanPin,
        }),
      });
    } catch (e) {
      console.warn("Could not save profile remotely:", e);
    } finally {
      setIsSavingAddress(false);
    }

    setShippingDetails(updated);
    setIsEditingAddress(false);
    onCustomerUpdate?.(updated);
  };

  // Handle request to close modal (prompt confirmation if payment in progress)
  const handleRequestClose = () => {
    if (successData) {
      onClose();
      return;
    }
    setShowCancelConfirm(true);
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showCancelConfirm) {
          setShowCancelConfirm(false);
        } else if (successData) {
          onClose();
        } else {
          setShowCancelConfirm(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showCancelConfirm, successData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired || isSubmitting || !selectedOption) return;

    // If Paid is selected, require payment screenshot proof & valid address
    if (selectedOption === "paid") {
      if (isUploadingScreenshot) {
        setScreenshotError("Please wait for your screenshot to finish uploading.");
        return;
      }
      if (!screenshotUrl) {
        setScreenshotError("Please upload your payment screenshot before proceeding.");
        return;
      }
      if (!shippingDetails.addressLine1?.trim() || !shippingDetails.city?.trim()) {
        setScreenshotError("Please provide and save your delivery address and contact number before proceeding.");
        setIsEditingAddress(true);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (selectedOption === "paid") {
        const result = await onPaidSubmit(paymentReference, screenshotUrl, shippingDetails);
        if (result && typeof result === "object" && result.whatsappUrl) {
          if (timerRef.current) clearInterval(timerRef.current);
          setSuccessData({
            orderNumber: result.orderNumber || null,
            whatsappUrl: result.whatsappUrl,
            paymentReference,
            amountPaid: payableAmount,
          });
        }
      } else if (selectedOption === "later") {
        onWillOrderLater();
      }
    } catch (err) {
      console.error("Error submitting payment option:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={handleRequestClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#E8E0D5] rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cancel Confirmation Popup */}
        {showCancelConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              className="w-full max-w-sm bg-[#FAF8F5] border border-[#E8E0D5] rounded-2xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-300">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="font-serif text-base sm:text-lg font-bold text-[#2C332D]">
                  Are you sure you want to cancel?
                </h4>
                <p className="text-xs text-[#736C66] leading-relaxed">
                  Your payment session is still active ({formatTimer(timeLeft)} remaining). If you cancel now, this payment session will be closed.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#2C332D] text-[#FFDF78] hover:bg-[#3D473E] text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  No, Keep Paying
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelConfirm(false);
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold transition cursor-pointer"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header with clean branding & countdown or success mode */}
        <div className="bg-[#2C332D] text-white px-5 py-4 flex items-center justify-between border-b border-[#3D473E]">
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                successData
                  ? "bg-[#25D366]/20 border-[#25D366]/40 text-[#25D366]"
                  : "bg-white/10 border-white/20 text-[#FFDF78]"
              }`}
            >
              {successData ? <CheckCircle2 className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-serif text-sm sm:text-base font-bold tracking-wide">
                {successData ? "Order Received" : storeName}
              </h3>
              <p className="text-[10.5px] text-[#E8E0D5]/70">
                {successData ? "Devangi Resin Studio" : "Direct UPI QR Payment"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Header Countdown Badge with Animated Theme Ring (Only when payment active) */}
            {!successData && (
              <div
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider transition-colors ${
                  isExpired
                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                    : timeLeft <= 30
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                    : "bg-white/10 text-[#FFDF78] border border-[#FFDF78]/30"
                }`}
              >
                <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="2.5"
                    />
                    {!isExpired && (
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        fill="none"
                        stroke="#FFDF78"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="56.5"
                        className="animate-circle-loop-small"
                      />
                    )}
                  </svg>
                </div>
                <span className="text-xs font-black">{formatTimer(timeLeft)}</span>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={isSubmitting}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition disabled:opacity-50 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Success Screen OR Payment Flow */}
        {successData ? (
          <div className="p-6 sm:p-8 space-y-6 text-center max-h-[85vh] overflow-y-auto">
            {/* Celebration Icon */}
            <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#25D366]/20 animate-ping opacity-75" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#166534] to-[#22c55e] text-white flex items-center justify-center shadow-lg border-2 border-[#D4AF37]">
                <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
              </div>
            </div>

            {/* Headline requested by user */}
            <div className="space-y-1.5">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C332D]">
                Thank you for Shopping with us!
              </h2>
              <p className="text-xs sm:text-sm text-[#736C66] max-w-md mx-auto leading-relaxed">
                Your order and payment screenshot have been submitted successfully. Our studio artisan team will verify your transaction and begin handcrafting your resin piece.
              </p>
            </div>

            {/* Order & Payment Summary Card */}
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-4 text-left shadow-xs space-y-2.5">
              {successData.orderNumber && (
                <div className="flex items-center justify-between pb-2 border-b border-[#F4EBE6]">
                  <span className="text-xs text-[#8C827A] font-medium">Order Number:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-mono font-bold text-[#2C332D]">
                      #{successData.orderNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(successData.orderNumber || "");
                        setCopiedOrderNum(true);
                        setTimeout(() => setCopiedOrderNum(false), 2000);
                      }}
                      className="p-1 hover:bg-[#F2ECE4] rounded text-[#8C827A] hover:text-[#2C332D] transition cursor-pointer"
                      title="Copy Order Number"
                    >
                      {copiedOrderNum ? (
                        <Check className="w-3.5 h-3.5 text-[#166534]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pb-2 border-b border-[#F4EBE6]">
                <span className="text-xs text-[#8C827A] font-medium">Payment Reference:</span>
                <span className="text-xs font-mono font-semibold text-[#800020]">
                  {successData.paymentReference}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F4EBE6]">
                <span className="text-xs text-[#8C827A] font-medium">Amount Paid:</span>
                <span className="text-sm font-bold text-[#166534]">
                  ₹{successData.amountPaid.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F4EBE6]">
                <span className="text-xs text-[#8C827A] font-medium">Payment Status:</span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Paid</span>
                </span>
              </div>

              {/* Confirmed Delivery Destination */}
              {formatCombinedAddress(shippingDetails) && (
                <div className="pt-1 text-left space-y-1">
                  <span className="text-[11px] text-[#8C827A] font-bold uppercase tracking-wider block">
                    Confirmed Delivery Destination:
                  </span>
                  <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E0D5] text-xs text-[#2C332D] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#2C332D]">Receiver: {shippingDetails.name || "Customer"}</span>
                      {shippingDetails.phone && (
                        <span className="text-[#736C66] font-medium">📞 {shippingDetails.phone}</span>
                      )}
                    </div>
                    <p className="text-[#5C554E] leading-relaxed pt-0.5">{formatCombinedAddress(shippingDetails)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Tracking Section: "track your order here" */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#D4AF37]/40 p-4 text-center space-y-2.5">
              <div className="flex items-center justify-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-[#B8972E]">
                <Package className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Track Your Order Here</span>
              </div>
              <p className="text-xs text-[#736C66]">
                Follow crafting progress, curing stages, and live courier tracking anytime:
              </p>
              <a
                href={successData.orderNumber ? `/orders/${encodeURIComponent(successData.orderNumber)}` : "/track-order"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center space-x-2 py-2.5 px-5 rounded-xl bg-white border border-[#D4AF37] hover:bg-[#FAF6F0] text-[#2C332D] text-xs font-bold transition shadow-xs cursor-pointer group w-full sm:w-auto"
              >
                <Package className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span>View Live Order Tracking</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#8C827A]" />
              </a>
            </div>

            {/* WhatsApp Notification Section: "notify us in whatsapp and show button notify" */}
            <div className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] rounded-2xl border border-[#86EFAC] p-5 text-center space-y-3 shadow-xs">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#166534] text-white text-[11px] font-bold">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Notify Us on WhatsApp</span>
              </div>

              {/* Exact instructional text requested by user */}
              <p className="text-xs sm:text-sm text-[#14532D] leading-relaxed font-semibold">
                Message will be auto filled, you can read it and just click on send.
              </p>

              {/* Button Notify requested by user */}
              {successData.whatsappUrl && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = successData.whatsappUrl!;
                  }}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Notify on WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Secondary Action: Continue Browsing */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-[#8C827A] hover:text-[#2C332D] underline underline-offset-4 transition cursor-pointer"
              >
                Continue Browsing Store
              </button>
            </div>
          </div>
        ) : (
          /* Scrollable Payment Body */
          <div className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Keyframe Styles for Circular Loading Theme Animation */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes circleThemeLoop {
              0% {
                stroke-dashoffset: 188.5;
              }
              80% {
                stroke-dashoffset: 0;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }

            @keyframes circleThemeLoopSmall {
              0% {
                stroke-dashoffset: 56.5;
              }
              80% {
                stroke-dashoffset: 0;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }

            .animate-circle-loop {
              animation: circleThemeLoop 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }

            .animate-circle-loop-small {
              animation: circleThemeLoopSmall 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
          `}} />

          {/* PROMINENT CIRCULAR TIMER HERO CARD */}
          {!isExpired ? (
            <div className="bg-gradient-to-r from-[#2C332D] via-[#384239] to-[#2C332D] text-white p-4 rounded-2xl border border-[#D4AF37]/40 shadow-md flex items-center space-x-4">
              {/* Circular Animation Loading Ring */}
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 76 76">
                  <defs>
                    <linearGradient id="goldThemeLoaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFDF78" />
                      <stop offset="50%" stopColor="#D4AF37" />
                      <stop offset="100%" stopColor="#B8972E" />
                    </linearGradient>
                  </defs>
                  {/* Background Track */}
                  <circle
                    cx="38"
                    cy="38"
                    r="30"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="4"
                  />
                  {/* Completing Circular Animated Stroke */}
                  <circle
                    cx="38"
                    cy="38"
                    r="30"
                    fill="none"
                    stroke="url(#goldThemeLoaderGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="188.5"
                    className="animate-circle-loop"
                  />
                </svg>
                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFDF78]" />
                </div>
              </div>

              {/* Clear Countdown Digits & Guidance */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFDF78] bg-white/10 px-2 py-0.5 rounded-full border border-[#FFDF78]/30">
                    Active Payment Session
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
                </div>

                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-[#FFDF78] drop-shadow-sm">
                    {formatTimer(timeLeft)}
                  </span>
                  <span className="text-xs text-[#E8E0D5]/80 font-semibold">
                    minutes left
                  </span>
                </div>

                <p className="text-[11px] text-[#E8E0D5]/70 mt-0.5">
                  Complete your transfer before this 5-minute window expires.
                </p>
              </div>
            </div>
          ) : (
            /* Timeout Alert Banner */
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs flex-1">
                <p className="font-bold">Payment Session Expired (00:00)</p>
                <p className="mt-0.5 text-red-700 leading-relaxed">
                  Your 5-minute payment session has expired. Please tap below to generate a fresh QR code and restart your 5-minute window.
                </p>
                <button
                  type="button"
                  onClick={initializeSession}
                  className="mt-2.5 inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Generate New Payment QR</span>
                </button>
              </div>
            </div>
          )}

          {/* SHIPPING & DELIVERY DETAILS SECTION */}
          {hasAddress && !isEditingAddress ? (
            /* Combined Deduplicated Address Card */
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E0D5] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-2.5">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#800020]/10 flex items-center justify-center text-[#800020]">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2C332D]">
                    Shipping Details &amp; Receiver
                  </span>
                </div>

                {/* Cross Icon (X) button to remove address and enter a new one */}
                <button
                  type="button"
                  onClick={handleRemoveAddress}
                  title="Remove address and enter a new one"
                  aria-label="Remove address"
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-500 hover:text-red-700 hover:bg-red-50 border border-neutral-200 hover:border-red-200 transition cursor-pointer group"
                >
                  <X className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-600" />
                  <span className="text-[11px]">Remove / Change</span>
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-[#8C827A] font-medium">Receiver Name: </span>
                    <strong className="text-[#2C332D] font-bold">{shippingDetails.name || "Customer"}</strong>
                  </div>
                  <div>
                    <span className="text-[#8C827A] font-medium">Contact No: </span>
                    <strong className="text-[#2C332D] font-bold">{shippingDetails.phone || "Not Provided"}</strong>
                  </div>
                </div>

                <div className="pt-0.5">
                  <span className="text-[#8C827A] font-medium block text-[11px] mb-1">Combined Delivery Address:</span>
                  <p className="text-[#3E3833] font-medium leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#F0EAE1]">
                    {formatCombinedAddress(shippingDetails)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Add / Edit Address Form */
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-2.5">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#800020]/10 flex items-center justify-center text-[#800020]">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#800020]">
                    {hasAddress ? "Change Delivery Address" : "Add Delivery Address & Contact"}
                  </span>
                </div>

                {hasAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAddress(false);
                      setAddressFormError("");
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-800 underline transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#2C332D] mb-1">
                      Receiver Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.name}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Priya Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] text-xs focus:ring-1 focus:ring-[#800020] focus:border-[#800020] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2C332D] mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="10-digit mobile number"
                      maxLength={15}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] text-xs focus:ring-1 focus:ring-[#800020] focus:border-[#800020] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2C332D] mb-1">
                    Flat, House No., Building, Street <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
                    placeholder="e.g., Flat 402, Lotus Towers, 5th Main"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] text-xs focus:ring-1 focus:ring-[#800020] focus:border-[#800020] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2C332D] mb-1">
                    Area / Landmark / Locality <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine2}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
                    placeholder="e.g., Near Metro Station, Indiranagar"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] text-xs focus:ring-1 focus:ring-[#800020] focus:border-[#800020] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#2C332D] mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g., Mumbai"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] text-xs focus:ring-1 focus:ring-[#800020] focus:border-[#800020] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2C332D] mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                      placeholder="e.g., Maharashtra"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] text-xs focus:ring-1 focus:ring-[#800020] focus:border-[#800020] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2C332D] mb-1">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                      placeholder="6 digits"
                      maxLength={6}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] text-xs focus:ring-1 focus:ring-[#800020] focus:border-[#800020] outline-none"
                    />
                  </div>
                </div>

                {addressFormError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{addressFormError}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    disabled={isSavingAddress}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#800020] hover:bg-[#600018] text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingAddress ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Address...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save &amp; Deliver to this Address</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Scan & Pay QR Code */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E0D5] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#2C332D] text-white flex items-center justify-center text-[10px] font-mono">1</span>
                <span>Scan &amp; Complete Payment</span>
              </span>
              <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8EFE8] px-2 py-0.5 rounded-full border border-[#C5D8C5]">
                Amount Pre-filled
              </span>
            </div>

            <p className="text-[11px] text-[#736C66] leading-relaxed">
              Scan the QR code using any UPI app. The payable amount of <strong className="text-[#2C332D]">₹{payableAmount.toFixed(2)}</strong> is already pre-filled.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {/* Dynamic QR Code Frame */}
              <div className="relative w-44 h-44 bg-white rounded-xl p-2 border border-[#E8E0D5] flex items-center justify-center shadow-inner shrink-0">
                {isQrLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-7 h-7 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10.5px] text-[#736C66]">Generating QR...</span>
                  </div>
                ) : isExpired ? (
                  <div className="flex flex-col items-center justify-center p-2 text-center text-red-500 space-y-1">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                    <span className="text-xs font-semibold">QR Expired</span>
                    <span className="text-[10px] text-[#736C66]">Click restart above</span>
                  </div>
                ) : qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Dynamic UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-red-500">Failed to render QR</span>
                )}
              </div>

              {/* Payee Info & Exact Amount */}
              <div className="flex-1 min-w-0 space-y-2 w-full">
                {/* Payee Name */}
                <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E0D5]">
                  <span className="text-[10px] text-[#8C7A72] uppercase font-bold tracking-wider block">
                    Verified Payee:
                  </span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span className="text-xs font-bold text-[#2C332D] truncate">
                      {activePayeeName || "Devangi Banshilal Barai"}
                    </span>
                  </div>
                </div>

                {/* UPI ID with Copy */}
                {activeUpiId && (
                  <div className="flex items-center justify-between bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E0D5]">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-[10px] text-[#8C7A72] uppercase font-bold tracking-wider block">
                        UPI ID:
                      </span>
                      <span className="font-mono text-xs font-bold text-[#2C332D] truncate block select-all">
                        {activeUpiId}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={copyUpiToClipboard}
                      className="py-1 px-2.5 bg-white hover:bg-[#F4EBE6] text-[#2C332D] rounded-lg border border-[#E8E0D5] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3 h-3 text-[#2E7D32]" />
                          <span className="text-[#2E7D32]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#736C66]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Amount with Copy */}
                <div className="flex items-center justify-between bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E0D5]">
                  <div>
                    <span className="text-[10px] text-[#8C7A72] uppercase font-bold tracking-wider block">
                      Payable Amount:
                    </span>
                    <span className="text-lg font-bold text-[#B8972E]">
                      ₹{payableAmount.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyAmountToClipboard}
                    className="py-1 px-2.5 bg-white hover:bg-[#F4EBE6] text-[#2C332D] rounded-lg border border-[#E8E0D5] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedAmount ? (
                      <>
                        <Check className="w-3 h-3 text-[#2E7D32]" />
                        <span className="text-[#2E7D32]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#736C66]" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Supported UPI Apps Row */}
            <div className="pt-2 border-t border-[#F0EAE1] flex flex-wrap items-center justify-center gap-2 text-[10px] text-[#736C66]">
              <span className="font-semibold text-[#2C332D]">Supported UPI Apps:</span>
              <span className="bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E8E0D5] font-medium">Google Pay</span>
              <span className="bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E8E0D5] font-medium">PhonePe</span>
              <span className="bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E8E0D5] font-medium">Paytm</span>
              <span className="bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E8E0D5] font-medium">BHIM</span>
            </div>
          </div>

          {/* STEP 2: Choose Order Status (HEAVILY HIGHLIGHTED) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2C332D] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#2C332D] text-white flex items-center justify-center text-[10px] font-mono">2</span>
                <span>Select Next Step &amp; Confirm:</span>
              </span>
              <span className="text-[10.5px] text-[#8C7A72] italic">Select one option</span>
            </div>

            {/* TWO HIGH-CONTRAST RADIO CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Paid – Proceed to Order */}
              <label
                className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedOption === "paid"
                    ? "bg-[#F0FDF4] border-[#16A34A] shadow-md ring-2 ring-[#16A34A]/20 scale-[1.01]"
                    : "bg-white border-[#E8E0D5] hover:border-[#16A34A]/60 hover:bg-[#F9FDF9]"
                } ${isExpired ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]">
                      Option 1: Payment Done
                    </span>
                    <input
                      type="radio"
                      name="paymentOption"
                      value="paid"
                      disabled={isExpired || isSubmitting}
                      checked={selectedOption === "paid"}
                      onChange={() => setSelectedOption("paid")}
                      className="w-4 h-4 text-[#16A34A] focus:ring-[#16A34A] accent-[#16A34A]"
                    />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#166534]">
                    Paid – Proceed to Order
                  </h4>
                  <p className="text-[11px] text-[#4B5563] mt-1 leading-relaxed">
                    I have completed payment on UPI. Next, upload payment screenshot and send to WhatsApp.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#DCFCE7] flex items-center text-[11px] font-semibold text-[#16A34A]">
                  <span>Next: Upload Receipt Proof</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </label>

              {/* Option 2: Will Order Later */}
              <label
                className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedOption === "later"
                    ? "bg-[#FFFBEB] border-[#D97706] shadow-md ring-2 ring-[#D97706]/20 scale-[1.01]"
                    : "bg-white border-[#E8E0D5] hover:border-[#D97706]/60 hover:bg-[#FFFDF7]"
                } ${isExpired ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      Option 2: Pay Later
                    </span>
                    <input
                      type="radio"
                      name="paymentOption"
                      value="later"
                      disabled={isExpired || isSubmitting}
                      checked={selectedOption === "later"}
                      onChange={() => setSelectedOption("later")}
                      className="w-4 h-4 text-[#D97706] focus:ring-[#D97706] accent-[#D97706]"
                    />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#92400E]">
                    Will Order Later
                  </h4>
                  <p className="text-[11px] text-[#4B5563] mt-1 leading-relaxed">
                    Save these items in my cart. No payment made now; continue shopping and place order later.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#FEF3C7] flex items-center text-[11px] font-semibold text-[#D97706]">
                  <span>Save to Cart &amp; Continue</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </label>
            </div>

            {/* STEP 3: Payment Screenshot Upload (EXPANDS WHEN PAID IS SELECTED) */}
            {selectedOption === "paid" && (
              <div className="p-4 bg-[#F0FDF4] border-2 border-dashed border-[#16A34A]/50 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-[#16A34A]" />
                    <span className="text-xs font-bold text-[#166534]">
                      Upload Payment Screenshot Proof *
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#166534] bg-white px-2 py-0.5 rounded-full border border-[#86EFAC]">
                    Required
                  </span>
                </div>

                <p className="text-[11px] text-[#4B5563] leading-relaxed">
                  Please attach a screenshot of your payment success screen (from GPay, PhonePe, or Paytm) showing the 12-digit UTR/Ref ID for immediate verification.
                </p>

                {screenshotPreview ? (
                  <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-[#86EFAC]">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#FAF8F5] border border-[#E8E0D5] shrink-0">
                      <img
                        src={screenshotPreview}
                        alt="Payment Screenshot Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      {isUploadingScreenshot ? (
                        <div className="flex items-center space-x-1.5 text-amber-700">
                          <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                          <span className="font-semibold text-[11px]">Uploading proof to server...</span>
                        </div>
                      ) : screenshotUrl ? (
                        <div className="flex items-center space-x-1 text-[#166534] font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Screenshot Uploaded Successfully!</span>
                        </div>
                      ) : null}

                      <div className="mt-1 flex items-center space-x-3 text-[11px]">
                        <label className="text-[#166534] hover:underline font-semibold cursor-pointer">
                          <span>Change Screenshot</span>
                          <input
                            type="file"
                            accept="image/*,.heic,.heif,image/heic,image/heif"
                            className="hidden"
                            disabled={isUploadingScreenshot}
                            onChange={handleScreenshotChange}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveScreenshot}
                          className="text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      className={`flex flex-col items-center justify-center p-4 bg-white hover:bg-[#F9FDF9] rounded-xl border-2 border-dashed border-[#86EFAC] cursor-pointer transition text-center ${
                        isUploadingScreenshot ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <UploadCloud className="w-6 h-6 text-[#16A34A] mb-1" />
                      <span className="text-xs font-bold text-[#166534]">
                        Tap to Select or Take Photo of Screenshot
                      </span>
                      <span className="text-[10px] text-[#736C66] mt-0.5">
                        JPEG, PNG, WebP, or HEIC (Max 10MB)
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.heic,.heif,image/heic,image/heif"
                        className="hidden"
                        onChange={handleScreenshotChange}
                      />
                    </label>
                  </div>
                )}

                {screenshotError && (
                  <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{screenshotError}</span>
                  </p>
                )}
              </div>
            )}

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!selectedOption || isExpired || isSubmitting || isUploadingScreenshot}
                className={`w-full py-3.5 px-4 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                  selectedOption === "paid"
                    ? "bg-[#166534] hover:bg-[#14532D]"
                    : selectedOption === "later"
                    ? "bg-[#92400E] hover:bg-[#78350F]"
                    : "bg-[#2C332D] hover:bg-[#3D473E]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing &amp; Creating Order...</span>
                  </>
                ) : selectedOption === "paid" ? (
                  <>
                    <span>Confirm Payment &amp; Proceed to WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : selectedOption === "later" ? (
                  <>
                    <span>Save to Cart &amp; Order Later</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Select an Option to Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Reassurance Safety Link */}
            <div className="pt-1 pb-1 flex items-center justify-center space-x-1.5 text-[11px] text-[#7A5E68]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
              <span>Direct Verified Payee • Pre-filled Amount • </span>
              <a
                href="/policies/payment"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#3A1823] font-semibold text-[#800020] transition-colors"
              >
                Payment Safety Policy
              </a>
            </div>
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
