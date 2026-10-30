"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccountLayoutShell } from "@/components/customer/AccountLayoutShell";
import {
  User,
  MapPin,
  Mail,
  Phone,
  Save,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building,
  Navigation,
  Globe,
  Sparkles,
  Camera,
} from "lucide-react";

export default function CustomerProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/customer/me");
      const data = await res.json();

      if (!data.authenticated) {
        router.push("/account/login?redirect=/account/profile");
        return;
      }

      setCustomer(data.customer);
      setFormData({
        name: data.customer.name || "",
        phone: data.customer.phone || "",
        addressLine1: data.customer.addressLine1 || "",
        addressLine2: data.customer.addressLine2 || "",
        city: data.customer.city || "",
        state: data.customer.state || "",
        postalCode: data.customer.postalCode || "",
        country: data.customer.country || "India",
      });
    } catch (err) {
      console.error("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (formData.phone && formData.phone.replace(/\D/g, "").length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (formData.postalCode && !/^\d{6}$/.test(formData.postalCode.trim())) {
      setErrorMessage("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || "Failed to update profile details.");
      } else {
        setCustomer((prev: any) => ({ ...prev, ...formData }));
        setSuccessMessage("Your profile and shipping details have been saved successfully!");
        window.dispatchEvent(new Event("customer-profile-updated"));
        window.dispatchEvent(new Event("customer-auth-changed"));
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch {
      setErrorMessage("Network error while saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-[#736C66]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D4AF37] mb-3" />
        <p className="text-sm font-medium">Loading your profile and shipping details...</p>
      </div>
    );
  }

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi NCR",
  ];

  return (
    <AccountLayoutShell
      customer={customer}
      onCustomerUpdated={(updated) => setCustomer(updated)}
    >
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2C332D]">
              Shipping Details &amp; Personal Info
            </h2>
            <p className="text-xs text-[#736C66] mt-0.5">
              Keep your contact and shipping information accurate for insured handcrafted deliveries across India.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-[#2E7D32] bg-[#E8EFE8] px-3 py-1.5 rounded-full font-bold border border-[#C5D8C5] self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure 256-Bit Encrypted Data</span>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="p-4 bg-[#E8EFE8] border border-[#C5D8C5] rounded-2xl flex items-center space-x-2 text-xs text-[#2E7D32] animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 font-bold" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-[#FDF2F2] border border-[#FADBD8] rounded-2xl flex items-center space-x-2 text-xs text-[#DF4C4C] animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Card 1: Personal Contact Details */}
          <div className="bg-white rounded-3xl border border-[#E8E0D5] p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center space-x-2.5 border-b border-[#F4EBE6] pb-4">
              <div className="w-8 h-8 rounded-xl bg-[#FAF0F3] text-[#B84A67] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2C332D]">
                  Personal Information
                </h3>
                <p className="text-[11px] text-[#8C6E79]">
                  Your verified identity on Devangi Resin Studio
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-1">
              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-[#2C332D] block mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8C7A72] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs sm:text-sm font-medium text-[#2C332D] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Email Address (Verified) */}
              <div>
                <label className="text-xs font-bold text-[#2C332D] block mb-1.5">
                  Email Address (Account ID)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C7A72] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={customer?.email || ""}
                    className="w-full pl-10 pr-24 py-2.5 bg-[#F5F2EB] border border-[#E8E0D5] rounded-xl text-xs sm:text-sm font-medium text-[#736C66] cursor-not-allowed select-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#2E7D32] bg-[#E8EFE8] px-2 py-0.5 rounded-md border border-[#C5D8C5]">
                    Verified
                  </span>
                </div>
                <p className="text-[10px] text-[#A69E96] mt-1">
                  Email is locked to your order authentication history.
                </p>
              </div>

              {/* Mobile Phone */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#2C332D] block mb-1.5">
                  Mobile Contact Number (for delivery updates &amp; tracking) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-[#736C66] border-r border-[#E8E0D5] pr-2.5">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                    placeholder="9876543210"
                    className="w-full pl-16 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs sm:text-sm font-medium text-[#2C332D] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Shipping & Delivery Address Details */}
          <div className="bg-white rounded-3xl border border-[#E8E0D5] p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center space-x-2.5 border-b border-[#F4EBE6] pb-4">
              <div className="w-8 h-8 rounded-xl bg-[#FAF0F3] text-[#B84A67] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2C332D]">
                  Default Delivery &amp; Shipping Address
                </h3>
                <p className="text-[11px] text-[#8C6E79]">
                  Used automatically at checkout for insured transit &amp; doorstep delivery
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Street Address Line 1 */}
              <div>
                <label className="text-xs font-bold text-[#2C332D] block mb-1.5">
                  Flat, House no., Building, Company, Apartment *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#8C7A72] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="e.g. Flat 402, Rosewood Heights, 14th Cross"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs sm:text-sm font-medium text-[#2C332D] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Street Address Line 2 */}
              <div>
                <label className="text-xs font-bold text-[#2C332D] block mb-1.5">
                  Area, Street, Sector, Village, Landmark
                </label>
                <div className="relative">
                  <Navigation className="w-4 h-4 text-[#8C7A72] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    placeholder="e.g. Near HDFC Bank, Bandra West"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs sm:text-sm font-medium text-[#2C332D] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* City, State, PIN Code Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* City */}
                <div>
                  <label className="text-xs font-bold text-[#2C332D] block mb-1.5">
                    Town / City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs sm:text-sm font-medium text-[#2C332D] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="text-xs font-bold text-[#2C332D] block mb-1.5">
                    State / Region *
                  </label>
                  <select
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs sm:text-sm font-medium text-[#2C332D] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Postal PIN Code */}
                <div>
                  <label className="text-xs font-bold text-[#2C332D] block mb-1.5">
                    6-Digit Postal PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, "") })}
                    placeholder="400050"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs sm:text-sm font-medium text-[#2C332D] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="text-xs font-bold text-[#2C332D] block mb-1.5">
                  Country
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-[#8C7A72] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled
                    value={formData.country || "India"}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F2EB] border border-[#E8E0D5] rounded-xl text-xs sm:text-sm font-medium text-[#736C66] cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="py-3 px-8 bg-[#2C332D] hover:bg-[#3D473E] text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                  <span>Save Shipping Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AccountLayoutShell>
  );
}

