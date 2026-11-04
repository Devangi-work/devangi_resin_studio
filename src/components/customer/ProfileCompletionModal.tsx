"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Phone,
  Mail,
  User,
  Building,
  Navigation,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

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

export function ProfileCompletionModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const checkProfileStatus = async () => {
    // If user is already on profile or checkout, avoid overlapping modal
    if (
      pathname?.startsWith("/account/profile") ||
      pathname?.startsWith("/checkout") ||
      pathname?.startsWith("/admin")
    ) {
      setIsOpen(false);
      return;
    }

    try {
      const res = await fetch("/api/customer/me");
      const data = await res.json();

      if (!data.authenticated || !data.customer) {
        setIsOpen(false);
        return;
      }

      setCustomer(data.customer);

      const isMissing =
        !data.customer.phone ||
        data.customer.phone.trim().length < 10 ||
        !data.customer.email ||
        !data.customer.addressLine1 ||
        data.customer.addressLine1.trim().length < 3 ||
        !data.customer.city ||
        !data.customer.state ||
        !data.customer.postalCode;

      if (isMissing) {
        setFormData({
          name: data.customer.name || "",
          email: data.customer.email || "",
          phone: data.customer.phone || "",
          addressLine1: data.customer.addressLine1 || "",
          addressLine2: data.customer.addressLine2 || "",
          city: data.customer.city || "",
          state: data.customer.state || "",
          postalCode: data.customer.postalCode || "",
          country: data.customer.country || "India",
        });
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } catch {
      // ignore network errors
    }
  };

  useEffect(() => {
    checkProfileStatus();

    const handleAuthChange = () => {
      checkProfileStatus();
    };

    window.addEventListener("customer-auth-changed", handleAuthChange);
    window.addEventListener("customer-profile-updated", handleAuthChange);

    return () => {
      window.removeEventListener("customer-auth-changed", handleAuthChange);
      window.removeEventListener("customer-profile-updated", handleAuthChange);
    };
  }, [pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    if (!formData.addressLine1.trim() || formData.addressLine1.trim().length < 3) {
      setErrorMessage("Please enter Flat / House No. / Street Address.");
      return;
    }

    if (!formData.city.trim() || formData.city.trim().length < 2) {
      setErrorMessage("Please enter your City.");
      return;
    }

    if (!formData.state.trim()) {
      setErrorMessage("Please select your State.");
      return;
    }

    if (!formData.postalCode.trim() || !/^\d{6}$/.test(formData.postalCode.trim())) {
      setErrorMessage("Please enter a valid 6-digit PIN Code.");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          phone: cleanPhone,
          postalCode: formData.postalCode.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || "Failed to update profile details.");
      } else {
        setSuccessMessage("Your profile and delivery details have been saved!");
        window.dispatchEvent(new Event("customer-profile-updated"));
        window.dispatchEvent(new Event("customer-auth-changed"));
        setTimeout(() => {
          setIsOpen(false);
          setSuccessMessage("");
        }, 1200);
      }
    } catch {
      setErrorMessage("Network error while saving details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 border border-[#E8E0D5] shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#FAF8F5] text-[#736C66] hover:text-[#2C332D] hover:bg-[#F2ECE4] flex items-center justify-center transition-colors border border-[#E8E0D5]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FAF4EC] text-[#B8972E] border border-[#E8E0D5] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Profile Details Required</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2C332D]">
            Complete Your Delivery Details
          </h2>
          <p className="text-xs text-[#736C66] leading-relaxed">
            Please enter your contact number and delivery address to ensure seamless order dispatch, doorstep courier transit, and WhatsApp notifications.
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 bg-[#FDF2F2] border border-[#FADBD8] rounded-xl text-xs text-[#DF4C4C] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32] flex items-center space-x-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Details Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <div>
              <label className="text-[11px] font-bold text-[#2C332D] uppercase tracking-wider block mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8C7A72] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-[11px] font-bold text-[#2C332D] uppercase tracking-wider block mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C7A72] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white"
                />
              </div>
            </div>

            {/* Phone No */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-[#2C332D] uppercase tracking-wider block mb-1">
                Phone No. *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-[#736C66] border-r border-[#E8E0D5] pr-2">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder="9876543210"
                  className="w-full pl-14 pr-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white font-mono"
                />
              </div>
            </div>

            {/* Flat / House No. / Street Address */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-[#2C332D] uppercase tracking-wider block mb-1">
                Flat / House No. / Street Address *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-[#8C7A72] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  placeholder="e.g. Flat 302, Rosewood Apartments, 5th Cross Road"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white"
                />
              </div>
            </div>

            {/* Apartment / Landmark / Locality (Optional) */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-[#2C332D] uppercase tracking-wider block mb-1">
                Apartment / Landmark / Locality (Optional)
              </label>
              <div className="relative">
                <Navigation className="w-4 h-4 text-[#8C7A72] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  placeholder="e.g. Near ICICI Bank, Bandra West"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="text-[11px] font-bold text-[#2C332D] uppercase tracking-wider block mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Mumbai"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white"
              />
            </div>

            {/* State */}
            <div>
              <label className="text-[11px] font-bold text-[#2C332D] uppercase tracking-wider block mb-1">
                State *
              </label>
              <select
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white"
              >
                <option value="">Select State</option>
                {indianStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* PIN Code */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-[#2C332D] uppercase tracking-wider block mb-1">
                PIN Code *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#8C7A72] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder="e.g. 400050"
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl text-xs text-[#2C332D] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-5 bg-[#2C332D] hover:bg-[#1E231F] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Saving Details...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span>Save &amp; Continue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

