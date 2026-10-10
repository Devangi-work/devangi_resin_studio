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
  const hasDiscount = sale && sale < regular;
  const discountPercent = hasDiscount ? Math.round(((regular - sale!) / regular) * 100) : 0;

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

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E8E0D5] hover:border-[#D4AF37] hover:shadow-lg transition-all duration-300">
      
      {/* Image Container */}
      <Link href={`/shop/${product.slug}`} className="relative aspect-square overflow-hidden bg-[#FAF8F5] block">
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
        <div className="absolute top-3 left-3 flex flex-col space-y-1 z-10">
          {hasDiscount && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#DF4C4C] text-white px-2 py-0.5 rounded-full shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {product.isBestseller && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2C332D] text-[#D4AF37] px-2 py-0.5 rounded-full shadow-sm flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Bestseller</span>
            </span>
          )}
          {product.productType === "customised" && (
            <span className="text-[10px] font-semibold tracking-wider bg-white/90 text-[#2C332D] px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm border border-[#E8E0D5]">
              Personalised
            </span>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="text-xs font-bold text-[#736C66] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-[#E8E0D5]">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick Add overlay button */}
        {!isOutOfStock && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/95 text-[#2C332D] hover:bg-[#2C332D] hover:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-10"
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
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {product.category && (
            <span className="text-[10px] uppercase font-semibold text-[#8C7A72] tracking-widest block mb-1">
              {product.category.name}
            </span>
          )}
          <Link
            href={`/shop/${product.slug}`}
            className="font-serif text-sm font-semibold text-[#2C332D] hover:text-[#B8972E] line-clamp-1 transition-colors block"
          >
            {product.name}
          </Link>
        </div>

        <div className="flex items-baseline space-x-2 pt-1 border-t border-[#F4EBE6]">
          <span className="text-sm font-bold text-[#2C332D]">
            ₹{currentPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-[#A69E96] line-through">
              ₹{regular.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
