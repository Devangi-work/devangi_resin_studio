"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store/cart";
import {
  Sparkles,
  ShieldCheck,
  Truck,
  Heart,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  ArrowRight,
  Upload,
  Gift,
  HelpCircle,
  Clock,
  Layers,
} from "lucide-react";

export interface ProductDetailProps {
  product: any;
  relatedProducts: any[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailProps) {
  const router = useRouter();
  const { addItem, setIsCartOpen } = useCart();

  // Gallery state
  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: "def", imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800", isPrimary: true }];
  const [activeImage, setActiveImage] = useState(images[0]?.imageUrl);

  // Variant state
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);

  // Personalization state
  const [customName, setCustomName] = useState("");
  const [initials, setInitials] = useState("");
  const [selectedColor, setSelectedColor] = useState("Ocean Blue & Gold Leaf");
  const [selectedDesign, setSelectedDesign] = useState("Floral Botanical Inlay");
  const [personalizationNotes, setPersonalizationNotes] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Gift wrap state
  const [giftWrapped, setGiftWrapped] = useState(false);

  // Quantity state
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Pricing calculations
  const baseRegular = Number(product.regularPrice);
  const baseSale = product.salePrice ? Number(product.salePrice) : null;
  const variantAdj = selectedVariant ? Number(selectedVariant.priceAdjustment || 0) : 0;
  const persSurcharge =
    product.enablePersonalization && customName.trim()
      ? Number(product.personalizationSurcharge || 0)
      : 0;

  const currentUnitPrice = (baseSale || baseRegular) + variantAdj + persSurcharge;
  const regularUnitPrice = baseRegular + variantAdj + persSurcharge;
  const hasDiscount = baseSale && baseSale < baseRegular;
  const giftWrapCharge = product.giftWrappingAvailable ? Number(product.giftWrappingCharge || 49) : 0;

  // Stock calculations
  const maxStock = selectedVariant
    ? selectedVariant.inventory
    : product.trackInventory
    ? product.stockQuantity
    : 99;
  const isOutOfStock = product.trackInventory && !product.allowBackorders && maxStock <= 0;

