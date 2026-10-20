"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, ShieldCheck, Mail, Lock, User, AlertCircle, ArrowRight } from "lucide-react";

export default function AdminSetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "Resin Studio Owner",
    email: "admin@devangiresinstudio.com",
    password: "",
    setupKey: "resin-art-admin-bootstrap-secret-2026",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Setup failed. Check your setup key.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4">
      <div className="bg-white p-8 rounded-3xl border border-[#E8E0D5] shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto flex items-center justify-center">
            <img
              src="/images/logo/resin_logo.png"
              alt="Devangi Resin Studio Logo"
              className="w-16 h-16 object-contain drop-shadow"
            />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Devangi Resin Studio Setup
          </h1>
          <p className="text-xs text-[#736C66]">
            Create your primary owner administrator account. Requires the ADMIN_SETUP_KEY from your .env file.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#FDF2F2] border border-[#FADBD8] rounded-xl text-xs text-[#DF4C4C] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Your Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8C7A72] absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Shrikesh Shetty"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C7A72] absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="admin@devangiresinstudio.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Master Password (Min 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C7A72] absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              ADMIN_SETUP_KEY (From .env)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#8C7A72] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={formData.setupKey}
                onChange={(e) => setFormData({ ...formData, setupKey: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#2C332D] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-[#3D473E] shadow-sm transition-all"
          >
            <span>{loading ? "Creating Account..." : "Initialize Admin Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/admin/login" className="text-xs text-[#8C7A72] hover:text-[#2C332D]">
            Already have an account? Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
}
