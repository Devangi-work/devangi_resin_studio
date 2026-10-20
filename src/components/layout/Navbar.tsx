"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/store/cart";
import {
  ShoppingBag,
  Menu,
  X,
  Search,
  Sparkles,
  User,
  Package,
  ChevronDown,
  ArrowRight,
  Sparkle,
} from "lucide-react";

export function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch site settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSettings(data);
      })
      .catch(() => {});

    // 2. Fetch categories dynamically from database
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(() => {});

    // 3. Check customer session for avatar display
    fetch("/api/customer/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.customer) {
          setCustomer(data.customer);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCollectionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsMobileMenuOpen(false);
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Announcement Top Bar - Responsive, never cropped on mobile */}
      <div className="bg-[#3A1823] text-[#FAF4EE] text-[10px] xs:text-[11px] sm:text-xs py-2 px-3 sm:px-4 text-center font-medium tracking-wide flex items-center justify-center space-x-1.5 sm:space-x-2 leading-snug sm:leading-normal">
        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37] flex-shrink-0" />
        <span className="text-center font-sans">
          Handmade with Love • Complimentary Insured Delivery on orders over ₹
          {settings?.freeShippingThreshold
            ? Number(settings.freeShippingThreshold).toFixed(2)
            : "999.00"}
        </span>
        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37] flex-shrink-0" />
      </div>

      {/* Main Navbar - Solid porcelain cream in mobile view (never transparent), logo colors */}
      <nav className="bg-[#FCFAF8] sm:bg-[#FCFAF8]/95 sm:backdrop-blur-md border-b border-[#EFE3E7] px-3 sm:px-6 lg:px-8 transition-colors duration-200 shadow-[0_1px_3px_rgba(58,24,35,0.04)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20 lg:h-24 gap-2 sm:gap-4 w-full">
          
          {/* Mobile Menu Button with smooth icon rotation animation */}
          <div className="flex items-center lg:hidden flex-shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-1 rounded-xl text-[#3A1823] hover:bg-[#FAF0F3] active:scale-95 transition-all duration-200 focus:outline-none"
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <Menu
                  className={`w-5 h-5 absolute transition-all duration-300 transform ${
                    isMobileMenuOpen ? "rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"
                  }`}
                />
                <X
                  className={`w-5 h-5 absolute transition-all duration-300 transform ${
                    isMobileMenuOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75"
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Brand Logo - Full name displayed always, never cut off with "..." */}
          <div className="flex-1 lg:flex-none min-w-0 px-0.5 sm:px-0">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3.5 group text-left">
              <img
                src="/images/logo/resin_logo.png"
                alt="Devangi Resin Studio Logo"
                className="w-9 h-9 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-sm group-hover:scale-105 transition-transform flex-shrink-0"
              />
              <div className="flex flex-col justify-center">
                <span className="font-serif text-[15px] sm:text-2xl lg:text-3xl font-bold tracking-tight sm:tracking-wide text-[#3A1823] group-hover:text-[#B84A67] transition-colors whitespace-nowrap block leading-tight">
                  {settings?.storeName || "Devangi Resin Studio"}
                </span>
                <span className="hidden sm:block text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-[#8C6E79] font-sans font-medium">
                  {settings?.storeTagline || "Handcrafted Resin Creations by Devangi"}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-7 xl:space-x-9">
            <Link
              href="/shop"
              className="text-xs font-semibold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37]"
            >
              Shop All
            </Link>

            {/* Dynamic Collections Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                onMouseEnter={() => setIsCollectionsOpen(true)}
                className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37] focus:outline-none group"
              >
                <span>Collections</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-[#8C6E79] group-hover:text-[#B84A67] ${
                    isCollectionsOpen ? "rotate-180 text-[#B84A67]" : ""
                  }`}
                />
              </button>

              {/* Luxury Dropdown Menu */}
              {isCollectionsOpen && (
                <div
                  onMouseLeave={() => setIsCollectionsOpen(false)}
                  className="absolute top-full -left-6 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#EFE3E7] p-3 z-[60] animate-fadeIn"
                >
                  <div className="px-3 py-2 border-b border-[#FAF0F3] flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#B84A67] flex items-center gap-1">
                      <Sparkle className="w-3 h-3 text-[#D4AF37]" />
                      <span>Artisan Collections</span>
                    </span>
                    <Link
                      href="/shop"
                      onClick={() => setIsCollectionsOpen(false)}
                      className="text-[10px] font-semibold text-[#8C6E79] hover:text-[#3A1823] flex items-center gap-1 transition-colors"
                    >
                      View All <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>

                  <div className="py-1.5 max-h-80 overflow-y-auto divide-y divide-[#FAF0F3]/80">
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <Link
                          key={cat.id || cat.slug}
                          href={`/shop?category=${cat.slug}`}
                          onClick={() => setIsCollectionsOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF0F3] group transition-all"
                        >
                          <div>
                            <p className="text-xs font-semibold text-[#3A1823] group-hover:text-[#B84A67] transition-colors">
                              {cat.name}
                            </p>
                            {cat.description && (
                              <p className="text-[10px] text-[#8C6E79] line-clamp-1 mt-0.5">
                                {cat.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-[#B84A67] opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-0.5 transition-all">
                            →
                          </span>
                        </Link>
                      ))
                    ) : (
                      [
                        { name: "Ocean & Geode Coasters", slug: "resin-coasters" },
                        { name: "Floral Keychains", slug: "resin-keychains" },
                        { name: "Botanical Jewellery", slug: "resin-jewellery" },
                        { name: "Resin Phone Charms", slug: "resin-phone-charms" },
                        { name: "Entrance Nameplates", slug: "resin-nameplates" },
                      ].map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/shop?category=${cat.slug}`}
                          onClick={() => setIsCollectionsOpen(false)}
                          className="block px-3 py-2 text-xs font-medium text-[#3A1823] hover:text-[#B84A67] hover:bg-[#FAF0F3] rounded-xl transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/custom-orders"
              className="text-xs font-semibold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37]"
            >
              Custom Studio
            </Link>

            {/* Don't show Track Order for logged in user */}
            {customer ? (
              <Link
                href="/account"
                className="text-xs font-semibold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37]"
              >
                My Orders
              </Link>
            ) : (
              <Link
                href="/track-order"
                className="text-xs font-semibold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37]"
              >
                Track Order
              </Link>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-[#3A1823] hover:text-[#B84A67] hover:bg-[#FAF0F3] active:scale-95 rounded-full transition-all"
              aria-label="Search products"
              title="Search Boutique"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Customer Account / Avatar */}
            <Link
              href="/account"
              className="p-1 sm:p-1.5 text-[#7A5E68] hover:text-[#3A1823] hover:bg-[#FAF0F3] rounded-full transition-colors hidden sm:inline-flex items-center"
              title={customer ? `My Account (${customer.name})` : "My Account & Orders"}
            >
              {customer?.avatarUrl ? (
                <img
                  src={customer.avatarUrl}
                  alt={customer.name}
                  className="w-7 h-7 rounded-full object-cover border border-[#D4AF37]"
                />
              ) : customer ? (
                <div className="w-7 h-7 rounded-full bg-[#FAF0F3] border border-[#EFE3E7] flex items-center justify-center text-[#B84A67] font-bold text-xs font-serif">
                  {customer.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              ) : (
                <User className="w-5 h-5" />
              )}
            </Link>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:p-2.5 bg-[#3A1823] text-[#FAF4EE] rounded-full hover:bg-[#4E2230] active:scale-95 transition-all shadow-sm flex items-center justify-center group"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#230E16] text-[10px] sm:text-[11px] font-bold w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="pb-4 pt-1 max-w-xl mx-auto overflow-hidden"
            >
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search keychains, geode coasters, floral jewellery..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-24 py-2.5 text-xs sm:text-sm bg-white border border-[#EFE3E7] rounded-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#2E161F] shadow-sm"
                  autoFocus
                />
                <Search className="w-4 h-4 text-[#8C6E79] absolute left-4" />
                <button
                  type="submit"
                  className="absolute right-1.5 px-4 py-1.5 text-xs font-semibold bg-[#3A1823] text-white rounded-full hover:bg-[#4E2230] transition-colors"
                >
                  Search
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Drawer Menu - Smooth animation, solid opaque background, NO duplicate logo */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 top-[96px] sm:top-[112px] bg-black/40 backdrop-blur-xs z-40 lg:hidden"
            />

            {/* Solid Drawer Content (Opaque luxury porcelain cream background, no see-through) */}
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden relative z-50 overflow-hidden bg-[#FCFAF8] border-b border-[#EFE3E7] shadow-2xl"
            >
              <div className="px-5 py-5 space-y-4 max-h-[calc(100vh-115px)] overflow-y-auto">
                {/* 1. Refined Boutique Tagline Banner (NO repeated logo here!) */}
                <div className="flex items-center justify-between pb-3 border-b border-[#EFE3E7] text-[11px] text-[#7A5E68]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                    <span>Handmade Luxury Resin Creations</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#B84A67] bg-[#FAF0F3] px-2 py-0.5 rounded-full border border-[#EFE3E7]">
                    Studio
                  </span>
                </div>

                {/* 2. Mobile Quick Search */}
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search coasters, jewellery, frames..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-20 py-2.5 text-xs bg-white border border-[#EFE3E7] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-[#2E161F] shadow-xs"
                  />
                  <Search className="w-4 h-4 text-[#8C6E79] absolute left-3.5" />
                  <button
                    type="submit"
                    className="absolute right-1.5 px-3 py-1.5 text-[11px] font-semibold bg-[#3A1823] text-white rounded-lg hover:bg-[#4E2230] active:scale-95 transition-all"
                  >
                    Search
                  </button>
                </form>

                {/* 3. Main Navigation Links */}
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/shop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EFE3E7] hover:border-[#D4AF37] text-[#3A1823] hover:text-[#B84A67] transition-all font-serif font-bold text-base tracking-wide group shadow-xs active:scale-98"
                  >
                    <span>Shop All Boutique</span>
                    <ArrowRight className="w-4 h-4 text-[#B84A67] group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {/* 4. Browse Collections with dynamic categories */}
                  <div className="py-2">
                    <div className="flex items-center justify-between mb-2.5 px-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#B84A67] flex items-center gap-1">
                        <Sparkle className="w-3 h-3 text-[#D4AF37]" />
                        <span>Browse Collections</span>
                      </span>
                      <Link
                        href="/shop"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[10px] font-medium text-[#7A5E68] hover:text-[#3A1823]"
                      >
                        All Categories →
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(categories.length > 0
                        ? categories
                        : [
                            { name: "Resin Coasters", slug: "resin-coasters" },
                            { name: "Resin Keychains", slug: "resin-keychains" },
                            { name: "Resin Jewellery", slug: "resin-jewellery" },
                            { name: "Phone Charms", slug: "resin-phone-charms" },
                            { name: "Resin Nameplates", slug: "resin-nameplates" },
                            { name: "Personalised Gifts", slug: "resin-photo-frames" },
                          ]
                      ).map((cat) => (
                        <Link
                          key={cat.id || cat.slug}
                          href={`/shop?category=${cat.slug}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="p-2.5 bg-white border border-[#EFE3E7] hover:border-[#D4AF37] hover:bg-[#FAF0F3] rounded-xl text-xs font-medium text-[#3A1823] hover:text-[#B84A67] transition-all truncate shadow-xs flex items-center justify-between active:scale-98"
                        >
                          <span className="truncate">{cat.name}</span>
                          <span className="text-[#AFA0A6] text-[10px] ml-1 flex-shrink-0">›</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* 5. Custom Studio Bespoke Card */}
                  <Link
                    href="/custom-orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 bg-gradient-to-r from-[#FAF0F3] to-white border border-[#EFE3E7] rounded-xl flex items-center justify-between group hover:border-[#D4AF37] transition-all shadow-xs active:scale-98"
                  >
                    <div>
                      <p className="font-serif font-bold text-sm text-[#3A1823] group-hover:text-[#B84A67] transition-colors">
                        Custom Studio (Bespoke Orders)
                      </p>
                      <p className="text-[10px] text-[#8C6E79]">
                        Crafted to your exact vision & florals
                      </p>
                    </div>
                    <Sparkles className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform flex-shrink-0 ml-2" />
                  </Link>

                  {/* 6. Account & Order Footer - Don't show Track Order for logged in user */}
                  <div className={`pt-2 grid ${customer ? "grid-cols-1" : "grid-cols-2"} gap-2 text-xs`}>
                    {!customer && (
                      <Link
                        href="/track-order"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2.5 bg-white border border-[#EFE3E7] rounded-xl flex items-center justify-center space-x-2 text-[#7A5E68] hover:text-[#3A1823] hover:border-[#7A5E68] transition-all shadow-xs active:scale-98"
                      >
                        <Package className="w-4 h-4 flex-shrink-0 text-[#B84A67]" />
                        <span className="font-medium text-[11px] truncate">Track Order</span>
                      </Link>
                    )}

                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2.5 bg-white border border-[#EFE3E7] rounded-xl flex items-center justify-center space-x-2 text-[#7A5E68] hover:text-[#3A1823] hover:border-[#7A5E68] transition-all shadow-xs active:scale-98"
                    >
                      {customer?.avatarUrl ? (
                        <img
                          src={customer.avatarUrl}
                          alt={customer.name}
                          className="w-4 h-4 rounded-full object-cover border border-[#D4AF37] flex-shrink-0"
                        />
                      ) : (
                        <User className="w-4 h-4 flex-shrink-0 text-[#B84A67]" />
                      )}
                      <span className="font-medium text-[11px] truncate">
                        {customer ? `My Account (${customer.name})` : "Sign In / Account"}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
