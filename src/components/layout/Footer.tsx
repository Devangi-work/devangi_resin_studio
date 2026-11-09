"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  Lock,
  Sparkles,
} from "lucide-react";

export function Footer() {
  const [settings, setSettings] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch site settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSettings(data);
      })
      .catch(() => {});

    // 2. Fetch live actual categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(() => {});

    // 3. Fetch customer login session
    fetch("/api/customer/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.customer) {
          setCustomer(data.customer);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[#230E16] text-[#FAF4EE] pt-16 pb-12 border-t border-[#3A1C26]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#3A1C26]">
          
          {/* Brand Info with Logo */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <img
                src="/images/logo/resin_logo.png"
                alt="Devangi Resin Studio"
                className="w-14 h-14 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
              />
              <div>
                <span className="font-serif text-2xl tracking-wide font-bold text-[#FAF4EE] block leading-tight">
                  {settings?.storeName || "Devangi Resin Studio"}
                </span>
                <span className="block text-[9px] uppercase tracking-[0.25em] text-[#D4AF37] font-sans font-medium mt-0.5">
                  {settings?.storeTagline || "Handcrafted Resin Creations by Devangi"}
                </span>
              </div>
            </Link>
            <p className="text-sm text-[#D1BFC6] leading-relaxed max-w-sm">
              {settings?.storeDescription ||
                "We handcraft bespoke epoxy resin art, botanical floral jewellery, personalized nameplates, and crystal geode homeware in India. Each piece is hand-poured with love, intention, and non-yellowing archival UV-stable resin."}
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <a
                href={settings?.instagramUrl || "https://www.instagram.com/devangi_resin_studio?cplk=dGV0MmUydXN2azcy"}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#3A1823] flex items-center justify-center text-[#FAF4EE] hover:text-[#D4AF37] hover:bg-[#4E2230] transition-colors shadow-xs"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${(settings?.whatsappNumber || "919876543210").replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(settings?.storeName || "Devangi Resin Studio")},%20I%20have%20an%20inquiry%20about%20a%20custom%20order!`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors shadow-xs"
                aria-label="WhatsApp Chat"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Actual Live Collections / Categories */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#D4AF37] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>Collections</span>
            </h3>
            <ul className="space-y-2 text-sm text-[#D1BFC6]">
              {categories.length > 0 ? (
                categories.slice(0, 6).map((cat) => (
                  <li key={cat.id || cat.slug}>
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="hover:text-white hover:translate-x-1 transition-all inline-block"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link href="/shop" className="hover:text-white transition-colors">
                      Shop All Boutique
                    </Link>
                  </li>
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
                    <Link href="/shop?category=resin-nameplates" className="hover:text-white transition-colors">
                      Entrance Nameplates
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#D4AF37]">
              Customer Care
            </h3>
            <ul className="space-y-2 text-sm text-[#D1BFC6]">
              {customer ? (
                <>
                  <li>
                    <Link href="/account" className="hover:text-white transition-colors flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      <span>My Account ({customer.name})</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/account" className="hover:text-white transition-colors">
                      My Orders & Status
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/track-order" className="hover:text-white transition-colors">
                      Track Your Order
                    </Link>
                  </li>
                  <li>
                    <Link href="/account/login" className="hover:text-white transition-colors">
                      Sign In / Register
                    </Link>
                  </li>
                </>
              )}
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
                  Returns & Exchange Policy
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

          {/* Studio Inquiries */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#D4AF37]">
              Studio Inquiries
            </h3>
            <p className="text-xs text-[#D1BFC6] leading-relaxed">
              Have questions about bespoke custom orders, resin preservation, or bridal keepsakes? Reach out to our studio directly.
            </p>

            <div className="pt-1 text-xs text-[#D1BFC6] space-y-2">
              <p className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                <span>{settings?.contactEmail || "hello@devangiresinstudio.com"}</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                <span>{settings?.contactPhone || "+91 98765 43210"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Copyright */}
        <div className="pt-8 border-t border-[#4E2230] flex flex-col items-center justify-center text-center text-xs text-[#D1BFC6] space-y-2">
          <p className="flex flex-wrap items-center justify-center gap-1.5 font-medium tracking-wide">
            <span>© 2026 {settings?.storeName || "Devangi Resin Studio"}. Handcrafted with Love in India.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
