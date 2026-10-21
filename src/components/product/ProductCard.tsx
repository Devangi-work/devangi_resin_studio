"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { ShoppingBag, Sparkles, Check } from "lucide-react";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    regularPrice: string | number;
    salePrice?: string | number | null;
    productType?: string;
    isBestseller?: boolean;
    isFeatured?: boolean;
    isFestivalSpecial?: boolean;
    festivalDiscountPercentage?: number | string | null;
    stockQuantity?: number;
    trackInventory?: boolean;
    images?: Array<{ imageUrl: string; altText?: string; isPrimary?: boolean }>;
    category?: { name: string; slug: string };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = React.useState(false);
  const regular = Number(product.regularPrice) || 0;
  const sale = product.salePrice ? Number(product.salePrice) : null;
  const isFestive = Boolean(product.isFestivalSpecial);
  const rawFestPct = product.festivalDiscountPercentage
    ? Number(String(product.festivalDiscountPercentage).replace(/%/g, "").trim())
    : 0;
  const festDiscount = rawFestPct > 0 ? String(rawFestPct) : null;

  let currentPrice = regular;
  let hasDiscount = false;
  let discountPercent = "0";

  if (isFestive && rawFestPct > 0) {
    const festDiscountAmount = (regular * rawFestPct) / 100;
    currentPrice = Math.max(0, Number((regular - festDiscountAmount).toFixed(2)));
    hasDiscount = currentPrice < regular;
    discountPercent = String(Math.round(rawFestPct));
  } else if (sale && sale < regular) {
    currentPrice = sale;
    hasDiscount = true;
    discountPercent = (((regular - sale) / regular) * 100).toFixed(0);
  }

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80";

  const secondaryImage =
    product.images?.[1]?.imageUrl || primaryImage;

  const isOutOfStock =
    Boolean(product.trackInventory) &&
    product.stockQuantity !== undefined &&
    product.stockQuantity <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    addItem({
      id: `${product.id}_standard`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: currentPrice,
      originalPrice: hasDiscount ? regular : undefined,
      isFestivalSpecial: isFestive,
      festivalDiscountPercentage: rawFestPct > 0 ? rawFestPct : null,
      image: primaryImage,
      quantity: 1,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className={`group flex flex-col transition-all duration-300 relative ${
        isFestive
          ? "bg-gradient-to-b from-[#FDF0F3] via-[#FAF0F4] to-[#F5E0E7] border-2 border-[#D4AF37] shadow-xl shadow-[#D4AF37]/20 ring-2 ring-[#D4AF37]/40 hover:border-[#C59B27] hover:ring-[#D4AF37]/70 hover:shadow-2xl hover:scale-[1.015] p-2.5 sm:p-3 rounded-3xl"
          : "bg-white border border-[#EFE3E7] hover:border-[#D4AF37] hover:shadow-lg rounded-2xl overflow-hidden"
      }`}
    >
      {/* Decorative Festive Top Ribbon Glow */}
      {isFestive && (
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#6A162B] via-[#D4AF37] to-[#6A162B] z-20 rounded-t-3xl" />
      )}

      {/* Image Container */}
      <Link
        href={`/shop/${product.slug}`}
        className={`relative aspect-square overflow-hidden block ${
          isFestive
            ? "rounded-2xl bg-white shadow-xs border border-[#E8C568]/40"
            : "bg-[#FCFAF8]"
        }`}
      >
        {/* Primary Image */}
        <img
          src={primaryImage}
          alt={product.name}
          className="product-card-image w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
          loading="lazy"
        />

        {/* Secondary Hover Image */}
        <img
          src={secondaryImage}
          alt={product.name}
          className="product-card-image w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col items-start space-y-1.5 z-10 max-w-[90%]">
          {/* Festive Special Highlight Badge */}
          {isFestive && (
            <span className="text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-[#6A162B] via-[#8F223D] to-[#6A162B] text-[#FFDF78] border border-[#FFDF78]/70 px-3 py-1 rounded-full shadow-md flex items-center space-x-1.5 animate-pulse">
              <Sparkles className="w-3 h-3 text-[#FFDF78] flex-shrink-0" />
              <span>Festive Special</span>
            </span>
          )}

          {/* Festive or Regular Discount Badge */}
          {festDiscount ? (
            <span className="text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] via-[#F3CE63] to-[#D4AF37] text-[#2E0B16] border border-[#B8972E]/60 px-3 py-1 rounded-full shadow-md font-mono flex items-center space-x-1">
              <span>✨ {festDiscount}% FESTIVE OFF</span>
            </span>
          ) : hasDiscount ? (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C04E6C] text-white px-2.5 py-0.5 rounded-full shadow-sm">
              {discountPercent}% OFF
            </span>
          ) : null}

          {product.isBestseller && !isFestive && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#3A1823] text-[#D4AF37] px-2 py-0.5 rounded-full shadow-sm flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Bestseller</span>
            </span>
          )}

          {product.productType === "customised" && (
            <span className="text-[10px] font-semibold tracking-wider bg-white/90 text-[#3A1823] px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm border border-[#EFE3E7]">
              Personalised
            </span>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="text-xs font-bold text-[#8C6E79] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-[#EFE3E7]">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick Add overlay button */}
        {!isOutOfStock && (
          <button
            onClick={handleQuickAdd}
            className={`absolute bottom-3 right-3 rounded-full shadow-lg flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transform translate-y-0 sm:translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-10 active:scale-95 ${
              isFestive
                ? "bg-gradient-to-r from-[#6A162B] to-[#8F223D] text-[#FFDF78] hover:bg-[#D4AF37] hover:text-[#2E0B16] border-2 border-[#FFDF78]/60 w-10 h-10 sm:w-11 sm:h-11 shadow-md"
                : "bg-white/95 text-[#3A1823] hover:bg-[#3A1823] hover:text-white w-9 h-9 sm:w-10 sm:h-10"
            }`}
            title="Quick Add to Cart"
            aria-label="Add to Cart"
          >
            {added ? (
              <Check className="w-4 h-4 text-[#2E7D32]" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        )}
      </Link>

      {/* Details */}
      <div
        className={`flex-1 flex flex-col justify-between ${
          isFestive
            ? "p-4 sm:p-5 space-y-3 bg-gradient-to-b from-white/90 to-[#FAF0F4]/90 rounded-2xl mt-2.5 border border-[#E8C568]/30 shadow-xs"
            : "p-4 space-y-2"
        }`}
      >
        <div>
          {product.category && (
            <span
              className={`text-[10px] uppercase font-bold tracking-widest block mb-1 ${
                isFestive ? "text-[#8C1D38]" : "text-[#8C6E79]"
              }`}
            >
              {product.category.name}
            </span>
          )}
          <Link
            href={`/shop/${product.slug}`}
            className={`font-serif font-semibold line-clamp-1 transition-colors block ${
              isFestive
                ? "text-base sm:text-lg text-[#2D121C] hover:text-[#8C1D38]"
                : "text-sm text-[#3A1823] hover:text-[#B84A67]"
            }`}
          >
            {product.name}
          </Link>
        </div>

        <div
          className={`flex items-baseline justify-between pt-2.5 border-t ${
            isFestive ? "border-[#E8C568]/40" : "border-[#FAF0F3]"
          }`}
        >
          <div className="flex items-baseline space-x-2">
            <span
              className={`font-black ${
                isFestive
                  ? "text-lg sm:text-xl text-[#6A162B] tracking-tight"
                  : "text-sm font-bold text-[#3A1823]"
              }`}
            >
              ₹{currentPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span
                className={`text-xs line-through ${
                  isFestive ? "text-[#8C6E79]" : "text-[#AFA0A6]"
                }`}
              >
                ₹{regular.toFixed(2)}
              </span>
            )}
          </div>
          {isFestive && (
            <span className="text-[10px] font-black text-[#800020] bg-[#FFF0F4] border border-[#D4AF37]/50 px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-xs uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>{rawFestPct > 0 ? `${rawFestPct}% OFF` : "Festive Deal"}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
