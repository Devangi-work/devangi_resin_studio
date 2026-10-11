"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Announcement Top Bar */}
      <div className="bg-[#2C332D] text-[#FAF8F5] text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center space-x-2">
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>
          Handmade with Love • Complimentary Insured Delivery on orders over ₹
          {settings?.freeShippingThreshold
            ? Number(settings.freeShippingThreshold).toFixed(2)
            : "999.00"}
        </span>
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
      </div>

      {/* Main Glass Navbar */}
      <nav className="glass border-b border-[#E8E0D5] px-3 sm:px-6 lg:px-8 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20 gap-1.5 sm:gap-4 w-full">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden flex-shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-md text-[#2C332D] hover:bg-[#F4EBE6] focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>

          {/* Brand Logo - auto-constrains on mobile so right icons never shift outside */}
          <div className="flex-1 lg:flex-none text-center lg:text-left min-w-0 px-1 sm:px-0 overflow-hidden">
            <Link href="/" className="inline-block max-w-full group">
              <span className="font-serif text-base sm:text-xl lg:text-2xl font-bold tracking-tight sm:tracking-wide text-[#2C332D] group-hover:text-[#B8972E] transition-colors truncate block">
                {settings?.storeName || "Devangi Resin Studio"}
              </span>
              <span className="hidden sm:block text-[8.5px] uppercase tracking-[0.2em] text-[#8C7A72] -mt-0.5 font-sans font-medium truncate">
                {settings?.storeTagline || "Handcrafted Resin Creations by Devangi"}
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links - Spacious, balanced & never congested */}
          <div className="hidden lg:flex items-center space-x-7 xl:space-x-9">
            <Link
              href="/shop"
              className="text-xs font-semibold uppercase tracking-wider text-[#2C332D] hover:text-[#B8972E] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37]"
            >
              Shop All
            </Link>

            {/* Dynamic Collections Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                onMouseEnter={() => setIsCollectionsOpen(true)}
                className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2C332D] hover:text-[#B8972E] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37] focus:outline-none group"
              >
                <span>Collections</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-[#736C66] group-hover:text-[#B8972E] ${
                    isCollectionsOpen ? "rotate-180 text-[#B8972E]" : ""
                  }`}
                />
              </button>

              {/* Luxury Dropdown Menu */}
              {isCollectionsOpen && (
                <div
                  onMouseLeave={() => setIsCollectionsOpen(false)}
                  className="absolute top-full -left-6 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#E8E0D5] p-3 z-[60] animate-fadeIn"
                >
                  <div className="px-3 py-2 border-b border-[#F4EBE6] flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8972E] flex items-center gap-1">
                      <Sparkle className="w-3 h-3 text-[#D4AF37]" />
                      <span>Artisan Collections</span>
                    </span>
                    <Link
                      href="/shop"
                      onClick={() => setIsCollectionsOpen(false)}
                      className="text-[10px] font-semibold text-[#736C66] hover:text-[#2C332D] flex items-center gap-1 transition-colors"
                    >
                      View All <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>

                  <div className="py-1.5 max-h-80 overflow-y-auto divide-y divide-[#F4EBE6]/60">
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <Link
                          key={cat.id || cat.slug}
                          href={`/shop?category=${cat.slug}`}
                          onClick={() => setIsCollectionsOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] group transition-all"
                        >
                          <div>
                            <p className="text-xs font-semibold text-[#2C332D] group-hover:text-[#B8972E] transition-colors">
                              {cat.name}
                            </p>
                            {cat.description && (
                              <p className="text-[10px] text-[#8C7A72] line-clamp-1 mt-0.5">
                                {cat.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-[#A69E96] opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-0.5 transition-all">
                            →
                          </span>
                        </Link>
                      ))
                    ) : (
                      // Fallback while loading
                      [
                        { name: "Ocean & Geode Coasters", slug: "resin-coasters" },
                        { name: "Floral Keychains", slug: "resin-keychains" },
                        { name: "Botanical Jewellery", slug: "resin-jewellery" },
                        { name: "Golden Foil Bookmarks", slug: "resin-bookmarks" },
                        { name: "Entrance Nameplates", slug: "resin-nameplates" },
                      ].map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/shop?category=${cat.slug}`}
                          onClick={() => setIsCollectionsOpen(false)}
                          className="block px-3 py-2 text-xs font-medium text-[#2C332D] hover:text-[#B8972E] hover:bg-[#FAF8F5] rounded-xl transition-colors"
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
              className="text-xs font-semibold uppercase tracking-wider text-[#2C332D] hover:text-[#B8972E] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37]"
            >
              Custom Studio
            </Link>

            <Link
              href="/track-order"
              className="text-xs font-semibold uppercase tracking-wider text-[#2C332D] hover:text-[#B8972E] transition-colors py-1 border-b-2 border-transparent hover:border-[#D4AF37]"
            >
              Track Order
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-1.5 sm:p-2 text-[#2C332D] hover:text-[#B8972E] hover:bg-[#F4EBE6] rounded-full transition-colors"
              aria-label="Search products"
              title="Search Boutique"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Customer Account / Orders */}
            <Link
              href="/account"
              className="p-1.5 sm:p-2 text-[#736C66] hover:text-[#2C332D] hover:bg-[#F4EBE6] rounded-full transition-colors hidden sm:inline-flex"
              title="My Account & Orders"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:p-2.5 bg-[#2C332D] text-[#FAF8F5] rounded-full hover:bg-[#3D473E] transition-all shadow-sm flex items-center justify-center group"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#2C332D] text-[10px] sm:text-[11px] font-bold w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {isSearchOpen && (
          <div className="pb-4 pt-1 max-w-xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search keychains, geode coasters, floral jewellery..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-2.5 text-sm bg-white/90 border border-[#E8E0D5] rounded-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#2C332D] shadow-sm"
                autoFocus
              />
              <Search className="w-4 h-4 text-[#736C66] absolute left-4" />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-1.5 text-xs font-semibold bg-[#2C332D] text-white rounded-full hover:bg-[#3D473E] transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </nav>

      {/* Mobile Drawer Menu - Responsive and Categorized */}
      {isMobileMenuOpen && (
        <div className="lg:hidden glass border-b border-[#E8E0D5] px-6 py-6 shadow-xl animate-fadeIn">
          <div className="flex flex-col space-y-3">
            <Link
              href="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-[#2C332D] hover:text-[#B8972E] py-2 border-b border-[#F4EBE6]"
            >
              Shop All Boutique
            </Link>

            {/* Dynamic Categories List in Mobile Menu */}
            <div className="py-2 border-b border-[#F4EBE6]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8972E] block mb-2">
                Browse Collections
              </span>
              <div className="grid grid-cols-2 gap-2 pl-1">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <Link
                      key={cat.id || cat.slug}
                      href={`/shop?category=${cat.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs text-[#736C66] hover:text-[#2C332D] py-1 truncate"
                    >
                      {cat.name}
                    </Link>
                  ))
                ) : (
                  [
                    { name: "Coasters", slug: "resin-coasters" },
                    { name: "Keychains", slug: "resin-keychains" },
                    { name: "Jewellery", slug: "resin-jewellery" },
                    { name: "Bookmarks", slug: "resin-bookmarks" },
                    { name: "Nameplates", slug: "resin-nameplates" },
                  ].map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/shop?category=${cat.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xs text-[#736C66] hover:text-[#2C332D] py-1 truncate"
                    >
                      {cat.name}
                    </Link>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/custom-orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-[#2C332D] hover:text-[#B8972E] py-2 border-b border-[#F4EBE6]"
            >
              Custom Studio (Bespoke Orders)
            </Link>

            <div className="pt-2 flex items-center justify-between text-xs text-[#736C66]">
              <Link
                href="/track-order"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-1.5 py-1 hover:text-[#2C332D]"
              >
                <Package className="w-4 h-4" />
                <span>Track Your Order</span>
              </Link>
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-1.5 py-1 hover:text-[#2C332D]"
              >
                <User className="w-4 h-4" />
                <span>My Account & Orders</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
