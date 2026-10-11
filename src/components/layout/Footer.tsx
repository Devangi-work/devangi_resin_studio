"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSettings(data);
      })
      .catch(() => {});
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });
      if (res.ok) {
        setSubscribed(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#1F2421] text-[#FAF8F5] pt-16 pb-12 border-t border-[#333A35]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#333A35]">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl tracking-widest font-bold text-[#FAF8F5]">
                {settings?.storeName || "AURA"}
              </span>
              <span className="block text-[9px] uppercase tracking-[0.25em] text-[#D4AF37] -mt-1 font-sans">
                {settings?.storeTagline || "Resin Art Studio"}
              </span>
            </Link>
            <p className="text-sm text-[#A69E96] leading-relaxed max-w-sm">
              {settings?.storeDescription ||
                "We handcraft bespoke epoxy resin art, botanical jewellery, personalized nameplates, and crystal geode homeware. Each piece is hand-poured with love, intention, and non-yellowing UV-stable resin."}
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <a
                href={settings?.instagramUrl || "https://instagram.com/auraresinart"}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#2C332D] flex items-center justify-center text-[#FAF8F5] hover:text-[#D4AF37] hover:bg-[#3D473E] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${(settings?.whatsappNumber || "919876543210").replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(settings?.storeName || "Aura Resin Art")},%20I%20have%20an%20inquiry%20about%20a%20custom%20order!`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors"
                aria-label="WhatsApp Chat"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#D4AF37]">
              Collections
            </h3>
            <ul className="space-y-2 text-sm text-[#A69E96]">
              <li>
                <Link href="/shop?category=resin-coasters" className="hover:text-white transition-colors">
                  Geode & Ocean Coasters
                </Link>
              </li>
              <li>
                <Link href="/shop?category=resin-keychains" className="hover:text-white transition-colors">
                  Floral Keychains
                </Link>
              </li>
              <li>
                <Link href="/shop?category=resin-jewellery" className="hover:text-white transition-colors">
                  Botanical Jewellery
                </Link>
              </li>
              <li>
                <Link href="/shop?category=resin-bookmarks" className="hover:text-white transition-colors">
                  Golden Foil Bookmarks
                </Link>
              </li>
              <li>
                <Link href="/shop?category=resin-nameplates" className="hover:text-white transition-colors">
                  Entrance Nameplates
                </Link>
              </li>
              <li>
                <Link href="/shop?category=personalised-gifts" className="hover:text-white transition-colors">
                  Personalised Keepsakes
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#D4AF37]">
              Customer Care
            </h3>
            <ul className="space-y-2 text-sm text-[#A69E96]">
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  My Account & Order History
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/custom-orders" className="hover:text-white transition-colors">
                  Bespoke Custom Orders
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" className="hover:text-white transition-colors">
                  Shipping & Dispatch
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-white transition-colors">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/policies/care" className="hover:text-white transition-colors">
                  Resin Care Guide
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#D4AF37]">
              Artisan Newsletter
            </h3>
            <p className="text-xs text-[#A69E96] leading-relaxed">
              Subscribe to receive exclusive launches, holiday discounts, and care guides. Enjoy 10% off with coupon <strong className="text-white">WELCOME10</strong>.
            </p>

            {subscribed ? (
              <div className="flex items-center space-x-2 text-xs text-[#66BB6A] bg-[#2C332D] p-3 rounded-lg border border-[#4E5D50]">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>You're subscribed! Use code WELCOME10 at checkout.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#2C332D] border border-[#444E46] rounded-lg text-white placeholder-[#736C66] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-xs font-semibold bg-[#D4AF37] text-[#1F2421] rounded-lg hover:bg-[#E5C358] transition-colors"
                >
                  {loading ? "Joining..." : "Get 10% Discount"}
                </button>
              </form>
            )}

            <div className="pt-2 text-xs text-[#A69E96] space-y-1">
              <p className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{settings?.contactEmail || "hello@auraresinart.com"}</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{settings?.contactPhone || "+91 98765 43210"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#736C66] space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-1.5">
            <span>© {new Date().getFullYear()} {settings?.storeName || "Devangi Resin Studio"}. Handcrafted in India.</span>
          </div>

          {/* Secure Payment Badges */}
          <div className="flex items-center space-x-3 text-[#A69E96]">
            <span className="flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>256-Bit SSL Encrypted</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#66BB6A]" />
              <span>UPI & QR Instant Payment</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
