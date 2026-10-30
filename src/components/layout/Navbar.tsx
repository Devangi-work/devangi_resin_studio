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
  MapPin,
  BookOpen,
  LogOut,
  Home,
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
  const [avatarError, setAvatarError] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const collectionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fallbackCategories = [
    {
      id: "cat_keychains",
      name: "Resin Keychains",
      slug: "resin-keychains",
      description: "Handcrafted letter keychains, floral monograms, and personalized name tags with shimmering foils.",
      imageUrl: "https://rus9f71hta9djnrh.public.blob.vercel-storage.com/admin-media/1792655040533-1000179188-FPtiMddoi54sWXrjAx2pz6Tt6PPwpC.png",
    },
    {
      id: "cat_jewellery",
      name: "Resin Jewellery",
      slug: "resin-jewellery",
      description: "Delicate pendants, floral drop earrings, and crystal rings preserving real nature forever.",
      imageUrl: "https://rus9f71hta9djnrh.public.blob.vercel-storage.com/admin-media/1793385742791-whatsapp_image_2026-10-31_at_00.10.54-60cxnx8B2NgTJ7zFd8kEruXSsAZ2YA.jpeg",
    },
    {
      id: "cat_bookmarks",
      name: "Resin Phone Charms",
      slug: "resin-phone-charms",
      description: "Handmade crystal resin phone charms with real pressed botanicals, gold leaf accents, and durable cords.",
      imageUrl: "https://rus9f71hta9djnrh.public.blob.vercel-storage.com/admin-media/1792505053481-golden_resin_charm_keychain_on_white-FqPszUVIREH9Tf87G5548n7ekdd2m4.png",
    },
    {
      id: "cat_photo_frames",
      name: "Resin Photo stands",
      slug: "resin-photo-frames",
      description: "Immortalize your most cherished memories with dried floral inlays and embedded warm fairy lights.",
      imageUrl: "https://rus9f71hta9djnrh.public.blob.vercel-storage.com/admin-media/1793301137011-whatsapp_image_2026-10-30_at_00.41.51-bc6Oylmd3vKt4Zdr5o6Row3FZBh6Os.jpeg",
    },
    {
      id: "cat_personalised_gifts",
      name: "Personalised Gifts",
      slug: "personalised-gifts",
      description: "Bespoke clocks, preserved wedding garland keepsakes, and personalized anniversary treasures.",
      imageUrl: "https://rus9f71hta9djnrh.public.blob.vercel-storage.com/admin-media/1793385786267-whatsapp_image_2026-10-30_at_23.50.29__1_-JcpV3epZgQiMWiTD1EZhhjo1qA6aVz.jpeg",
    },
  ];

  const displayCategories =
    categories.length > 0
      ? categories.map((c) => {
          const matchedFallback = fallbackCategories.find((f) => f.slug === c.slug);
          return {
            ...c,
            imageUrl: c.imageUrl || matchedFallback?.imageUrl || "/images/logo/resin_logo.png",
            description: c.description || matchedFallback?.description || "",
          };
        })
      : fallbackCategories;

  const handleCollectionsEnter = () => {
    if (collectionsTimeoutRef.current) {
      clearTimeout(collectionsTimeoutRef.current);
    }
    setIsCollectionsOpen(true);
  };

  const handleCollectionsLeave = () => {
    if (collectionsTimeoutRef.current) {
      clearTimeout(collectionsTimeoutRef.current);
    }
    collectionsTimeoutRef.current = setTimeout(() => {
      setIsCollectionsOpen(false);
    }, 220);
  };

  useEffect(() => {
    // 1. Fetch site settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSettings(data);
      })
      .catch(() => { });

    // 2. Fetch categories dynamically from database
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(() => { });

    // 3. Check customer session for avatar display
    const checkCustomer = () => {
      fetch("/api/customer/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.authenticated && data?.customer) {
            setCustomer(data.customer);
            setAvatarError(false);
          } else {
            setCustomer(null);
          }
        })
        .catch(() => { });
    };

    checkCustomer();
    window.addEventListener("customer-profile-updated", checkCustomer);
    window.addEventListener("customer-auth-changed", checkCustomer);
    return () => {
      window.removeEventListener("customer-profile-updated", checkCustomer);
      window.removeEventListener("customer-auth-changed", checkCustomer);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCollectionsOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
        setIsProfileDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/customer/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error", e);
    }
    setCustomer(null);
    setIsProfileDropdownOpen(false);
    window.dispatchEvent(new Event("customer-auth-changed"));
    window.location.href = "/";
  };

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
      <nav
        ref={dropdownRef}
        className="relative bg-[#FCFAF8] sm:bg-[#FCFAF8]/95 sm:backdrop-blur-md border-b border-[#EFE3E7] px-3 sm:px-6 lg:px-8 transition-colors duration-200 shadow-[0_1px_3px_rgba(58,24,35,0.04)]"
      >
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
                  className={`w-5 h-5 absolute transition-all duration-300 transform ${isMobileMenuOpen ? "rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"
                    }`}
                />
                <X
                  className={`w-5 h-5 absolute transition-all duration-300 transform ${isMobileMenuOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75"
                    }`}
                />
              </div>
            </button>
          </div>

          {/* Brand Logo - Scaled elegantly across screen sizes so it never crowds links */}
          <div className="flex-1 lg:flex-none min-w-0 px-0.5 sm:px-0">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group text-left">
              <img
                src="/images/logo/resin_logo.png"
                alt="Devangi Resin Studio Logo"
                className="w-9 h-9 sm:w-12 sm:h-12 lg:w-13 lg:h-13 xl:w-16 xl:h-16 object-contain drop-shadow-xs group-hover:scale-105 transition-transform flex-shrink-0"
              />
              <div className="flex flex-col justify-center">
                <span className="font-serif text-[15px] sm:text-xl lg:text-[18px] xl:text-2xl 2xl:text-3xl font-bold tracking-tight text-[#3A1823] group-hover:text-[#B84A67] transition-colors whitespace-nowrap block leading-tight">
                  {settings?.storeName || "Devangi Resin Studio"}
                </span>
                <span className="hidden xl:block text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#8C6E79] font-sans font-medium whitespace-nowrap">
                  {settings?.storeTagline || "Handcrafted Resin Creations by Devangi"}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links - Spacious, uncrowded flex layout */}
          <div className="hidden lg:flex items-center gap-2 lg:gap-3 xl:gap-5 2xl:gap-6">
            <Link
              href="/"
              className="text-[11px] xl:text-xs font-semibold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37] whitespace-nowrap"
            >
              Home
            </Link>

            <Link
              href="/shop"
              className="text-[11px] xl:text-xs font-semibold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37] whitespace-nowrap"
            >
              Shop
            </Link>

            {/* Dynamic Collections Dropdown Trigger */}
            <div
              className="relative py-2"
              onMouseEnter={handleCollectionsEnter}
              onMouseLeave={handleCollectionsLeave}
            >
              <button
                type="button"
                onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                className="flex items-center space-x-1 text-[11px] xl:text-xs font-semibold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37] focus:outline-none group whitespace-nowrap cursor-pointer"
              >
                <span>Collections</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-[#8C6E79] group-hover:text-[#B84A67] ${
                    isCollectionsOpen ? "rotate-180 text-[#B84A67]" : ""
                  }`}
                />
              </button>
            </div>

            <Link
              href="/shop?festival=true"
              className="text-[11px] xl:text-xs font-bold uppercase tracking-wider text-[#8C1D38] hover:text-[#D4AF37] transition-colors py-1 flex items-center space-x-1 border-b-2 border-transparent hover:border-[#D4AF37] whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
              <span>Festive</span>
            </Link>

            <Link
              href="/custom-orders"
              className="text-[11px] xl:text-xs font-semibold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37] whitespace-nowrap"
            >
              Custom Studio
            </Link>

            <Link
              href="/devangiresinstudio/orderscatalogue"
              className="text-[11px] xl:text-xs font-semibold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37] whitespace-nowrap"
            >
              Showcase
            </Link>

            <Link
              href="/track-order"
              className="text-[11px] xl:text-xs font-semibold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37] whitespace-nowrap"
            >
              Track Order
            </Link>
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

            {/* Customer Account / Avatar Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="p-1 sm:p-1.5 text-[#7A5E68] hover:text-[#3A1823] hover:bg-[#FAF0F3] rounded-full transition-all inline-flex items-center gap-1 focus:outline-none"
                aria-label="User Account Options"
                aria-expanded={isProfileDropdownOpen}
                title={customer ? `Account Menu (${customer.name})` : "Account Menu"}
              >
                {customer?.avatarUrl && !avatarError ? (
                  <img
                    src={customer.avatarUrl}
                    alt={customer.name}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#D4AF37] shadow-xs"
                  />
                ) : customer ? (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF0F3] border border-[#EFE3E7] flex items-center justify-center text-[#B84A67] font-bold text-xs font-serif shadow-xs">
                    {customer.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF0F3] border border-[#EFE3E7] flex items-center justify-center text-[#7A5E68]">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}
                <ChevronDown
                  className={`w-3 h-3 text-[#8C6E79] transition-transform duration-200 hidden sm:block ${
                    isProfileDropdownOpen ? "rotate-180 text-[#3A1823]" : ""
                  }`}
                />
              </button>

              {/* 4 Direct Options Dropdown Menu */}
              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#EFE3E7] py-2 z-50 overflow-hidden text-left"
                  >
                    {/* User info banner if logged in */}
                    {customer && (
                      <div className="px-4 py-2.5 border-b border-[#FAF0F3] bg-[#FAF8F5]/70 mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
                          <p className="text-xs font-bold text-[#3A1823] truncate">{customer.name}</p>
                        </div>
                        <p className="text-[11px] text-[#8C6E79] truncate mt-0.5">{customer.email}</p>
                      </div>
                    )}

                    <div className="py-1 space-y-0.5 px-1.5">
                      {/* Option 1: View Orders */}
                      <Link
                        href={customer ? "/account/orders" : "/account/login?redirect=/account/orders"}
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#FAF0F3] text-[#3A1823] hover:text-[#B84A67] transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#FAF0F3] group-hover:bg-white text-[#B84A67] flex items-center justify-center transition-colors shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold leading-snug">View Orders</p>
                          <p className="text-[10px] text-[#8C6E79] leading-snug">Track parcels & order history</p>
                        </div>
                      </Link>

                      {/* Option 2: Shipping Details */}
                      <Link
                        href={customer ? "/account/profile" : "/account/login?redirect=/account/profile"}
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#FAF0F3] text-[#3A1823] hover:text-[#B84A67] transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#FAF0F3] group-hover:bg-white text-[#B84A67] flex items-center justify-center transition-colors shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold leading-snug">Shipping Details</p>
                          <p className="text-[10px] text-[#8C6E79] leading-snug">Delivery address & phone</p>
                        </div>
                      </Link>

                      {/* Option 3: Guide */}
                      <Link
                        href={customer ? "/account/guide" : "/policies/care"}
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#FAF0F3] text-[#3A1823] hover:text-[#B84A67] transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#FAF0F3] group-hover:bg-white text-[#B84A67] flex items-center justify-center transition-colors shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold leading-snug">Guide</p>
                          <p className="text-[10px] text-[#8C6E79] leading-snug">Resin art care & maintenance</p>
                        </div>
                      </Link>

                      {/* Option 4: Sign Out (or Sign In if guest) */}
                      <div className="pt-1 border-t border-[#FAF0F3] mt-1">
                        {customer ? (
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#FDF2F2] text-[#DF4C4C] transition-all text-left group cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#FDF2F2] group-hover:bg-white text-[#DF4C4C] flex items-center justify-center transition-colors shrink-0">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold leading-snug">Sign Out</p>
                              <p className="text-[10px] text-[#DF4C4C]/70 leading-snug">Log out of your account</p>
                            </div>
                          </button>
                        ) : (
                          <Link
                            href="/account/login"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#FAF0F3] text-[#3A1823] hover:text-[#B84A67] transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#FAF0F3] group-hover:bg-white text-[#B84A67] flex items-center justify-center transition-colors shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold leading-snug">Sign In</p>
                              <p className="text-[10px] text-[#8C6E79] leading-snug">Log in to your account</p>
                            </div>
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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

        {/* Full-Width Collections Mega Menu Dropdown */}
        <AnimatePresence>
          {isCollectionsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={handleCollectionsEnter}
              onMouseLeave={handleCollectionsLeave}
              className="hidden lg:block absolute top-full left-0 right-0 w-full bg-[#FCFAF8]/98 backdrop-blur-xl border-b border-[#EFE3E7] shadow-[0_25px_50px_-12px_rgba(58,24,35,0.18)] z-50 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-6 lg:px-8 py-7">
                {/* Header row inside mega menu */}
                <div className="flex items-center justify-between pb-5 border-b border-[#EFE3E7]/80">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#B84A67] flex items-center gap-1.5">
                      <Sparkle className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Artisan Resin Collections</span>
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#3A1823] mt-0.5">
                      Handcrafted Keepsakes &amp; Botanical Flora
                    </h3>
                  </div>

                  <Link
                    href="/shop"
                    onClick={() => setIsCollectionsOpen(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C1D38] hover:text-[#B84A67] bg-[#FAF0F3] hover:bg-[#F3E2E7] px-4 py-2 rounded-xl transition-all border border-[#EFE3E7]"
                  >
                    <span>Explore All Products ({displayCategories.length} Collections)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Category Cards Grid with Image + Category Name + Description */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 pt-6">
                  {displayCategories.map((cat) => (
                    <Link
                      key={cat.id || cat.slug}
                      href={`/shop?category=${cat.slug}`}
                      onClick={() => setIsCollectionsOpen(false)}
                      className="group flex flex-col rounded-2xl bg-white border border-[#EFE3E7] hover:border-[#D4AF37] p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                    >
                      {/* Image Thumbnail with zoom on hover */}
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FAF0F3] mb-3 border border-[#F4EBE6]">
                        <img
                          src={cat.imageUrl || "/images/logo/resin_logo.png"}
                          alt={cat.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/images/logo/resin_logo.png";
                          }}
                          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2C131C]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
                          <span className="text-[11px] font-medium text-white flex items-center gap-1">
                            Browse Collection <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
                          </span>
                        </div>
                      </div>

                      {/* Category Title & Description */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#3A1823] group-hover:text-[#B84A67] transition-colors leading-snug line-clamp-1">
                            {cat.name}
                          </h4>
                          {cat.description && (
                            <p className="text-[11px] text-[#7A5E68] line-clamp-2 mt-1 leading-relaxed">
                              {cat.description}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-[#B84A67] mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-0.5 transition-all">
                          View Items →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Bottom announcement strip inside mega menu */}
                <div className="mt-6 pt-4 border-t border-[#EFE3E7]/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#7A5E68] gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    <span>Every piece is cured for 72+ hours with UV-resistant glass-grade resin.</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      href="/custom-orders"
                      onClick={() => setIsCollectionsOpen(false)}
                      className="text-[#8C1D38] hover:text-[#B84A67] font-semibold flex items-center gap-1"
                    >
                      Design Bespoke Piece <ArrowRight className="w-3 h-3" />
                    </Link>
                    <span className="text-[#EFE3E7]">•</span>
                    <Link
                      href="/track-order"
                      onClick={() => setIsCollectionsOpen(false)}
                      className="text-[#7A5E68] hover:text-[#3A1823]"
                    >
                      Track Your Order
                    </Link>
                  </div>
                </div>
              </div>
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
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EFE3E7] hover:border-[#D4AF37] text-[#3A1823] hover:text-[#B84A67] transition-all font-serif font-bold text-base tracking-wide group shadow-xs active:scale-98"
                  >
                    <span className="flex items-center space-x-2.5">
                      <Home className="w-4 h-4 text-[#B84A67]" />
                      <span>Home</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#B84A67] group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/shop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EFE3E7] hover:border-[#D4AF37] text-[#3A1823] hover:text-[#B84A67] transition-all font-serif font-bold text-base tracking-wide group shadow-xs active:scale-98"
                  >
                    <span>Shop All Boutique</span>
                    <ArrowRight className="w-4 h-4 text-[#B84A67] group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/shop?festival=true"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#FAF0F3] to-[#FFF5F8] border-2 border-[#D4AF37] text-[#6A162B] font-serif font-bold text-base tracking-wide group shadow-xs active:scale-98"
                  >
                    <span className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>✨ Festive Specials</span>
                    </span>
                    <span className="text-[10px] bg-[#D4AF37] text-[#2D121C] px-2 py-0.5 rounded-full font-black">
                      OFFERS
                    </span>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {displayCategories.map((cat) => (
                        <Link
                          key={cat.id || cat.slug}
                          href={`/shop?category=${cat.slug}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 p-2 bg-white border border-[#EFE3E7] hover:border-[#D4AF37] hover:bg-[#FAF0F3] rounded-xl transition-all shadow-xs group"
                        >
                          <img
                            src={cat.imageUrl || "/images/logo/resin_logo.png"}
                            alt={cat.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/images/logo/resin_logo.png";
                            }}
                            className="w-10 h-10 rounded-lg object-cover bg-[#FAF0F3] border border-[#EFE3E7] shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#3A1823] group-hover:text-[#B84A67] transition-colors truncate">
                              {cat.name}
                            </p>
                            {cat.description && (
                              <p className="text-[10px] text-[#8C6E79] line-clamp-1">
                                {cat.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-[#B84A67] opacity-60 group-hover:opacity-100 mr-1">›</span>
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

                  <Link
                    href="/devangiresinstudio/orderscatalogue"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 bg-gradient-to-r from-[#FAF4EC] to-white border border-[#E8E0D5] rounded-xl flex items-center justify-between group hover:border-[#D4AF37] transition-all shadow-xs active:scale-98"
                  >
                    <div>
                      <p className="font-serif font-bold text-sm text-[#2C332D] group-hover:text-[#B8972E] transition-colors">
                        Orders Showcase &amp; Catalogue
                      </p>
                      <p className="text-[10px] text-[#736C66]">
                        Browse real custom orders &amp; tap to order same piece
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#B8972E] group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" />
                  </Link>

                  {/* 6. Account & Order Options */}
                  {customer ? (
                    <div className="pt-2 space-y-2 text-xs">
                      <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EFE3E7] flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {customer.avatarUrl && !avatarError ? (
                            <img
                              src={customer.avatarUrl}
                              alt={customer.name}
                              referrerPolicy="no-referrer"
                              onError={() => setAvatarError(true)}
                              className="w-7 h-7 rounded-full object-cover border border-[#D4AF37] shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#B84A67] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {customer.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[#3A1823] truncate">{customer.name}</p>
                            <p className="text-[10px] text-[#8C6E79] truncate">{customer.email}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="text-[11px] font-bold text-[#DF4C4C] bg-[#FDF2F2] hover:bg-[#FCE8E8] px-2.5 py-1 rounded-lg border border-[#FADBD8] flex items-center space-x-1 shrink-0 ml-2"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Sign Out</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <Link
                          href="/account/orders"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="p-2.5 bg-white border border-[#EFE3E7] hover:border-[#D4AF37] rounded-xl text-center shadow-xs flex flex-col items-center justify-center"
                        >
                          <Package className="w-4 h-4 text-[#B84A67] mb-1" />
                          <span className="text-[10px] font-bold text-[#3A1823] truncate block">Orders</span>
                        </Link>
                        <Link
                          href="/account/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="p-2.5 bg-white border border-[#EFE3E7] hover:border-[#D4AF37] rounded-xl text-center shadow-xs flex flex-col items-center justify-center"
                        >
                          <MapPin className="w-4 h-4 text-[#B84A67] mb-1" />
                          <span className="text-[10px] font-bold text-[#3A1823] truncate block">Shipping</span>
                        </Link>
                        <Link
                          href="/account/guide"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="p-2.5 bg-white border border-[#EFE3E7] hover:border-[#D4AF37] rounded-xl text-center shadow-xs flex flex-col items-center justify-center"
                        >
                          <BookOpen className="w-4 h-4 text-[#B84A67] mb-1" />
                          <span className="text-[10px] font-bold text-[#3A1823] truncate block">Guide</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                      <Link
                        href="/track-order"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2.5 bg-white border border-[#EFE3E7] rounded-xl flex items-center justify-center space-x-2 text-[#7A5E68] hover:text-[#3A1823] hover:border-[#7A5E68] transition-all shadow-xs active:scale-98"
                      >
                        <Package className="w-4 h-4 flex-shrink-0 text-[#B84A67]" />
                        <span className="font-medium text-[11px] truncate">Track Order</span>
                      </Link>

                      <Link
                        href="/account/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2.5 bg-white border border-[#EFE3E7] rounded-xl flex items-center justify-center space-x-2 text-[#7A5E68] hover:text-[#3A1823] hover:border-[#7A5E68] transition-all shadow-xs active:scale-98"
                      >
                        <User className="w-4 h-4 flex-shrink-0 text-[#B84A67]" />
                        <span className="font-medium text-[11px] truncate">Sign In</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