  // Handle reference image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/reference-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setReferenceImageUrl(data.url);
      } else {
        setUploadError(data.error || "Failed to upload reference image.");
      }
    } catch {
      setUploadError("Image upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isOutOfStock) return;

    const personalizationDetails = product.enablePersonalization
      ? {
          customName: customName.trim() || undefined,
          initials: initials.trim() || undefined,
          color: product.customColorEnabled ? selectedColor : undefined,
          design: product.customDesignEnabled ? selectedDesign : undefined,
          notes: personalizationNotes.trim() || undefined,
        }
      : null;

    addItem({
      id: `${product.id}_${selectedVariant?.id || "std"}_${customName || "none"}`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: currentUnitPrice,
      image: activeImage,
      quantity,
      variantId: selectedVariant?.id || null,
      variantName: selectedVariant?.name || null,
      personalizationDetails,
      referenceImageUrl,
      giftWrapped,
      giftWrapCharge: giftWrapped ? giftWrapCharge : 0,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setIsCartOpen(false);
    router.push("/checkout");
  };

  return (
    <div className="space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* ---------------- 1. IMAGE GALLERY ---------------- */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Showcase Image */}
          <div className="aspect-square bg-white rounded-3xl overflow-hidden border border-[#E8E0D5] shadow-sm relative group">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider bg-[#DF4C4C] text-white px-3 py-1 rounded-full shadow-sm">
                Save ₹{(baseRegular - (baseSale || 0)).toFixed(0)}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {images.map((img: any, idx: number) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImage(img.imageUrl)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImage === img.imageUrl
                      ? "border-[#D4AF37] shadow-md scale-95"
                      : "border-[#E8E0D5] opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.altText || product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------------- 2. PRODUCT DETAILS & ACTIONS ---------------- */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Title & Category */}
          <div className="space-y-2 border-b border-[#E8E0D5] pb-4">
            {product.category && (
              <span className="text-xs uppercase font-bold text-[#8C7A72] tracking-widest block">
                {product.category.name}
              </span>
            )}
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C332D] leading-snug">
              {product.name}
            </h1>
            <p className="text-xs text-[#736C66] flex items-center space-x-3">
              <span>SKU: <strong className="text-[#2C332D]">{selectedVariant?.sku || product.sku}</strong></span>
              <span>•</span>
              <span>
                Type:{" "}
                <strong className="text-[#2C332D] capitalize">
                  {product.productType.replace("_", " ")}
                </strong>
              </span>
            </p>
          </div>

          {/* Price & Stock Status */}
          <div className="flex items-baseline justify-between border-b border-[#E8E0D5] pb-4">
            <div className="flex items-baseline space-x-3">
              <span className="font-serif text-3xl font-bold text-[#2C332D]">
                ₹{currentUnitPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-base text-[#A69E96] line-through">
                  ₹{regularUnitPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock pill */}
            <div>
              {isOutOfStock ? (
                <span className="text-xs font-bold text-[#DF4C4C] bg-[#FDF2F2] px-3 py-1 rounded-full border border-[#FADBD8]">
                  Out of Stock
                </span>
              ) : product.productType === "made_to_order" || product.productType === "customised" ? (
                <span className="text-xs font-semibold text-[#B8972E] bg-[#FAF4EC] px-3 py-1 rounded-full flex items-center space-x-1 border border-[#F5E6D3]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Handcrafted on Order ({product.productionTimeDays || 3} Days)</span>
                </span>
              ) : (
                <span className="text-xs font-semibold text-[#2E7D32] bg-[#E8EFE8] px-3 py-1 rounded-full flex items-center space-x-1 border border-[#C5D8C5]">
                  <Check className="w-3.5 h-3.5" />
                  <span>In Stock Ready to Dispatch</span>
                </span>
              )}
            </div>
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-xs text-[#736C66] leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* ---------------- VARIANTS SELECTOR ---------------- */}
          {variants.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-[#2C332D] uppercase tracking-wider block">
                Select Option / Finish
              </label>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`p-3 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                      selectedVariant?.id === v.id
                        ? "border-[#2C332D] bg-white ring-1 ring-[#2C332D] shadow-sm"
                        : "border-[#E8E0D5] bg-[#FAF8F5] hover:bg-white text-[#736C66]"
                    }`}
                  >
                    <span className="font-semibold text-[#2C332D]">{v.name}</span>
                    {Number(v.priceAdjustment) > 0 && (
                      <span className="text-[11px] text-[#B8972E] mt-0.5">
                        +₹{Number(v.priceAdjustment).toFixed(2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- RESIN PERSONALISATION FIELDS ---------------- */}
          {product.enablePersonalization && (
            <div className="bg-white p-5 rounded-2xl border border-[#D4AF37]/50 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-[#F4EBE6] pb-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-serif text-sm font-bold text-[#2C332D]">
                  Customise Your Piece
                </h3>
              </div>

              {product.customizationInstructions && (
                <p className="text-[11px] text-[#8C7A72] italic">
                  Note: {product.customizationInstructions}
                </p>
              )}

              {/* Custom Name / Text */}
              {product.customNameEnabled && (
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Custom Name or Word (Max 20 chars)
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="e.g. Priya / The Sharmas"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              )}

              {/* Custom Initials */}
              {product.customInitialsEnabled && (
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Monogram Initial(s)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. A & S"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs uppercase bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              )}

              {/* Color Theme Selector */}
              {product.customColorEnabled && (
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1.5">
                    Resin Color Palette
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Ocean Blue & Gold Leaf",
                      "Rose Gold & Blush Pink",
                      "Emerald Green & Gold",
                      "Cosmic Lavender & Pearl",
                    ].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        className={`px-3 py-2 text-[11px] rounded-lg text-left border transition-all ${
                          selectedColor === col
                            ? "bg-[#FAF4EC] border-[#B8972E] text-[#2C332D] font-bold"
                            : "bg-[#FAF8F5] border-[#E8E0D5] text-[#736C66]"
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Photo / Reference Upload */}
              {product.customImageUploadEnabled && (
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Upload Your Reference Photograph
                  </label>
                  <div className="border border-dashed border-[#E8E0D5] rounded-xl p-4 text-center bg-[#FAF8F5]">
                    {referenceImageUrl ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img
                            src={referenceImageUrl}
                            alt="Uploaded reference"
                            className="w-12 h-12 object-cover rounded-lg border border-[#E8E0D5]"
                          />
                          <span className="text-xs text-[#2E7D32] font-semibold">Image Uploaded Successfully</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReferenceImageUrl(null)}
                          className="text-xs text-[#DF4C4C] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="w-5 h-5 text-[#8C7A72] mx-auto mb-1" />
                        <span className="text-xs text-[#2C332D] font-medium block">
                          {uploadingImage ? "Uploading to Vercel Blob..." : "Click to upload image (Max 5MB)"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                    )}
                    {uploadError && <p className="text-[11px] text-[#DF4C4C] mt-1">{uploadError}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------- GIFT WRAP OPTION ---------------- */}
          {product.giftWrappingAvailable && (
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E0D5] flex items-center justify-between">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftWrapped}
                  onChange={(e) => setGiftWrapped(e.target.checked)}
                  className="rounded border-[#E8E0D5] text-[#2C332D] focus:ring-[#D4AF37]"
                />
                <Gift className="w-4 h-4 text-[#B8972E]" />
                <span className="text-xs text-[#2C332D] font-medium">
                  Add Boutique Gift Wrapping (+₹{giftWrapCharge})
                </span>
              </label>
            </div>
          )}

          {/* ---------------- QUANTITY & ACTION BUTTONS ---------------- */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-[#E8E0D5] bg-white rounded-xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2 text-[#736C66] hover:text-[#2C332D] disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-[#2C332D]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  disabled={quantity >= maxStock || isOutOfStock}
                  className="p-2 text-[#736C66] hover:text-[#2C332D] disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 px-6 bg-white border-2 border-[#2C332D] text-[#2C332D] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#FAF8F5] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 text-[#2E7D32]" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Buy Now Button */}
            {!isOutOfStock && (
              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 bg-[#2C332D] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#3D473E] shadow-md transition-all flex items-center justify-center space-x-2 group"
              >
                <span>Buy Now with 1-Click</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* ---------------- ACCORDION SPECS ---------------- */}
          <div className="space-y-3 pt-6 border-t border-[#E8E0D5] text-xs">
            <div className="bg-white p-4 rounded-xl border border-[#E8E0D5] space-y-2">
              <h4 className="font-bold text-[#2C332D] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#B8972E]" />
                <span>Materials & Dimensions</span>
              </h4>
              <p className="text-[#736C66] leading-relaxed">
                {product.materials || "Optical grade epoxy resin with high UV stability."}
              </p>
              {product.dimensions && (
                <p className="text-[#736C66]">
                  <strong>Dimensions:</strong> {product.dimensions}
                </p>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8E0D5] space-y-2">
              <h4 className="font-bold text-[#2C332D] flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-[#B8972E]" />
                <span>Shipping & Delivery Policy</span>
              </h4>
              <p className="text-[#736C66] leading-relaxed">
                {product.isFreeShipping
                  ? "Eligible for Complimentary Insured Express Shipping across India."
                  : "Standard insured transit across India takes 4-7 business days."}
              </p>
            </div>

            {product.careInstructions && (
              <div className="bg-white p-4 rounded-xl border border-[#E8E0D5] space-y-2">
                <h4 className="font-bold text-[#2C332D] flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-[#B8972E]" />
                  <span>Resin Care Guide</span>
                </h4>
                <p className="text-[#736C66] leading-relaxed">
                  {product.careInstructions}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- 3. FULL DESCRIPTION ---------------- */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#E8E0D5] shadow-sm space-y-6">
        <h2 className="font-serif text-2xl font-bold text-[#2C332D]">
          Artisan Story & Details
        </h2>
        <div className="text-sm text-[#736C66] leading-relaxed font-light space-y-4">
          <p>{product.description}</p>
        </div>
      </div>

      {/* ---------------- 4. RELATED PRODUCTS ---------------- */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h3 className="font-serif text-2xl font-bold text-[#2C332D]">
            More from this Collection
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel: any) => (
              <div
                key={rel.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#E8E0D5] hover:border-[#D4AF37] transition-all"
              >
                <a href={`/shop/${rel.slug}`} className="block aspect-square overflow-hidden bg-[#FAF8F5]">
                  <img
                    src={rel.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800"}
                    alt={rel.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </a>
                <div className="p-3">
                  <a
                    href={`/shop/${rel.slug}`}
                    className="font-serif text-xs font-semibold text-[#2C332D] hover:text-[#B8972E] line-clamp-1"
                  >
                    {rel.name}
                  </a>
                  <p className="text-xs font-bold text-[#2C332D] mt-1">
                    ₹{Number(rel.salePrice || rel.regularPrice).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
