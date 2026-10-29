"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Sparkles,
  Search,
  Package,
  Heart,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";

interface ShowcasePiece {
  id: string;
  orderNumber: string;
  orderDate: string;
  productName: string;
  variantName?: string | null;
  customName?: string | null;
  personalizationDetails?: any;
  imageUrl: string;
  categoryTag: string;
  orderSource?: string;
  isDelivered?: boolean;
}

interface OrdersCatalogueViewProps {
  pieces: ShowcasePiece[];
  whatsappNumber: string;
  storeName: string;
}

export function OrdersCatalogueView({
  pieces,
  whatsappNumber,
  storeName,
}: OrdersCatalogueViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    "All",
    "Clocks",
    "Frames & Flowers",
    "Coasters & Trays",
    "Nameplates",
    "Jewellery & Accessories",
    "Custom Commissions",
  ];

  const filteredPieces = pieces.filter((piece) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      piece.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (piece.customName && piece.customName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      piece.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "All" ||
      piece.categoryTag.toLowerCase().includes(activeCategory.toLowerCase()) ||
      piece.productName.toLowerCase().includes(activeCategory.toLowerCase().slice(0, 4));

    return matchesSearch && matchesCategory;
  });

  const generateWhatsappUrl = (piece: ShowcasePiece) => {
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
    const details = piece.customName ? `Custom Name: "${piece.customName}"` : "";
    const msg = `Hi ${storeName}! ✨\n\nI was browsing your Orders Showcase and loved this piece:\n• Piece: ${piece.productName}${piece.variantName ? ` (${piece.variantName})` : ""}\n• Order Reference: #${piece.orderNumber}\n${details ? `• Customization: ${details}\n` : ""}\nI would love to get the same piece made! Could you please share the pricing, customization options, and availability?`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-8">
      {/* Search and Category Filter Strip */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#E8E0D5] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-[#8C7A72] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search handcrafted pieces, orders, custom names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-[#2C332D]"
            />
          </div>
          <div className="text-xs text-[#736C66] self-end sm:self-center font-medium">
            Showing <strong>{filteredPieces.length}</strong> real custom orders
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-xs font-semibold text-[#8C7A72] flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-[#3A1823] text-white shadow-xs"
                  : "bg-[#FAF8F5] text-[#736C66] hover:bg-[#F4EBE6] border border-[#E8E0D5]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Order Showcase Pieces */}
      {filteredPieces.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E0D5] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF4EC] text-[#B8972E] flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#2C332D]">No matching pieces found</h3>
          <p className="text-xs text-[#736C66] max-w-sm mx-auto">
            Try adjusting your search keyword or selecting a different category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("All");
            }}
            className="mt-2 text-xs font-bold text-[#B8972E] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPieces.map((piece) => {
            const waUrl = generateWhatsappUrl(piece);

            return (
              <div
                key={piece.id}
                className="bg-white rounded-3xl border border-[#E8E0D5] overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group"
              >
                {/* Image Container */}
                <div className="relative aspect-square w-full bg-[#FAF4EC] overflow-hidden">
                  <img
                    src={piece.imageUrl}
                    alt={piece.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback placeholder image
                      (e.currentTarget as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80";
                    }}
                  />

                  {/* Top Badge: Verified Commission */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    <span>Real Client Order</span>
                  </div>

                  {piece.orderNumber && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-[#2C332D] text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border border-[#E8E0D5] shadow-xs">
                      #{piece.orderNumber.replace(/^#/, "")}
                    </div>
                  )}
                </div>

                {/* Details Container */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#8C7A72]">
                      <span className="uppercase font-bold tracking-wider text-[#B8972E]">
                        {piece.categoryTag}
                      </span>
                      <span>
                        {new Date(piece.orderDate).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="font-serif text-base font-bold text-[#2C332D] group-hover:text-[#6A162B] transition-colors leading-snug">
                      {piece.productName}
                    </h3>

                    {piece.variantName && (
                      <p className="text-xs text-[#736C66] font-medium">{piece.variantName}</p>
                    )}

                    {/* Customization Details Callout */}
                    {piece.customName && (
                      <div className="bg-[#FAF4EC] border border-[#E8E0D5] p-2 rounded-xl text-[11px] text-[#2C332D] flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#B8972E] shrink-0" />
                        <span>
                          Customized with: <strong>&ldquo;{piece.customName}&rdquo;</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Prominent "Want Same Piece?" WhatsApp Action Button */}
                  <div className="pt-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20BA5C] active:bg-[#1DA851] text-white text-xs font-bold rounded-2xl flex items-center justify-center space-x-2 transition shadow-sm hover:shadow-md active:scale-98"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Want Same Piece?</span>
                    </a>
                    <p className="text-[10px] text-center text-[#8C7A72] mt-1.5">
                      Direct WhatsApp enquiry with artisan Devangi
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bespoke Custom Inquiry Banner */}
      <div className="bg-gradient-to-r from-[#3A1823] to-[#5C2436] rounded-3xl p-6 sm:p-10 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left max-w-xl">
          <span className="text-xs uppercase font-bold tracking-widest text-[#D4AF37] block">
            Bespoke Resin Art Commission
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
            Have a unique idea or personal keepsake in mind?
          </h2>
          <p className="text-xs sm:text-sm text-[#F4EBE6]/90 leading-relaxed">
            We preserve wedding garlands, floral keepsakes, baby memories, and craft customized geode clocks tailored to your exact color palette.
          </p>
        </div>
        <a
          href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
            "Hi Devangi! ✨ I have a custom resin art requirement and would love to discuss custom design options with you."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-6 py-3.5 bg-[#D4AF37] hover:bg-[#C29E2F] text-[#3A1823] font-bold text-xs uppercase tracking-wider rounded-2xl transition shadow-md active:scale-98 flex items-center space-x-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}

