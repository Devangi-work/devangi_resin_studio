"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  Package,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react";

function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
    "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatTens = (n: number) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
  };

  const n = Math.floor(num);
  let str = "";

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;

  if (crore > 0) str += formatTens(crore) + "Crore ";
  if (lakh > 0) str += formatTens(lakh) + "Lakh ";
  if (thousand > 0) str += formatTens(thousand) + "Thousand ";
  if (hundred > 0) str += formatTens(hundred) + "Hundred ";
  if (rest > 0) {
    if (str !== "") str += "and ";
    str += formatTens(rest);
  }
  return str.trim();
}

function formatDate(dateVal: any): string {
  if (!dateVal) return new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateVal);
  }
}

export default function OrderReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [orderRes, settingsRes] = await Promise.all([
          fetch(`/api/admin/orders/${id}`),
          fetch("/api/admin/settings"),
        ]);

        if (!orderRes.ok) {
          throw new Error("Order not found or access denied.");
        }

        const orderData = await orderRes.json();
        const settingsData = await settingsRes.json();

        setOrder(orderData);
        setSettings(settingsData);
      } catch (err: any) {
        setError(err.message || "Failed to load order receipt.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-10 h-10 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-serif text-[#2C332D]">Generating Official Receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-red-800">Unable to Generate Receipt</h2>
          <p className="text-xs text-red-600">{error || "Order details could not be found."}</p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === "paid";
  const storeName = settings?.storeName || "Devangi Resin Studio";
  const storeTagline = settings?.storeTagline || "Handmade Resin Elegance, Preserved Forever";
  const logoUrl = settings?.logoUrl || "/images/logo/resin_logo.png";
  const signatureUrl = settings?.signatureUrl || "";
  const totalAmount = Number(order.totalAmount || 0);
  const subtotal = Number(order.subtotal || order.totalAmount || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const shippingCharge = Number(order.shippingCharge || 0);

  return (
    <div className="min-h-screen bg-[#F0ECE6] py-6 sm:py-10 px-3 sm:px-6 print:p-0 print:bg-white text-[#2C332D]">
      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 16mm 14mm 14mm 14mm;
          }
          body {
            background-color: #ffffff !important;
            color: #111111 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 4mm 0 0 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .print-badge {
            border: 1px solid #15803d !important;
            color: #15803d !important;
            background-color: #f0fdf4 !important;
          }
          /* Remove inner borders in PDF/Print */
          .inner-card,
          .table-container {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Action Toolbar Header (Hidden in Print) */}
      <div className="no-print max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-sm">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/orders"
            className="p-2 text-[#736C66] hover:text-[#2C332D] hover:bg-[#FAF8F5] rounded-xl transition"
            title="Back to Orders"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-lg font-bold text-[#2C332D] flex items-center space-x-2">
              <span>Payment Receipt</span>
              <span className="font-mono text-xs bg-[#FAF4EC] text-[#800020] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40">
                #{order.orderNumber}
              </span>
            </h1>
            <p className="text-xs text-[#736C66]">
              {isPaid
                ? "Payment verified. Ready to print or download as PDF."
                : "Note: Order payment status is not currently marked as 'Paid'."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#800020] hover:bg-[#68001a] text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Download PDF</span>
          </button>
        </div>
      </div>

      {/* Non-Paid Warning Notice (Hidden on Print) */}
      {!isPaid && (
        <div className="no-print max-w-4xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Payment Unconfirmed Notice</p>
            <p className="text-amber-700 mt-0.5">
              This order currently has payment status &lsquo;{order.paymentStatus}&rsquo;. Official receipts are typically generated after verifying receipt of funds.
            </p>
          </div>
        </div>
      )}

      {/* Main Printable Receipt Card with Watermark Logo */}
      <div className="print-card relative overflow-hidden max-w-4xl mx-auto bg-white rounded-3xl border border-[#E8E0D5] shadow-lg p-8 pt-10 sm:p-12 sm:pt-14 print:pt-8 space-y-8">
        
        {/* Watermark Logo Background (Enhanced Visibility) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
          <img
            src={logoUrl}
            alt=""
            aria-hidden="true"
            className="w-[360px] sm:w-[500px] h-[360px] sm:h-[500px] object-contain opacity-[0.09] print:opacity-[0.13] filter contrast-125"
          />
        </div>

        {/* Top Header: Logo, Store Info & Receipt Title (Clean Top Clearance) */}
        <div className="relative z-10 pt-2 sm:pt-4 print:pt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-[#800020]/20 pb-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 rounded-2xl bg-[#FAF8F5] p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              <img
                src={logoUrl}
                alt={storeName}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-serif text-2xl font-black text-[#800020] tracking-tight leading-tight">
                {storeName}
              </h2>
              <p className="text-xs text-[#736C66] italic font-serif">
                {storeTagline}
              </p>
              <div className="text-[11px] text-[#736C66] space-y-0.5 pt-1">
                <p className="flex items-center space-x-1.5">
                  <Mail className="w-3 h-3 text-[#B8972E]" />
                  <span>{settings?.contactEmail || "hello@devangiresinstudio.com"}</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <Phone className="w-3 h-3 text-[#B8972E]" />
                  <span>WhatsApp/Phone: {settings?.whatsappNumber || settings?.contactPhone || "+91 98765 43210"}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#800020] text-white">
              Official Payment Receipt
            </span>
            <h3 className="font-mono text-base font-bold text-[#2C332D]">
              REC-{order.orderNumber}
            </h3>
            <p className="text-xs text-[#736C66]">
              Date: <strong className="text-[#2C332D]">{formatDate(order.createdAt)}</strong>
            </p>
            <div className="pt-1">
              {isPaid ? (
                <span className="print-badge inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E8EFE8] text-[#2E7D32]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PAID IN FULL</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 uppercase">
                  <span>Status: {order.paymentStatus}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customer, Payment & Shipping Details Grid (No inner borders) */}
        <div className="relative z-10 inner-card grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FAF8F5]/80 p-5 rounded-2xl">
          {/* Bill To */}
          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#800020] block">
              Billed To (Customer)
            </span>
            <p className="font-bold text-sm text-[#2C332D]">
              {order.customerName}
            </p>
            <p className="text-[#736C66]">{order.customerEmail}</p>
            <p className="text-[#736C66]">Contact: {order.customerPhone}</p>
            <div className="pt-1 text-[11px] text-[#736C66]">
              <span className="font-semibold text-[#2C332D]">Payment Method: </span>
              <span className="uppercase">{order.paymentMethod || "UPI"}</span>
              {order.upiTransactionId && (
                <span className="block font-mono text-[10px] text-[#2E7D32] mt-0.5">
                  UTR/Ref: {order.upiTransactionId}
                </span>
              )}
            </div>
          </div>

          {/* Ship To */}
          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#800020] block">
              Delivery Destination
            </span>
            <p className="text-[#2C332D] leading-relaxed">
              {order.shippingAddressLine1}
              {order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ""}
              <br />
              {order.shippingCity}, {order.shippingState} - {order.shippingPostalCode}
            </p>
            <div className="pt-1 text-[11px] text-[#736C66] space-y-0.5">
              <p>
                <span className="font-semibold text-[#2C332D]">Shipping Mode: </span>
                <span>{order.courierName || "Standard Insured Domestic Courier"}</span>
              </p>
              {order.trackingNumber && (
                <p>
                  <span className="font-semibold text-[#2C332D]">Tracking ID: </span>
                  <span className="font-mono font-bold text-[#800020]">{order.trackingNumber}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Purchased Products Table (Clean dividers, no inner enclosing border) */}
        <div className="relative z-10 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C332D]">
            Order Particulars &amp; Bespoke Specifications
          </h4>

          <div className="table-container overflow-x-auto rounded-2xl bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5]/60 border-b border-[#E8E0D5] text-[#800020] font-serif font-bold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Item &amp; Customization Details</th>
                  <th className="py-3 px-4 w-20 text-center">Qty</th>
                  <th className="py-3 px-4 w-28 text-right">Unit Price</th>
                  <th className="py-3 px-4 w-28 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EBE6]">
                {order.items?.map((item: any, index: number) => (
                  <tr key={item.id || index} className="hover:bg-[#FAF8F5]/30">
                    <td className="py-3.5 px-4 text-center font-mono text-[#736C66]">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <p className="font-bold text-[#2C332D] text-xs">
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <p className="text-[11px] text-[#736C66]">
                          Variant: {item.variantName}
                        </p>
                      )}
                      {item.personalizationDetails?.customName && (
                        <p className="text-[11px] text-[#B8972E] font-medium">
                          Custom Name Embossed: &ldquo;{item.personalizationDetails.customName}&rdquo;
                        </p>
                      )}
                      {item.personalizationDetails?.initials && (
                        <p className="text-[11px] text-[#736C66]">
                          Initials: {item.personalizationDetails.initials}
                        </p>
                      )}
                      {item.personalizationDetails?.color && (
                        <p className="text-[11px] text-[#736C66]">
                          Selected Color: {item.personalizationDetails.color}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-[#2C332D]">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#736C66]">
                      ₹{Number(item.unitPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#2C332D]">
                      ₹{Number(item.totalPrice || item.unitPrice * item.quantity || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation Totals & Amount in Words (No inner enclosing borders) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-2">
          {/* Amount in words & Artisan note */}
          <div className="inner-card p-4 rounded-2xl bg-[#FAF8F5]/80 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#800020] block">
              Amount in Words
            </span>
            <p className="font-serif italic font-bold text-[#2C332D]">
              Indian Rupees {numberToIndianWords(totalAmount)} Only.
            </p>
            <div className="pt-2 border-t border-[#E8E0D5]/70 text-[11px] text-[#736C66] leading-relaxed">
              <p className="font-semibold text-[#2C332D] mb-0.5">Artisan Keepsake Guarantee:</p>
              Thank you for supporting Devangi Resin Studio! Each bespoke piece is handcrafted with premium non-yellowing epoxy resin, preserved botanicals, and hand-finished with meticulous precision.
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="inner-card bg-white rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 text-[#736C66]">
              <span>Items Subtotal</span>
              <span className="font-mono">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between py-1 text-[#2E7D32] font-medium">
                <span>Festival / Promo Discount</span>
                <span className="font-mono">-₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between py-1 text-[#736C66]">
              <span>Insured Shipping &amp; Handling</span>
              <span className="font-mono">
                {shippingCharge === 0 ? "FREE" : `₹${shippingCharge.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </span>
            </div>

            <div className="border-t-2 border-[#800020]/20 pt-2 flex justify-between items-center text-sm font-bold text-[#2C332D]">
              <span className="font-serif">Total Amount Paid</span>
              <span className="font-mono text-base text-[#800020]">
                ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Space for Authorized Signature with Stamp (NO partition border, only signature) */}
        <div className="relative z-10 pt-4">
          <div className="flex justify-end">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 flex items-center justify-center mb-1">
                {signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="Authorized Signature with Stamp"
                    className="max-h-20 max-w-[240px] object-contain filter contrast-125"
                  />
                ) : (
                  <div className="w-48 border-b border-gray-400 pb-1 text-center">
                    <span className="text-[10px] text-gray-400 italic font-serif">
                      (Authorized Signature &amp; Stamp)
                    </span>
                  </div>
                )}
              </div>
              <div className="w-52 border-t border-[#2C332D] pt-1">
                <p className="font-serif font-bold text-xs text-[#2C332D]">
                  Authorized Signatory &amp; Stamp
                </p>
                <p className="text-[10px] text-[#736C66]">
                  {storeName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 border-t border-[#F4EBE6] pt-4 text-center text-[10px] text-[#8C7A72]">
          This is a computer-generated verified tax receipt issued by {storeName}. For order inquiries, contact {settings?.contactEmail || "hello@devangiresinstudio.com"}.
        </div>

      </div>
    </div>
  );
}
