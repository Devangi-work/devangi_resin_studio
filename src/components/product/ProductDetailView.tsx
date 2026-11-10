"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store/cart";
import { computeFestivePrice } from "@/lib/festival";
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
  Star,
  MessageCircle,
  MapPin,
  X,
} from "lucide-react";
import { ProductReviewsSection } from "@/components/product/ProductReviewsSection";
import { buildSingleProductWhatsAppMessage, getWhatsAppUrl } from "@/lib/whatsapp";
import { resolveShippingCharge } from "@/lib/shipping";
import DynamicUpiPaymentModal from "@/components/payment/DynamicUpiPaymentModal";

export interface ProductDetailProps {
  product: any;
  relatedProducts: any[];
  settings?: any;
}

export function ProductDetailView({ product, relatedProducts, settings: initialSettings }: ProductDetailProps) {
  const router = useRouter();
  const { addItem, removeItem, items, setIsCartOpen } = useCart();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalData, setPaymentModalData] = useState<any>(null);
  const [orderLaterNotice, setOrderLaterNotice] = useState<string | null>(null);

  // Gallery state - ensure primary image is selected first
  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: "def", imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800", isPrimary: true }];
  const primaryImgUrl = images.find((img: any) => img.isPrimary)?.imageUrl || images[0]?.imageUrl;
  const [activeImage, setActiveImage] = useState(primaryImgUrl);

  // Variant state: Multi-title variant groups or legacy flat variants
  const hasVariantGroups = Array.isArray(product.variantGroups) && product.variantGroups.length > 0;
  const variantGroups = product.variantGroups || [];
  const variants = product.variants || [];

  // Selected variants array allowing multiple variant selections across/within groups
  const [selectedVariants, setSelectedVariants] = useState<Array<{
    id: string;
    name: string;
    priceAdjustment: number;
    groupTitle: string;
    skuModifier?: string;
  }>>(() => {
    const init: Array<any> = [];
    if (hasVariantGroups) {
      variantGroups.forEach((group: any) => {
        (group.options || []).forEach((opt: any) => {
          if (opt.isDefault) {
            init.push({
              id: opt.id || opt.name,
              name: opt.name,
              priceAdjustment: Number(opt.priceAdjustment) || 0,
              groupTitle: group.title || "Option",
              skuModifier: opt.skuModifier,
            });
          }
        });
      });
    } else if (variants.length > 0) {
      const def = variants.find((v: any) => v.isDefault);
      if (def) {
        init.push({
          id: def.id || def.name,
          name: def.name,
          priceAdjustment: Number(def.priceAdjustment) || 0,
          groupTitle: "Option",
        });
      }
    }
    return init;
  });

  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);

  const toggleVariantOption = (group: any, opt: any) => {
    const optId = opt.id || opt.name;
    setSelectedVariants((prev) => {
      const exists = prev.some((v) => v.id === optId);
      if (exists) {
        return prev.filter((v) => v.id !== optId);
      } else {
        return [
          ...prev,
          {
            id: optId,
            name: opt.name,
            priceAdjustment: Number(opt.priceAdjustment) || 0,
            groupTitle: group?.title || "Option",
            skuModifier: opt.skuModifier,
          },
        ];
      }
    });
  };

  const toggleFlatVariant = (v: any) => {
    const vId = v.id || v.name;
    setSelectedVariants((prev) => {
      const exists = prev.some((x) => x.id === vId);
      if (exists) {
        return prev.filter((x) => x.id !== vId);
      } else {
        return [
          ...prev,
          {
            id: vId,
            name: v.name,
            priceAdjustment: Number(v.priceAdjustment) || 0,
            groupTitle: "Option",
          },
        ];
      }
    });
  };

  // Available Resin Color Palette from admin configuration
  const availableColors = Array.isArray(product.customColorPalette) && product.customColorPalette.length > 0
    ? product.customColorPalette
    : [
        "Ocean Blue & Gold Leaf",
        "Rose Gold & Blush Pink",
        "Emerald Green & Gold",
        "Cosmic Lavender & Pearl",
      ];

  // Personalization state
  const [customName, setCustomName] = useState("");
  const [initials, setInitials] = useState("");
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || "Rose Gold & Blush Pink");
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
  const baseRegular = Number(product.regularPrice) || 0;
  const baseSale = product.salePrice ? Number(product.salePrice) : null;
  const isFestive = Boolean(product.isFestivalSpecial);

  const festiveCalc = computeFestivePrice(baseRegular, {
    isFestivalSpecial: product.isFestivalSpecial,
    festivalDiscountType: product.festivalDiscountType,
    festivalDiscountPercentage: product.festivalDiscountPercentage,
    festivalDiscountAmount: product.festivalDiscountAmount,
    salePrice: product.salePrice,
  });

  const discountedBase = festiveCalc.discountedPrice;
  const festDiscountBadge = festiveCalc.discountBadge;
  const festDiscountAmount = festiveCalc.discountAmount;

  const hasSelectedVariants = selectedVariants.length > 0;
  const variantsSum = hasSelectedVariants
    ? selectedVariants.reduce((acc: number, cur: any) => acc + (Number(cur?.priceAdjustment) || 0), 0)
    : 0;

  const hasCustomization = Boolean(
    product.enablePersonalization && (
      product.customColorEnabled ||
      product.customImageUploadEnabled ||
      product.customNameEnabled ||
      product.customInitialsEnabled
    )
  );

  const persSurcharge =
    (product.enablePersonalization || product.customNameEnabled) && customName.trim()
      ? Number(product.personalizationSurcharge || 0)
      : 0;

  // When variant(s) are selected:
  // - Selling price (currentUnitPrice) takes the variant price (+ personalization surcharge).
  // - Actual price (regularUnitPrice) takes the actual/regular price from pricing (+ personalization surcharge).
  const currentUnitPrice = hasSelectedVariants
    ? variantsSum + persSurcharge
    : discountedBase + persSurcharge;

  const regularUnitPrice = hasSelectedVariants
    ? (baseSale && baseSale > 0 && baseRegular > baseSale
        ? Math.max(baseRegular, variantsSum + (baseRegular - baseSale))
        : isFestive && festDiscountAmount > 0
        ? Math.max(baseRegular, variantsSum + festDiscountAmount)
        : Math.max(baseRegular, variantsSum)) + persSurcharge
    : baseRegular + persSurcharge;

  const hasDiscount = regularUnitPrice > currentUnitPrice;
  const savedAmount = hasDiscount ? regularUnitPrice - currentUnitPrice : 0;

  const giftWrapCharge = product.giftWrappingAvailable ? Number(product.giftWrappingCharge || 49) : 0;

  const getSelectedVariantsSummary = () => {
    if (selectedVariants.length === 0) {
      return selectedVariant ? selectedVariant.name : null;
    }
    return selectedVariants
      .map((s: any) => `${s.groupTitle}: ${s.name}${Number(s.priceAdjustment) > 0 ? ` (₹${Number(s.priceAdjustment).toFixed(2)})` : ""}`)
      .join(" + ");
  };

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

    const variantSummary = getSelectedVariantsSummary();
    const primaryVariantId = selectedVariants.length > 0
      ? selectedVariants.map((v: any) => v.id).join("_")
      : selectedVariant?.id || null;

    const personalizationDetails = (hasCustomization || selectedVariants.length > 0)
      ? {
          customName: customName.trim() || undefined,
          initials: initials.trim() || undefined,
          color: product.customColorEnabled ? selectedColor : undefined,
          design: product.customDesignEnabled ? selectedDesign : undefined,
          notes: personalizationNotes.trim() || undefined,
          selectedVariants: selectedVariants.length > 0 ? selectedVariants : undefined,
        }
      : undefined;

    addItem({
      id: `${product.id}_${primaryVariantId || "std"}_${customName || "none"}`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: currentUnitPrice,
      originalPrice: hasDiscount ? regularUnitPrice : undefined,
      isFestivalSpecial: isFestive,
      festivalDiscountType: product.festivalDiscountType || "percentage",
      festivalDiscountPercentage: product.festivalDiscountPercentage || null,
      festivalDiscountAmount: product.festivalDiscountAmount || null,
      image: activeImage,
      quantity,
      variantId: primaryVariantId,
      variantName: variantSummary,
      personalizationDetails,
      referenceImageUrl,
      giftWrapped,
      giftWrapCharge: giftWrapped ? giftWrapCharge : 0,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Customer auth & Admin WhatsApp state
  const [customer, setCustomer] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>(initialSettings || null);
  const [adminPhone, setAdminPhone] = useState("+91 9967313355");
  const [redirectingWhatsApp, setRedirectingWhatsApp] = useState(false);

  const configuredCityRates: Array<{ id: string; name: string; charge: number | string }> =
    Array.isArray(siteSettings?.cityShippingRates) ? siteSettings.cityShippingRates : [];

  useEffect(() => {
    // 1. Check customer session & profile shipping details
    fetch("/api/customer/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.customer) {
          setCustomer(data.customer);
        }
      })
      .catch(() => {});

    // 2. Fetch site settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((s) => {
        if (s && !s.error) {
          setSiteSettings(s);
          if (s?.whatsappNumber || s?.contactPhone) {
            setAdminPhone(s.whatsappNumber || s.contactPhone);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Automatically determine city and shipping rate from the customer's completed profile
  const userCity = (customer?.city || customer?.state || "").trim();

  const shippingInfo = resolveShippingCharge({
    subtotal: currentUnitPrice,
    cityName: userCity || null,
    stateName: customer?.state || null,
    postalCode: customer?.postalCode || null,
    cityRates: configuredCityRates,
    defaultShippingCharge: siteSettings?.defaultShippingCharge,
    freeShippingThreshold: siteSettings?.freeShippingThreshold,
    isProductFreeShipping: Boolean(product.isFreeShipping),
  });

  const isFreeShipping = shippingInfo.isFree;
  const currentShippingFee = shippingInfo.charge;
  const freeThreshold = shippingInfo.freeShippingThreshold;
  const defaultShipFee = shippingInfo.defaultShippingCharge;
  const matchedRate = shippingInfo.matchedCityName
    ? configuredCityRates.find(
        (r) => r.name.toLowerCase() === shippingInfo.matchedCityName?.toLowerCase()
      ) || { name: shippingInfo.matchedCityName }
    : null;

  const triggerWhatsAppRedirect = async (cust: any, customSelections?: any) => {
    const qty = customSelections?.quantity || quantity;
    const variantSummary = getSelectedVariantsSummary();
    const vName = customSelections?.variantName !== undefined
      ? customSelections.variantName
      : variantSummary;
    const refImg = customSelections?.referenceImageUrl !== undefined
      ? customSelections.referenceImageUrl
      : referenceImageUrl;
    const isGift = customSelections?.giftWrapped !== undefined
      ? customSelections.giftWrapped
      : giftWrapped;

    const activeSelectedVariants = customSelections?.selectedVariants || selectedVariants;

    const pers = customSelections?.personalizationDetails !== undefined
      ? customSelections.personalizationDetails
      : ((hasCustomization || activeSelectedVariants.length > 0)
          ? {
              customName: customName.trim() || undefined,
              initials: initials.trim() || undefined,
              color: product.customColorEnabled ? selectedColor : undefined,
              design: product.customDesignEnabled ? selectedDesign : undefined,
              notes: personalizationNotes.trim() || undefined,
              selectedVariants: activeSelectedVariants.length > 0 ? activeSelectedVariants : undefined,
            }
          : undefined);

    const productSubtotal = (currentUnitPrice + (isGift ? giftWrapCharge : 0)) * qty;
    const targetCity = (cust?.city || cust?.state || customer?.city || customer?.state || userCity || "").trim();
    const shipRes = resolveShippingCharge({
      subtotal: productSubtotal,
      cityName: targetCity || null,
      stateName: cust?.state || customer?.state || null,
      postalCode: cust?.postalCode || customer?.postalCode || null,
      cityRates: configuredCityRates,
      defaultShippingCharge: siteSettings?.defaultShippingCharge,
      freeShippingThreshold: siteSettings?.freeShippingThreshold,
      isProductFreeShipping: Boolean(product.isFreeShipping),
    });
    const shippingFee = shipRes.isFree ? 0 : shipRes.charge;
    const finalAmount = productSubtotal + shippingFee;

    setPaymentModalData({
      cust: cust || customer,
      qty,
      vName,
      refImg,
      isGift,
      pers,
      activeSelectedVariants,
      productSubtotal,
      shippingFee,
      finalAmount,
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaidSubmit = async (paymentReference: string, screenshotUrl?: string | null) => {
    if (!paymentModalData) return;
    const {
      cust,
      qty,
      vName,
      refImg,
      isGift,
      pers,
      activeSelectedVariants,
      productSubtotal,
      shippingFee,
      finalAmount,
    } = paymentModalData;

    let createdOrderNumber: string | null = null;
    try {
      const orderRes = await fetch("/api/orders/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              productId: product.id,
              name: product.name,
              price: currentUnitPrice,
              quantity: qty,
              variantId: activeSelectedVariants?.length > 0
                ? activeSelectedVariants.map((v: any) => v.id).join("_")
                : selectedVariant?.id || null,
              variantName: vName,
              sku: product.sku,
              image: activeImage,
              personalizationDetails: pers,
              referenceImageUrl: refImg,
              giftWrapped: isGift,
              giftWrapCharge: isGift ? giftWrapCharge : 0,
            },
          ],
          subtotal: productSubtotal,
          shippingCharge: shippingFee,
          finalTotal: finalAmount,
          paymentReference,
          paymentScreenshotUrl: screenshotUrl || null,
          orderNotes: "1-Click Buy via Dynamic UPI QR",
        }),
      });
      const orderData = await orderRes.json();
      if (orderData?.orderNumber) {
        createdOrderNumber = orderData.orderNumber;
      }
    } catch (e) {
      console.error("Failed to record WhatsApp order:", e);
    }

    // Cart management for Buy with 1 Click: Remove ONLY the purchased product if present in cart
    const matchingCartItems = items.filter((i) => i.productId === product.id);
    matchingCartItems.forEach((it) => removeItem(it.id));

    const message = buildSingleProductWhatsAppMessage({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
      },
      variantName: vName,
      unitPrice: currentUnitPrice,
      quantity: qty,
      giftWrapped: isGift,
      giftWrapCharge,
      personalizationDetails: pers,
      referenceImageUrl: refImg,
      customer: cust || customer,
      orderNumber: createdOrderNumber,
      paymentReference,
      paymentStatus: "Pending Verification",
      paymentScreenshotUrl: screenshotUrl || null,
      shippingCharge: shippingFee,
      finalTotal: finalAmount,
    });

    const url = getWhatsAppUrl(adminPhone, message);
    return {
      orderNumber: createdOrderNumber,
      whatsappUrl: url,
    };
  };

  const handleWillOrderLater = () => {
    // Buy with 1 Click: Add the selected product to the cart.
    // If the product already exists in the cart, do not create a duplicate entry.
    // Retain the existing product quantity. Do not modify other cart items.
    const alreadyInCart = items.some((i) => i.productId === product.id);
    if (!alreadyInCart) {
      addItem({
        id: `${product.id}_${paymentModalData?.vName || "default"}_${Date.now()}`,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: currentUnitPrice,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
        image: activeImage,
        quantity: paymentModalData?.qty || quantity,
        variantName: paymentModalData?.vName || getSelectedVariantsSummary(),
        personalizationDetails: paymentModalData?.pers,
        referenceImageUrl: paymentModalData?.refImg || referenceImageUrl,
        giftWrapped: paymentModalData?.isGift !== undefined ? paymentModalData.isGift : giftWrapped,
        giftWrapCharge: giftWrapCharge,
      });
    }
    setIsPaymentModalOpen(false);
    setOrderLaterNotice("Your items have been saved in your cart! You can continue shopping and place your order whenever you're ready.");
    setTimeout(() => setOrderLaterNotice(null), 6000);
  };

  // If redirected back from login with ?buy1click=true
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("buy1click") === "true") {
      fetch("/api/customer/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.authenticated && data?.customer) {
            setCustomer(data.customer);

            let restored: any = null;
            try {
              const savedStr = sessionStorage.getItem(`pending_buy1click_${product.id}`);
              if (savedStr) {
                const saved = JSON.parse(savedStr);
                restored = saved;
                if (saved.quantity) setQuantity(saved.quantity);
                if (saved.customName) setCustomName(saved.customName);
                if (saved.initials) setInitials(saved.initials);
                if (saved.selectedColor) setSelectedColor(saved.selectedColor);
                if (saved.selectedDesign) setSelectedDesign(saved.selectedDesign);
                if (saved.personalizationNotes) setPersonalizationNotes(saved.personalizationNotes);
                if (saved.referenceImageUrl) setReferenceImageUrl(saved.referenceImageUrl);
                if (saved.giftWrapped !== undefined) setGiftWrapped(saved.giftWrapped);
                if (saved.selectedVariants && Array.isArray(saved.selectedVariants)) {
                  setSelectedVariants(saved.selectedVariants);
                }
                sessionStorage.removeItem(`pending_buy1click_${product.id}`);
              }
            } catch {}

            window.history.replaceState({}, "", window.location.pathname);
            triggerWhatsAppRedirect(data.customer, restored);
          }
        })
        .catch(() => {});
    }
  }, [product.id, adminPhone, currentUnitPrice, giftWrapCharge]);

  const handleBuyNow = async () => {
    // 1. Check if logged in
    try {
      const res = await fetch("/api/customer/me");
      const data = await res.json();
      if (data?.authenticated && data?.customer) {
        setCustomer(data.customer);
        triggerWhatsAppRedirect(data.customer);
        return;
      }
    } catch {}

    // 2. Not logged in -> save selections in sessionStorage
    try {
      sessionStorage.setItem(
        `pending_buy1click_${product.id}`,
        JSON.stringify({
          quantity,
          variantName: getSelectedVariantsSummary(),
          selectedVariants,
          customName,
          initials,
          selectedColor,
          selectedDesign,
          personalizationNotes,
          referenceImageUrl,
          giftWrapped,
          personalizationDetails: (hasCustomization || selectedVariants.length > 0)
            ? {
                customName: customName.trim() || undefined,
                initials: initials.trim() || undefined,
                color: product.customColorEnabled ? selectedColor : undefined,
                design: product.customDesignEnabled ? selectedDesign : undefined,
                notes: personalizationNotes.trim() || undefined,
                selectedVariants: selectedVariants.length > 0 ? selectedVariants : undefined,
              }
            : undefined,
        })
      );
    } catch {}

    // 3. Redirect to login page with return url to this product page
    const returnUrl = `/shop/${product.slug}?buy1click=true`;
    router.push(`/account/login?redirect=${encodeURIComponent(returnUrl)}`);
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
            {isFestive ? (
              <span className="absolute top-4 left-4 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#6A162B] via-[#8F223D] to-[#6A162B] text-[#FFDF78] border border-[#FFDF78]/70 px-3.5 py-1.5 rounded-full shadow-lg flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFDF78]" />
                <span>{festDiscountBadge ? `${festDiscountBadge} FESTIVE` : "Festive Special"}</span>
              </span>
            ) : hasDiscount ? (
              <span className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider bg-[#DF4C4C] text-white px-3 py-1 rounded-full shadow-sm">
                Save ₹{savedAmount.toFixed(0)}
              </span>
            ) : null}
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
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#736C66]">
              <a
                href="#product-reviews"
                className="flex items-center space-x-1.5 text-xs text-[#8C7A72] hover:text-[#B8972E] transition-colors group"
              >
                <div className="flex items-center text-[#D4AF37]">
                  <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
                  <span className="font-bold text-xs text-[#2C332D] ml-1">Reviews</span>
                </div>
                <span>•</span>
                <span className="underline group-hover:text-[#B8972E]">Verified Customer Feedback</span>
              </a>
              <span>•</span>
              <span>SKU: <strong className="text-[#2C332D]">{selectedVariants.length > 0 && selectedVariants[0].skuModifier ? `${product.sku}-${selectedVariants.map((v: any) => v.skuModifier || v.name).join("-")}` : selectedVariant?.sku || product.sku}</strong></span>
              <span>•</span>
              <span>
                Type:{" "}
                <strong className="text-[#2C332D] capitalize">
                  {product.productType.replace("_", " ")}
                </strong>
              </span>
            </div>
          </div>

          {/* Price & Stock Status */}
          <div className="flex items-baseline justify-between border-b border-[#E8E0D5] pb-4">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-serif text-3xl font-bold text-[#2C332D]">
                ₹{currentUnitPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-[#A69E96] line-through font-medium">
                    ₹{regularUnitPrice.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-[#2E7D32] bg-[#E8EFE8] px-2.5 py-0.5 rounded-full">
                    Save ₹{savedAmount.toFixed(0)} ({Math.round((savedAmount / regularUnitPrice) * 100)}% off)
                  </span>
                </>
              )}
              {isFestive && (
                <span className="text-xs font-black uppercase tracking-wider bg-[#FFF0F4] text-[#800020] border border-[#D4AF37]/50 px-2.5 py-0.5 rounded-full shadow-xs flex items-center space-x-1 font-mono">
                  <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                  <span>{festDiscountBadge ? `${festDiscountBadge} FESTIVE DEAL` : "Festive Special"}</span>
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

          {/* ---------------- VARIANTS SELECTOR (MULTI-TITLE GROUPS & SINGLE) ---------------- */}
          {hasVariantGroups ? (
            <div className="space-y-4 pt-2">
              {variantGroups.map((group: any, gIdx: number) => {
                const groupSelections = selectedVariants.filter((v: any) => v.groupTitle === group.title);
                return (
                  <div key={group.id || gIdx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#2C332D] uppercase tracking-wider block">
                        {group.title || `Variant Category ${gIdx + 1}`}
                      </label>
                      {groupSelections.length > 0 && (
                        <span className="text-[11px] text-[#B8972E] font-semibold">
                          Selected: {groupSelections.map((v: any) => v.name).join(", ")}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(group.options || []).map((opt: any, oIdx: number) => {
                        const isSelected = selectedVariants.some((v: any) => v.id === (opt.id || opt.name));
                        return (
                          <button
                            key={opt.id || oIdx}
                            type="button"
                            onClick={() => toggleVariantOption(group, opt)}
                            className={`p-3 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                              isSelected
                                ? "border-[#2C332D] bg-[#FAF8F5] ring-2 ring-[#2C332D] shadow-xs"
                                : "border-[#E8E0D5] bg-white hover:border-[#D4AF37] text-[#736C66]"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-semibold text-[#2C332D]">{opt.name}</span>
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-[#2C332D]" />
                              )}
                            </div>
                            {Number(opt.priceAdjustment) > 0 ? (
                              <span className="text-[11px] text-[#B8972E] font-semibold mt-1">
                                ₹{Number(opt.priceAdjustment).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#8C7A72] mt-1">Included</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : variants.length > 0 ? (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-[#2C332D] uppercase tracking-wider block">
                Select Option / Finish
              </label>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v: any) => {
                  const isSelected = selectedVariants.some((x: any) => x.id === (v.id || v.name));
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleFlatVariant(v)}
                      className={`p-3 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? "border-[#2C332D] bg-white ring-2 ring-[#2C332D] shadow-sm font-semibold"
                          : "border-[#E8E0D5] bg-[#FAF8F5] hover:bg-white text-[#736C66]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-[#2C332D]">{v.name}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#2C332D]" />
                        )}
                      </div>
                      {Number(v.priceAdjustment) > 0 && (
                        <span className="text-[11px] text-[#B8972E] font-semibold mt-0.5">
                          ₹{Number(v.priceAdjustment).toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* ---------------- RESIN PERSONALISATION FIELDS ---------------- */}
          {hasCustomization && (
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#2C332D] block">
                      Resin Color Palette
                    </label>
                    <span className="text-[11px] text-[#B8972E] font-semibold">
                      {selectedColor}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableColors.map((col: string) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        className={`px-3 py-2 text-[11px] rounded-lg text-left border transition-all ${
                          selectedColor === col
                            ? "bg-[#FAF4EC] border-[#B8972E] text-[#2C332D] font-bold shadow-xs"
                            : "bg-[#FAF8F5] border-[#E8E0D5] text-[#736C66] hover:bg-white"
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
                          accept="image/*,.heic,.heif,image/heic,image/heif"
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

            {/* Buy in 1 Click via WhatsApp */}
            {!isOutOfStock && (
              <button
                onClick={handleBuyNow}
                disabled={redirectingWhatsApp}
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-2 group cursor-pointer disabled:opacity-60"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>{redirectingWhatsApp ? "Opening WhatsApp..." : "Buy in 1 Click via WhatsApp"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* ---------------- 2.6 CITY-BASED SHIPPING & DELIVERY ESTIMATOR ---------------- */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF8F5] to-[#FCFAF8] border border-[#E8E0D5] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-[#FAF0F3] text-[#B84A67] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#2C332D]">
                    Shipping &amp; Delivery to Your City
                  </h4>
                  <p className="text-[10px] text-[#736C66]">
                    {matchedRate
                      ? `Special city rate applied for ${matchedRate.name}`
                      : "Direct insured transit with door delivery"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                {isFreeShipping ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-[#E8EFE8] text-[#2E7D32]">
                    FREE DELIVERY
                  </span>
                ) : (
                  <span className="text-xs font-black text-[#8C1D38]">
                    Shipping: ₹{currentShippingFee.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* User Profile Shipping Info (Auto-detected from profile) */}
            <div className="pt-2 border-t border-[#E8E0D5]/60 flex items-center justify-between text-xs">
              <span className="flex items-center space-x-1.5 text-[#736C66]">
                <MapPin className="w-3.5 h-3.5 text-[#B8972E] flex-shrink-0" />
                <span>
                  {customer?.city ? (
                    <>
                      Deliver to: <strong className="text-[#2C332D]">{customer.city}</strong>
                    </>
                  ) : customer ? (
                    <span>No delivery address saved in profile</span>
                  ) : (
                    <span>Delivering across India</span>
                  )}
                </span>
              </span>
              {customer?.city && shippingInfo.matchedCityName ? (
                <span className="text-[10px] bg-[#FAF0F3] text-[#B84A67] px-2 py-0.5 rounded font-semibold border border-[#EFE3E7]">
                  {shippingInfo.matchedCityName} Rate (₹{currentShippingFee.toFixed(0)})
                </span>
              ) : !customer ? (
                <Link
                  href="/account/login?redirect=/shop"
                  className="text-[10px] text-[#B8972E] hover:underline font-semibold"
                >
                  Sign In
                </Link>
              ) : !customer.city ? (
                <Link
                  href="/account/profile"
                  className="text-[10px] text-[#B8972E] hover:underline font-semibold"
                >
                  + Add Address
                </Link>
              ) : null}
            </div>

            {/* Threshold & Guarantee Strip */}
            <div className="text-[10px] text-[#736C66] flex items-center justify-between pt-1">
              {freeThreshold > 0 ? (
                <span>Free delivery on orders above ₹{freeThreshold}</span>
              ) : (
                <span>Direct insured doorstep transit</span>
              )}
              <span className="text-[#2E7D32] font-semibold">Dispatched in 2-4 business days</span>
            </div>
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
              <h4 className="font-bold text-[#2C332D] flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-[#B8972E]" />
                  <span>Shipping & Delivery Policy</span>
                </span>
                <span className="text-[11px] font-black text-[#8C1D38]">
                  {isFreeShipping
                    ? "FREE Delivery"
                    : `₹${currentShippingFee.toFixed(2)}${userCity ? ` to ${userCity}` : ""}`}
                </span>
              </h4>
              <p className="text-[#736C66] leading-relaxed">
                {product.isFreeShipping
                  ? "Eligible for Complimentary Insured Express Shipping across India."
                  : `Shipping charge for ${userCity ? userCity : "your location"} is ₹${currentShippingFee.toFixed(2)}.${freeThreshold > 0 ? ` Complimentary free delivery applies automatically on all orders over ₹${freeThreshold}.` : ""}`}
              </p>
              {configuredCityRates.length > 0 && (
                <div className="pt-1 text-[11px] text-[#736C66]">
                  <strong>Configured City Rates: </strong>
                  {configuredCityRates.map((r, i) => (
                    <span key={r.id || r.name}>
                      {r.name} (₹{Number(r.charge).toFixed(0)}){i < configuredCityRates.length - 1 ? ", " : ""}
                    </span>
                  ))}
                  <span> (Rest of India: ₹{defaultShipFee.toFixed(0)})</span>
                </div>
              )}
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

      {/* ---------------- 3.5 PRODUCT REVIEWS SECTION ---------------- */}
      <ProductReviewsSection productId={product.id} productName={product.name} />

      {/* ---------------- 4. RELATED PRODUCTS ---------------- */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h3 className="font-serif text-2xl font-bold text-[#2C332D]">
            More from {product.category?.name ? product.category.name : "this Collection"}
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
                  {(() => {
                    const relCalc = computeFestivePrice(rel.regularPrice, rel);
                    return relCalc.hasDiscount ? (
                      <div className="flex items-baseline space-x-1.5 mt-1">
                        <p className={`text-xs font-bold ${rel.isFestivalSpecial ? "text-[#6A162B]" : "text-[#2C332D]"}`}>
                          ₹{relCalc.discountedPrice.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-[#A69E96] line-through">
                          ₹{Number(rel.regularPrice).toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-[#2C332D] mt-1">
                        ₹{Number(rel.regularPrice).toFixed(2)}
                      </p>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Toast for Will Order Later */}
      {orderLaterNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#2C332D] text-white p-4 rounded-2xl shadow-2xl border border-[#D4AF37]/50 flex items-start space-x-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-6 h-6 rounded-full bg-[#2E7D32] flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-[#FFDF78]">Item Saved in Cart</p>
            <p className="mt-0.5 text-white/90 leading-relaxed">{orderLaterNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setOrderLaterNotice(null)}
            className="p-1 text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dynamic UPI Payment Popup */}
      {isPaymentModalOpen && paymentModalData && (
        <DynamicUpiPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentModalData(null);
          }}
          payableAmount={paymentModalData.finalAmount}
          subtotal={paymentModalData.productSubtotal}
          shippingCharge={paymentModalData.shippingFee}
          upiId={siteSettings?.upiId}
          accountHolderName={siteSettings?.accountHolderName}
          storeName={siteSettings?.storeName || "Devangi Resin Studio"}
          customer={paymentModalData.cust || customer}
          itemsSummary={[
            {
              name: product.name,
              quantity: paymentModalData.qty,
              price: currentUnitPrice,
              variantName: paymentModalData.vName,
            },
          ]}
          onPaidSubmit={handlePaidSubmit}
          onWillOrderLater={handleWillOrderLater}
        />
      )}
    </div>
  );
}
