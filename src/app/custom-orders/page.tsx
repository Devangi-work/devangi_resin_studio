"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Upload,
  CheckCircle2,
  ArrowRight,
  Gem,
  Clock,
  HeartHandshake,
} from "lucide-react";

export default function CustomOrdersPage() {
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    productType: "Preserved Wedding Garland Keepsake",
    budget: "₹1,000 - ₹3,000",
    description: "",
    referenceImageUrl: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload/reference-image", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, referenceImageUrl: data.url }));
      } else {
        setError(data.error || "Failed to upload image.");
      }
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit request.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-[#E8E0D5] text-xs font-semibold text-[#2C332D]">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Bespoke Artisan Studio</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C332D]">
          Design Your Custom Resin Art
        </h1>
        <p className="text-xs sm:text-sm text-[#736C66] font-light leading-relaxed">
          From wedding garland flower preservation to custom geode clocks and entrance nameplates, work directly with our master resin artists to create an heirloom treasure.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-5">
            <h2 className="font-serif text-base font-bold text-[#2C332D]">
              Our Bespoke Process
            </h2>

            <div className="space-y-4 text-xs text-[#736C66]">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-[#FAF4EC] text-[#B8972E] flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <strong className="text-[#2C332D] block">Submit Design Brief</strong>
                  Share your desired dimensions, flowers to preserve, colors, or reference photos.
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-[#FAF4EC] text-[#B8972E] flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <strong className="text-[#2C332D] block">Artisan Consultation & Quote</strong>
                  Within 24 hours, our artist reviews flower condition and provides a formal estimate.
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-[#FAF4EC] text-[#B8972E] flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <strong className="text-[#2C332D] block">Precision Handcrafting & Curing</strong>
                  Carefully preserved, hand-poured in layers, and cured over 5 to 7 business days.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF4EC] p-6 rounded-2xl border border-[#E8E0D5] space-y-2 text-xs text-[#2C332D]">
            <h3 className="font-bold flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-[#B8972E]" />
              <span>Special Note for Fresh Flower Preservation</span>
            </h3>
            <p className="text-[#736C66] leading-relaxed">
              If preserving wedding garlands or anniversary bouquets, send petals as fresh as possible (within 2-4 days of the ceremony) for maximum color retention.
            </p>
          </div>
        </div>

        {/* Right Form */}
        <div className="lg:col-span-7">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#E8EFE8] text-[#2E7D32] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#2C332D]">
                  Request Received!
                </h2>
                <p className="text-xs text-[#736C66] max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong>{formData.customerName}</strong>! Our master artisan has received your custom brief and will contact you via WhatsApp / email within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-xs text-[#DF4C4C] bg-[#FDF2F2] p-3 rounded-xl border border-[#FADBD8]">
                    {error}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ananya Deshmukh"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9820154321"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ananya@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Product Type *
                    </label>
                    <select
                      value={formData.productType}
                      onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    >
                      <option>Preserved Wedding Garland Keepsake</option>
                      <option>Custom Acrylic & Resin Door Nameplate</option>
                      <option>Illuminated Photo Frame with Fairy Lights</option>
                      <option>Geode Wall Clock with Raw Amethyst</option>
                      <option>Ocean Wave Charcuterie Table / Board</option>
                      <option>Bulk Wedding Favors / Corporate Gifts</option>
                      <option>Other Bespoke Creation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Estimated Budget Range
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    >
                      <option>₹500 - ₹1,500</option>
                      <option>₹1,500 - ₹3,000</option>
                      <option>₹3,000 - ₹6,000</option>
                      <option>₹6,000 - ₹15,000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Description of Your Vision *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe specific colors, words or family name, type of flowers, dates, or particular design styles you envision..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                {/* Optional Reference Upload */}
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Attach Reference Photo / Sketch (Optional)
                  </label>
                  <div className="border border-dashed border-[#E8E0D5] rounded-xl p-4 text-center bg-[#FAF8F5]">
                    {formData.referenceImageUrl ? (
                      <div className="flex items-center justify-between text-xs text-[#2E7D32]">
                        <span>Reference Image Attached!</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, referenceImageUrl: "" })}
                          className="text-[#DF4C4C] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="w-4 h-4 text-[#8C7A72] mx-auto mb-1" />
                        <span className="text-xs text-[#2C332D] font-medium block">
                          {uploadingImage ? "Uploading..." : "Upload photo (Max 5MB)"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-[#2C332D] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-[#3D473E] shadow-sm transition-all"
                >
                  <span>{submitting ? "Sending Request..." : "Submit Custom Inquiry"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
