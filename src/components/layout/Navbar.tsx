"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import {
  ShoppingBag,
  Menu,
  X,
  Search,
  Sparkles,
  ShieldCheck,
  Package,
} from "lucide-react";

export function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navLinks = [
    { name: "Shop All", href: "/shop" },
    { name: "Coasters", href: "/shop?category=resin-coasters" },
    { name: "Keychains", href: "/shop?category=resin-keychains" },
    { name: "Jewellery", href: "/shop?category=resin-jewellery" },
    { name: "Bookmarks", href: "/shop?category=resin-bookmarks" },
    { name: "Nameplates", href: "/shop?category=resin-nameplates" },
    { name: "Custom Studio", href: "/custom-orders" },
    { name: "Track Order", href: "/track-order" },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Announcement Top Bar */}
      <div className="bg-[#2C332D] text-[#FAF8F5] text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center space-x-2">
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>Handmade with Love &bull; Complimentary Insured Delivery on orders over ₹999</span>
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
      </div>

      {/* Main Glass Navbar */}
      <nav className="glass border-b border-[#E8E0D5] px-4 sm:px-6 lg:px-8 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-[#2C332D] hover:bg-[#F4EBE6] focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex-1 lg:flex-none text-center lg:text-left">
            <Link href="/" className="inline-block group">
              <span className="font-serif text-2xl sm:text-3xl tracking-widest font-bold text-[#2C332D] group-hover:text-[#B8972E] transition-colors">
                AURA
              </span>
              <span className="block text-[9px] uppercase tracking-[0.25em] text-[#736C66] -mt-1 font-sans">
                Resin Art Studio
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-[#2C332D] hover:text-[#B8972E] transition-colors tracking-wide py-1 border-b-2 border-transparent hover:border-[#D4AF37]"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-[#2C332D] hover:text-[#B8972E] hover:bg-[#F4EBE6] rounded-full transition-colors"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Admin Dashboard shortcut */}
            <Link
              href="/admin/dashboard"
              className="p-2 text-[#736C66] hover:text-[#2C332D] hover:bg-[#F4EBE6] rounded-full transition-colors hidden sm:inline-flex"
              title="Admin Panel"
            >
              <ShieldCheck className="w-5 h-5" />
            </Link>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-[#2C332D] text-[#FAF8F5] rounded-full hover:bg-[#3D473E] transition-all shadow-sm flex items-center justify-center group"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#2C332D] text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Search Dropdown */}
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

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden glass border-b border-[#E8E0D5] px-6 py-6 shadow-xl animate-fadeIn">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-[#2C332D] hover:text-[#B8972E] py-2 border-b border-[#F4EBE6]"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2 flex items-center justify-between text-xs text-[#736C66]">
              <Link href="/track-order" className="flex items-center space-x-1.5 py-1">
                <Package className="w-4 h-4" />
                <span>Track Your Order</span>
              </Link>
              <Link href="/admin/dashboard" className="flex items-center space-x-1.5 py-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Login</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
