"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, Check, ShieldCheck, Mail, Phone, MessageCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    storeName: "Aura Resin Art Studio",
    storeTagline: "Handmade Resin Elegance, Preserved Forever",
    storeDescription: "Boutique handmade resin art, bespoke jewellery, personalized gifts, keychains, and coasters crafted with passion.",
    contactEmail: "hello@auraresinart.com",
    contactPhone: "+91 98765 43210",
    whatsappNumber: "+919876543210",
    instagramUrl: "https://instagram.com/devangiresinstudio",
    pinterestUrl: "https://pinterest.com/auraresinart",
    defaultShippingCharge: "79.00",
    freeShippingThreshold: "999.00",
    orderConfirmationMessage: "Thank you for your order! Each resin piece is carefully handcrafted with love and utmost precision.",
    productionTimeMessage: "Handmade resin items take 3 to 5 business days for precision curing before dispatch.",
    returnPolicy: "Because each piece is custom handmade, returns are accepted within 7 days for damaged/defective items upon delivery.",
    shippingPolicy: "Standard insured domestic delivery across India takes 4-7 business days after curing.",
    privacyPolicy: "We value your privacy and never sell or share your personal information with third parties.",
    termsPolicy: "All custom personalised resin orders enter production immediately upon payment confirmation.",
    careInstructionsDefault: "Keep away from prolonged direct high heat. Clean gently with a soft microfiber cloth and mild soap. Avoid harsh chemical cleaners.",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage("Settings saved and live across the storefront!");
      }
    } catch {
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-xs text-[#736C66] py-12 text-center">Loading settings...</p>;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Studio Branding & Site Settings
          </h1>
          <p className="text-xs text-[#736C66]">
            Configure store contact information, shipping rates, and legal policies stored in Neon PostgreSQL.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 hover:bg-[#3D473E] shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32]">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Branding & Contacts */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-4">
          <h2 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
            Store Identity & Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Store Brand Name
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Store Tagline
              </label>
              <input
                type="text"
                value={settings.storeTagline}
                onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                WhatsApp Number (with country code)
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Store Description
            </label>
            <textarea
              rows={2}
              value={settings.storeDescription}
              onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
            />
          </div>
        </div>

        {/* Shipping & Thresholds */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-4">
          <h2 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
            Shipping Charges & Thresholds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Default Domestic Shipping Fee (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.defaultShippingCharge || "79.00"}
                onChange={(e) => setSettings({ ...settings, defaultShippingCharge: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Free Shipping Cart Threshold (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.freeShippingThreshold || "999.00"}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* UPI Payments & QR Code Configuration */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-5">
          <div className="border-b border-[#F4EBE6] pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold text-[#2C332D]">
                UPI & QR Code Payment Setup
              </h2>
              <p className="text-xs text-[#736C66] mt-0.5">
                Customers scan this QR code or pay to this UPI ID directly at checkout.
              </p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-bold bg-[#E8EFE8] text-[#2E7D32] rounded-full">
              Live Checkout
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                UPI ID (VPA) <span className="text-[#DF4C4C]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. devangi0403@okaxis or 9876543210@paytm"
                value={settings.upiId || ""}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl font-mono text-[#2C332D]"
              />
              <p className="text-[11px] text-[#736C66] mt-1">
                Customers can copy this UPI ID with 1 click to pay in Google Pay, PhonePe, or Paytm.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Account Holder / Display Name <span className="text-[#DF4C4C]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Devangi Resin Studio"
                value={settings.accountHolderName || ""}
                onChange={(e) => setSettings({ ...settings, accountHolderName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
              <p className="text-[11px] text-[#736C66] mt-1">
                Name shown on the payment screen alongside your UPI ID.
              </p>
            </div>
          </div>

          {/* QR Code Upload & Preview */}
          <div className="pt-2 border-t border-[#F4EBE6]">
            <label className="text-xs font-semibold text-[#2C332D] block mb-2">
              UPI Scanner QR Code Image
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {settings.upiQrCodeUrl ? (
                <div className="relative group p-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-2xl">
                  <img
                    src={settings.upiQrCodeUrl}
                    alt="UPI QR Code Preview"
                    className="w-36 h-36 object-contain rounded-xl bg-white shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, upiQrCodeUrl: "" })}
                    className="absolute -top-2 -right-2 bg-[#DF4C4C] text-white p-1 rounded-full shadow hover:bg-red-700 transition"
                    title="Remove QR Code"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="w-36 h-36 border-2 border-dashed border-[#E8E0D5] rounded-2xl flex flex-col items-center justify-center text-[#736C66] text-xs p-3 text-center bg-[#FAF8F5]">
                  <span>No QR Code Uploaded</span>
                  <span className="text-[10px] text-[#A89F91] mt-1">PNG, JPG, or WEBP</span>
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="file"
                  id="qrUploadInput"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch("/api/admin/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      if (data.url) {
                        setSettings((prev: any) => ({ ...prev, upiQrCodeUrl: data.url }));
                      } else {
                        alert(data.error || "Failed to upload QR image.");
                      }
                    } catch {
                      alert("Upload error.");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("qrUploadInput")?.click()}
                  className="px-4 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E] transition shadow-sm"
                >
                  {settings.upiQrCodeUrl ? "Replace QR Code Image" : "Upload QR Code Image"}
                </button>
                <p className="text-[11px] text-[#736C66]">
                  Upload your Google Pay, PhonePe, or Paytm QR code (Max 5MB). It will be saved securely to Vercel Blob and displayed directly to buyers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Care Policies */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-4">
          <h2 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
            Customer Policies & Resin Care Instructions
          </h2>

          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Default Resin Care Instructions
            </label>
            <textarea
              rows={2}
              value={settings.careInstructionsDefault}
              onChange={(e) => setSettings({ ...settings, careInstructionsDefault: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Shipping & Dispatch Policy
            </label>
            <textarea
              rows={2}
              value={settings.shippingPolicy}
              onChange={(e) => setSettings({ ...settings, shippingPolicy: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Return & Refund Policy
            </label>
            <textarea
              rows={2}
              value={settings.returnPolicy}
              onChange={(e) => setSettings({ ...settings, returnPolicy: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
