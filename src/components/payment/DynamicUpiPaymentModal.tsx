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
} from "lucide-react";
import { buildUpiPaymentUri, generateUpiQrCodeDataUrl, generatePaymentReference } from "@/lib/upi";

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
    name?: string;
    phone?: string;
    email?: string;
  } | null;
  onPaidSubmit: (paymentReference: string, screenshotUrl?: string | null) => Promise<void>;
  onWillOrderLater: () => void;
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
}: DynamicUpiPaymentModalProps) {
  const [timeLeft, setTimeLeft] = useState<number>(PAYMENT_SESSION_DURATION_SECONDS);
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isQrLoading, setIsQrLoading] = useState<boolean>(true);
  const [selectedOption, setSelectedOption] = useState<"paid" | "later" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);

  // Screenshot upload states
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState<boolean>(false);
  const [screenshotError, setScreenshotError] = useState<string>("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeUpiId = (upiId || "").trim();
  const activePayeeName = (accountHolderName || "").trim();
  const isExpired = timeLeft <= 0;

  // Initialize or regenerate a new payment session
  const initializeSession = async () => {
    const newRef = generatePaymentReference();
    setPaymentReference(newRef);
    setTimeLeft(PAYMENT_SESSION_DURATION_SECONDS);
    setSelectedOption(null);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setScreenshotUrl(null);
    setScreenshotError("");
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

  // Reset and start countdown timer on modal open
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    initializeSession();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, payableAmount, activeUpiId, activePayeeName]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired || isSubmitting || !selectedOption) return;

    // If Paid is selected, require payment screenshot proof
    if (selectedOption === "paid") {
      if (isUploadingScreenshot) {
        setScreenshotError("Please wait for your screenshot to finish uploading.");
        return;
      }
      if (!screenshotUrl) {
        setScreenshotError("Please upload your payment screenshot before proceeding.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (selectedOption === "paid") {
        await onPaidSubmit(paymentReference, screenshotUrl);
      } else if (selectedOption === "later") {
        onWillOrderLater();
      }
    } catch (err) {
      console.error("Error submitting payment option:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#E8E0D5] rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with clean branding & countdown */}
        <div className="bg-[#2C332D] text-white px-5 py-4 flex items-center justify-between border-b border-[#3D473E]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFDF78]">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm sm:text-base font-bold tracking-wide">
                {storeName}
              </h3>
              <p className="text-[10.5px] text-[#E8E0D5]/70">
                Direct UPI QR Payment
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Header Countdown Badge with Animated Theme Ring */}
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

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition disabled:opacity-50 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
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
          </form>
        </div>
      </div>
    </div>
  );
}
