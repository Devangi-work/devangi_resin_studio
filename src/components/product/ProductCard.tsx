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

  const regular = Number(product.regularPrice);
  const sale = product.salePrice ? Number(product.salePrice) : null;
  const currentPrice = sale || regular;
  const hasDiscount = Boolean(sale && sale < regular);
  const discountPercent = hasDiscount ? (((regular - sale!) / regular) * 100).toFixed(0) : 0;
  const festDiscount = product.festivalDiscountPercentage ? String(product.festivalDiscountPercentage).replace(/%/g, "") : null;

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
      image: primaryImage,
      quantity: 1,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const isFestive = Boolean(product.isFestivalSpecial);

  return (
    <div
      className={`group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 relative ${
        isFestive
          ? "bg-gradient-to-b from-[#FFFDF9] via-[#FFF9F6] to-[#FFF4F8] border-2 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15 ring-2 ring-[#D4AF37]/30 hover:border-[#B8972E] hover:shadow-2xl hover:scale-[1.01]"
          : "bg-white border border-[#EFE3E7] hover:border-[#D4AF37] hover:shadow-lg"
      }`}
    >
      {/* Decorative Festive Top Ribbon Glow */}
      {isFestive && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#800020] via-[#D4AF37] to-[#800020] z-20" />
      )}

      {/* Image Container */}
      <Link href={`/shop/${product.slug}`} className="relative aspect-square overflow-hidden bg-[#FCFAF8] block">
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
            <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#6A162B] via-[#942643] to-[#6A162B] text-[#FFDF78] border border-[#FFDF78]/70 px-2.5 py-0.5 rounded-full shadow-md flex items-center space-x-1 animate-pulse">
              <Sparkles className="w-2.5 h-2.5 text-[#FFDF78] flex-shrink-0" />
              <span>Festive Special</span>
            </span>
          )}

          {/* Festive or Regular Discount Badge */}
          {festDiscount ? (
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-[#3A1823] border border-[#B8972E]/50 px-2.5 py-0.5 rounded-full shadow-sm font-mono flex items-center space-x-1">
              <span>{festDiscount}% FESTIVE OFF</span>
            </span>
          ) : hasDiscount ? (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C04E6C] text-white px-2 py-0.5 rounded-full shadow-sm">
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
            className={`absolute bottom-3 right-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full shadow-md flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transform translate-y-0 sm:translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-10 active:scale-95 ${
              isFestive
                ? "bg-[#6A162B] text-[#FFDF78] hover:bg-[#D4AF37] hover:text-[#3A1823] border border-[#FFDF78]/40"
                : "bg-white/95 text-[#3A1823] hover:bg-[#3A1823] hover:text-white"
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
      <div className={`p-4 flex-1 flex flex-col justify-between space-y-2 ${isFestive ? "bg-[#FFFDF9]" : ""}`}>
        <div>
          {product.category && (
            <span className="text-[10px] uppercase font-semibold text-[#8C6E79] tracking-widest block mb-1">
              {product.category.name}
            </span>
          )}
          <Link
            href={`/shop/${product.slug}`}
            className="font-serif text-sm font-semibold text-[#3A1823] hover:text-[#B84A67] line-clamp-1 transition-colors block"
          >
            {product.name}
          </Link>
        </div>

        <div className={`flex items-baseline justify-between pt-2 border-t ${isFestive ? "border-[#F4DEC6]" : "border-[#FAF0F3]"}`}>
          <div className="flex items-baseline space-x-2">
            <span className={`font-bold ${isFestive ? "text-base text-[#6A162B] font-extrabold" : "text-sm text-[#3A1823]"}`}>
              ₹{currentPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-[#AFA0A6] line-through">
                ₹{regular.toFixed(2)}
              </span>
            )}
          </div>
          {isFestive && (
            <span className="text-[10px] font-bold text-[#A83250] flex items-center space-x-0.5 tracking-wider uppercase">
              <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
              <span>Festive Offer</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
