"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    // Check if initial admin setup is required
    fetch("/api/auth/setup")
      .then((res) => res.json())
      .then((data) => {
        if (data.needsSetup) {
          setNeedsSetup(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/admin/dashboard");
      } else {
        if (data.needsSetup) {
          setNeedsSetup(true);
        }
        setError(data.error || "Invalid administrator credentials.");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4">
      <div className="bg-white p-8 rounded-3xl border border-[#E8E0D5] shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#FAF4EC] rounded-full flex items-center justify-center text-[#B8972E] mx-auto border border-[#E8E0D5]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Studio Admin Portal
          </h1>
          <p className="text-xs text-[#736C66]">
            Sign in to manage products, orders, inventory, and resin art settings.
          </p>
        </div>

        {needsSetup && (
          <div className="bg-[#FAF4EC] border border-[#E8E0D5] p-3 rounded-xl text-xs text-[#2C332D] space-y-1">
            <p className="font-bold text-[#B8972E]">Initial Setup Required</p>
            <p className="text-[#736C66]">
              No admin account exists yet. Initialize your master account securely:
            </p>
            <Link
              href="/admin/setup"
              className="inline-block mt-1 text-xs font-semibold text-[#2C332D] underline hover:text-[#B8972E]"
            >
              Go to Initial Admin Setup →
            </Link>
          </div>
        )}

        {error && (
          <div className="p-3 bg-[#FDF2F2] border border-[#FADBD8] rounded-xl text-xs text-[#DF4C4C] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C7A72] absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="admin@auraresinart.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2C332D] block mb-1">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C7A72] absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#2C332D] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-[#3D473E] shadow-sm transition-all disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-[#8C7A72] hover:text-[#2C332D]">
            &larr; Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
