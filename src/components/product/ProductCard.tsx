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
  aspectRatio?: "portrait" | "square";
}

export function ProductCard({ product, aspectRatio = "square" }: ProductCardProps) {
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
    "/images/logo/resin_logo.png";

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
      className={`group flex flex-col transition-all duration-300 relative rounded-2xl sm:rounded-3xl overflow-hidden ${
        isFestive
          ? "bg-gradient-to-b from-[#FFFDF9] via-[#FFF9FA] to-[#FFF0F4] border-2 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15 ring-1 sm:ring-2 ring-[#D4AF37]/40 hover:border-[#C59B27] hover:ring-[#D4AF37]/70 hover:shadow-2xl hover:-translate-y-1 p-1.5 sm:p-2.5"
          : "bg-white border border-[#EFE3E7] hover:border-[#D4AF37] hover:shadow-xl hover:-translate-y-1 rounded-2xl overflow-hidden"
      }`}
    >
      {/* Decorative Festive Top Ribbon Glow */}
      {isFestive && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#6A162B] via-[#D4AF37] to-[#6A162B] z-20 rounded-t-2xl sm:rounded-t-3xl" />
      )}

      {/* Image Container with generous luxury proportions */}
      <Link
        href={`/shop/${product.slug}`}
        className={`relative ${
          aspectRatio === "portrait" ? "aspect-[4/5]" : "aspect-square"
        } overflow-hidden block ${
          isFestive
            ? "rounded-xl sm:rounded-2xl bg-white shadow-xs border border-[#E8C568]/40"
            : "bg-[#FCFAF8]"
        }`}
      >
        {/* Primary Image */}
        <img
          src={primaryImage}
          alt={product.name}
          className="product-card-image w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
          loading="lazy"
        />

        {/* Secondary Hover Image */}
        <img
          src={secondaryImage}
          alt={product.name}
          className="product-card-image w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col items-start gap-1 z-10 max-w-[92%] pointer-events-none">
          {/* Festive Special Highlight Badge */}
          {isFestive ? (
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#6A162B] via-[#8F223D] to-[#6A162B] text-[#FFDF78] border border-[#FFDF78]/70 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md flex items-center space-x-1 whitespace-nowrap">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FFDF78] flex-shrink-0" />
              <span>{festDiscount ? `${festDiscount}% FESTIVE OFF` : "Festive Special"}</span>
            </span>
          ) : hasDiscount ? (
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-[#C04E6C] text-white px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm">
              {discountPercent}% OFF
            </span>
          ) : null}

          {product.isBestseller && !isFestive && (
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-[#3A1823] text-[#D4AF37] px-2 py-0.5 rounded-full shadow-sm flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Bestseller</span>
            </span>
          )}

          {product.productType === "customised" && (
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider bg-white/90 text-[#3A1823] px-1.5 sm:px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm border border-[#EFE3E7]">
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
            className={`absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 rounded-full shadow-md flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transform translate-y-0 sm:translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-10 active:scale-95 ${
              isFestive
                ? "bg-gradient-to-r from-[#6A162B] to-[#8F223D] text-[#FFDF78] hover:bg-[#D4AF37] hover:text-[#2E0B16] border border-[#FFDF78]/60 w-8 h-8 sm:w-10 sm:h-10"
                : "bg-white/95 text-[#3A1823] hover:bg-[#3A1823] hover:text-white w-8 h-8 sm:w-9 sm:h-9"
            }`}
            title="Quick Add to Cart"
            aria-label="Add to Cart"
          >
            {added ? (
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2E7D32]" />
            ) : (
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>
        )}
      </Link>

      {/* Details */}
      <div
        className={`flex-1 flex flex-col justify-between ${
          isFestive
            ? "p-2.5 sm:p-4 space-y-1.5 sm:space-y-2.5 bg-white/85 rounded-xl sm:rounded-2xl mt-1.5 sm:mt-2 border border-[#E8C568]/30 shadow-xs"
            : "p-2.5 sm:p-4 space-y-1.5 sm:space-y-2"
        }`}
      >
        <div className="min-w-0">
          {product.category && (
            <span
              className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider truncate block mb-0.5 ${
                isFestive ? "text-[#8C1D38]" : "text-[#8C6E79]"
              }`}
            >
              {product.category.name}
            </span>
          )}
          <Link
            href={`/shop/${product.slug}`}
            className={`font-serif font-semibold line-clamp-1 transition-colors block text-xs sm:text-base ${
              isFestive
                ? "text-[#2D121C] hover:text-[#8C1D38]"
                : "text-[#3A1823] hover:text-[#B84A67]"
            }`}
            title={product.name}
          >
            {product.name}
          </Link>
        </div>

        {/* Pricing & Festival Savings */}
        <div
          className={`flex items-baseline justify-between pt-1.5 sm:pt-2 border-t gap-1 min-w-0 ${
            isFestive ? "border-[#E8C568]/40" : "border-[#FAF0F3]"
          }`}
        >
          <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5 min-w-0">
            <span
              className={`font-black tracking-tight ${
                isFestive
                  ? "text-sm sm:text-lg text-[#6A162B]"
                  : "text-xs sm:text-sm font-bold text-[#3A1823]"
              }`}
            >
              ₹{currentPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span
                className={`text-[10px] sm:text-xs line-through ${
                  isFestive ? "text-[#8C6E79]" : "text-[#AFA0A6]"
                }`}
              >
                ₹{regular.toFixed(2)}
              </span>
            )}
          </div>

          {isFestive && (
            <span className="hidden md:inline-flex items-center space-x-1 text-[9px] font-black text-[#800020] bg-[#FFF0F4] border border-[#D4AF37]/50 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap flex-shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
              <span>{rawFestPct > 0 ? `${rawFestPct}% OFF` : "Festive"}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
