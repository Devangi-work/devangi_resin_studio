"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Trash2,
  Plus,
  Sparkles,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Star,
  Layers,
  ArrowLeft,
  Gift,
  Palette,
  X,
} from "lucide-react";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";

export interface ProductFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<"general" | "pricing" | "images" | "variants" | "customization" | "shipping">("general");

  // Form fields
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || "",
    sku: initialData?.sku || "",
    productType: initialData?.productType || "ready_made",
    status: initialData?.status || "published",
    isFeatured: initialData?.isFeatured || false,
    isBestseller: initialData?.isBestseller || false,
    isFestivalSpecial: initialData?.isFestivalSpecial || false,
    festivalDiscountPercentage: initialData?.festivalDiscountPercentage || "",

    regularPrice: initialData?.regularPrice || "",
    salePrice: initialData?.salePrice || "",
    costPrice: initialData?.costPrice || "",
    currency: initialData?.currency || "INR",

    trackInventory: initialData?.trackInventory !== undefined ? initialData.trackInventory : true,
    stockQuantity: initialData?.stockQuantity !== undefined ? initialData.stockQuantity : 10,
    lowStockThreshold: initialData?.lowStockThreshold !== undefined ? initialData.lowStockThreshold : 3,
    allowBackorders: initialData?.allowBackorders || false,

    enableVariants: initialData?.enableVariants || false,
    variants: initialData?.variants || [],
    variantGroups: Array.isArray(initialData?.variantGroups) && initialData.variantGroups.length > 0
      ? initialData.variantGroups
      : initialData?.variants?.length
        ? [
          {
            id: `vg_${Date.now()}`,
            title: "Options & Finishes",
            options: initialData.variants.map((v: any, idx: number) => ({
              id: v.id || `opt_${idx}`,
              name: v.name,
              priceAdjustment: Number(v.priceAdjustment) || 0,
              skuModifier: v.sku?.split("-").pop() || "",
              inStock: v.isActive !== false,
            })),
          },
        ]
        : [],

    enablePersonalization: initialData?.enablePersonalization || false,
    customNameEnabled: initialData?.customNameEnabled || false,
    customInitialsEnabled: initialData?.customInitialsEnabled || false,
    customColorEnabled: initialData?.customColorEnabled || false,
    customColorPalette: Array.isArray(initialData?.customColorPalette) && initialData.customColorPalette.length > 0
      ? initialData.customColorPalette
      : [
        "Ocean Blue & Gold Leaf",
        "Rose Gold & Blush Pink",
        "Emerald Green & Gold",
        "Cosmic Lavender & Pearl",
      ],
    customDesignEnabled: initialData?.customDesignEnabled || false,
    customImageUploadEnabled: initialData?.customImageUploadEnabled || false,
    personalizationSurcharge: initialData?.personalizationSurcharge || "0.00",
    customizationInstructions: initialData?.customizationInstructions || "",
    productionTimeDays: initialData?.productionTimeDays || 3,
    giftWrappingAvailable: initialData?.giftWrappingAvailable !== undefined ? initialData.giftWrappingAvailable : true,
    giftWrappingCharge: initialData?.giftWrappingCharge || "49.00",
    customOrderNotesEnabled: initialData?.customOrderNotesEnabled !== undefined ? initialData.customOrderNotesEnabled : true,

    weight: initialData?.weight || "",
    dimensions: initialData?.dimensions || "",
    shippingClass: initialData?.shippingClass || "standard",
    isFreeShipping: initialData?.isFreeShipping || false,
    careInstructions: initialData?.careInstructions || "",
    materials: initialData?.materials || "Optical UV resin, mica pigments, gold leaf",
    dispatchTimeDays: initialData?.dispatchTimeDays || 2,

    seoTitle: initialData?.seoTitle || "",
    seoDescription: initialData?.seoDescription || "",

    images: initialData?.images || [],
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [newColorInput, setNewColorInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load categories
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        if (!formData.categoryId && data.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: data[0].id }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingCats(false));
  }, []);

  // Auto-generate slug and SKU from product name if empty
  const handleNameChange = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: isEditing ? prev.slug : slug,
      sku: isEditing || prev.sku ? prev.sku : `RA-${val.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    }));
  };

  // Image Upload handler (Vercel Blob + Media Library)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setErrorMessage("");

    try {
      const newImgs: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: form,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          newImgs.push({
            id: `img_${Date.now()}_${i}`,
            imageUrl: data.url,
            altText: formData.name || file.name || "Resin Art Product",
            isPrimary: formData.images.length === 0 && newImgs.length === 0,
            displayOrder: formData.images.length + newImgs.length + 1,
          });
        }
      }

      if (newImgs.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...newImgs],
        }));
      }
    } catch {
      setErrorMessage("Upload request failed.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSelectFromLibrary = (selected: { url: string; altText?: string }[]) => {
    const newImgs = selected.map((item, idx) => ({
      id: `img_${Date.now()}_${idx}`,
      imageUrl: item.url,
      altText: item.altText || formData.name || "Resin Art Product",
      isPrimary: formData.images.length === 0 && idx === 0,
      displayOrder: formData.images.length + idx + 1,
    }));
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImgs],
    }));
  };

  const removeImage = (index: number) => {
    const updated = [...formData.images];
    updated.splice(index, 1);
    const reordered = updated.map((img: any, i: number) => ({
      ...img,
      isPrimary: i === 0,
      displayOrder: i + 1,
    }));
    setFormData({ ...formData, images: reordered });
  };

  const setPrimaryImage = (index: number) => {
    const selected = formData.images[index];
    if (!selected) return;
    const remaining = formData.images.filter((_: any, i: number) => i !== index);
    const reordered = [selected, ...remaining].map((img: any, i: number) => ({
      ...img,
      isPrimary: i === 0,
      displayOrder: i + 1,
    }));
    setFormData({ ...formData, images: reordered });
  };

  // Variant Groups with Titles & Multiple Options
  const addVariantGroup = () => {
    const newGroup = {
      id: `vg_${Date.now()}`,
      title: "",
      options: [
        {
          id: `opt_${Date.now()}_1`,
          name: "",
          priceAdjustment: 0,
          skuModifier: "",
          inStock: true,
        },
      ],
    };
    setFormData((prev) => ({
      ...prev,
      enableVariants: true,
      variantGroups: [...(prev.variantGroups || []), newGroup],
    }));
  };

  const updateVariantGroupTitle = (groupIndex: number, title: string) => {
    const updated = [...(formData.variantGroups || [])];
    if (updated[groupIndex]) {
      updated[groupIndex] = { ...updated[groupIndex], title };
      setFormData({ ...formData, variantGroups: updated });
    }
  };

  const removeVariantGroup = (groupIndex: number) => {
    const updated = [...(formData.variantGroups || [])];
    updated.splice(groupIndex, 1);
    setFormData({
      ...formData,
      variantGroups: updated,
      enableVariants: updated.length > 0,
    });
  };

  const addVariantOption = (groupIndex: number) => {
    const updated = [...(formData.variantGroups || [])];
    if (!updated[groupIndex]) return;
    const isFirst = (!updated[groupIndex].options || updated[groupIndex].options.length === 0);
    updated[groupIndex].options = [
      ...(updated[groupIndex].options || []),
      {
        id: `opt_${Date.now()}_${(updated[groupIndex].options || []).length + 1}`,
        name: "",
        priceAdjustment: 0,
        skuModifier: "",
        inStock: true,
        isDefault: isFirst,
      },
    ];
    setFormData({ ...formData, variantGroups: updated });
  };

  const setDefaultVariantOption = (groupIndex: number, optionIndex: number) => {
    const updated = [...(formData.variantGroups || [])];
    if (!updated[groupIndex] || !updated[groupIndex].options) return;
    updated[groupIndex].options.forEach((o: any, oi: number) => {
      o.isDefault = oi === optionIndex;
    });
    setFormData({ ...formData, variantGroups: updated });
  };

  const updateVariantOption = (groupIndex: number, optionIndex: number, field: string, value: any) => {
    const updated = [...(formData.variantGroups || [])];
    if (!updated[groupIndex] || !updated[groupIndex].options[optionIndex]) return;
    updated[groupIndex].options[optionIndex] = {
      ...updated[groupIndex].options[optionIndex],
      [field]: value,
    };
    setFormData({ ...formData, variantGroups: updated });
  };

  const removeVariantOption = (groupIndex: number, optionIndex: number) => {
    const updated = [...(formData.variantGroups || [])];
    if (!updated[groupIndex]) return;
    updated[groupIndex].options.splice(optionIndex, 1);
    setFormData({ ...formData, variantGroups: updated });
  };

  // Resin Color Palette Handlers
  const addColorToPalette = (colorName: string) => {
    const trimmed = colorName.trim();
    if (!trimmed) return;
    const current = formData.customColorPalette || [];
    if (!current.includes(trimmed)) {
      setFormData({
        ...formData,
        customColorPalette: [...current, trimmed],
      });
    }
    setNewColorInput("");
  };

  const removeColorFromPalette = (index: number) => {
    const updated = [...(formData.customColorPalette || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, customColorPalette: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setSubmitting(true);

    try {
      const endpoint = isEditing
        ? `/api/admin/products/${initialData.id}`
        : "/api/admin/products";

      const method = isEditing ? "PUT" : "POST";

      const flattenedVariants = (formData.variantGroups || []).flatMap((g: any) =>
        (g.options || []).map((o: any) => ({
          id: o.id || `var_${Date.now()}`,
          name: g.title ? `${g.title}: ${o.name}` : o.name,
          sku: `${formData.sku || "VAR"}-${(o.skuModifier || o.name || "OPT").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase()}`,
          priceAdjustment: Number(o.priceAdjustment) || 0,
          inventory: o.inStock !== false ? 10 : 0,
          isActive: o.inStock !== false,
        }))
      );

      const hasAnyCustomization =
        Boolean(formData.enablePersonalization) && (
          Boolean(formData.customColorEnabled) ||
          Boolean(formData.customImageUploadEnabled) ||
          Boolean(formData.customNameEnabled) ||
          Boolean(formData.customInitialsEnabled)
        );

      const payload = {
        ...formData,
        enablePersonalization: hasAnyCustomization,
        customColorEnabled: hasAnyCustomization ? Boolean(formData.customColorEnabled) : false,
        customImageUploadEnabled: hasAnyCustomization ? Boolean(formData.customImageUploadEnabled) : false,
        customNameEnabled: hasAnyCustomization ? Boolean(formData.customNameEnabled) : false,
        customInitialsEnabled: hasAnyCustomization ? Boolean(formData.customInitialsEnabled) : false,
        variants: flattenedVariants.length > 0 ? flattenedVariants : formData.variants,
        sku: formData.sku?.trim() || `RA-${formData.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "ART"}-${Math.floor(100 + Math.random() * 900)}`,
        slug: formData.slug?.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage("Product saved successfully!");
        setTimeout(() => {
          router.push("/admin/products");
        }, 1200);
      } else {
        let err = data.error || "Failed to save product.";
        if (data.details && typeof data.details === "object") {
          const detailMsgs = Object.entries(data.details)
            .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
            .join(" | ");
          if (detailMsgs) err = `${err}: ${detailMsgs}`;
        }
        setErrorMessage(err);
      }
    } catch {
      setErrorMessage("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/admin/products")}
            className="p-2 text-[#736C66] hover:text-[#2C332D] hover:bg-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
              {isEditing ? `Edit: ${formData.name}` : "Create New Resin Product"}
            </h1>
            <p className="text-xs text-[#736C66]">
              All fields are dynamically linked to Neon PostgreSQL and storefront listings.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-4 py-2 border border-[#E8E0D5] bg-white text-xs font-semibold rounded-xl text-[#736C66] hover:text-[#2C332D]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E] shadow-sm transition-all"
          >
            {submitting ? "Saving..." : isEditing ? "Update Product" : "Publish Product"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#FDF2F2] border border-[#FADBD8] rounded-xl text-xs text-[#DF4C4C] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32] flex items-center space-x-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-[#E8E0D5] space-x-1 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { key: "general", label: "General & Details" },
          { key: "pricing", label: "Pricing & Stock" },
          { key: "images", label: `Media Gallery (${formData.images.length})` },
          { key: "variants", label: `Variants (${formData.variants.length})` },
          { key: "customization", label: "Resin Customisation" },
          { key: "shipping", label: "Shipping & SEO" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.key
                ? "bg-[#2C332D] text-white shadow-sm"
                : "text-[#736C66] hover:text-[#2C332D] hover:bg-white"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ==================== TAB 1: GENERAL ==================== */}
        {activeTab === "general" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aurora Ocean Coasters (Set of 4)"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  URL Slug (Unique) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  SKU (Stock Keeping Unit) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Product Type
                </label>
                <select
                  value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  <option value="ready_made">Ready Made (In Stock)</option>
                  <option value="made_to_order">Made to Order (Curing Needed)</option>
                  <option value="customised">Personalised / Customised</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Short Catchphrase Description (for cards and previews)
              </label>
              <input
                type="text"
                placeholder="e.g. Hand-poured 4-piece geode coaster set with metallic gold trim."
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Full Product Description *
              </label>
              <textarea
                rows={5}
                required
                placeholder="Describe resin technique, flower types, dimensions, and styling inspiration..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            {/* Status & Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-[#F4EBE6]">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Publication Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  <option value="published">Published (Live on Store)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived (Delisted)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="feat"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="rounded border-[#E8E0D5] text-[#2C332D] focus:ring-[#D4AF37]"
                />
                <label htmlFor="feat" className="text-xs font-semibold text-[#2C332D] cursor-pointer">
                  Featured on Home Page
                </label>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="best"
                  checked={formData.isBestseller}
                  onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                  className="rounded border-[#E8E0D5] text-[#2C332D] focus:ring-[#D4AF37]"
                />
                <label htmlFor="best" className="text-xs font-semibold text-[#2C332D] cursor-pointer">
                  Studio Bestseller Badge
                </label>
              </div>
            </div>

            {/* Festival Special Promotion Box */}
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-r from-[#FFFDF9] via-[#FFF9F5] to-[#FFF3F6] space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#6A162B] text-[#FFDF78] flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#3A1823] uppercase tracking-wider">
                      Festival Special Promotion
                    </h4>
                    <p className="text-[11px] text-[#7A5E68]">
                      Highlight this product with royal festive borders, badges, and exclusive festival discounts.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFestivalSpecial}
                    onChange={(e) => setFormData({ ...formData, isFestivalSpecial: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6A162B]"></div>
                  <span className="ml-2.5 text-xs font-bold text-[#3A1823]">
                    {formData.isFestivalSpecial ? "Active Festive Item" : "Standard Product"}
                  </span>
                </label>
              </div>

              {formData.isFestivalSpecial && (
                <div className="pt-3 border-t border-[#F2DECE] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                      Festival Discount Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g. 20 (for 20% OFF)"
                        value={formData.festivalDiscountPercentage}
                        onChange={(e) => setFormData({ ...formData, festivalDiscountPercentage: e.target.value })}
                        className="w-full pl-3.5 pr-8 py-2 text-xs bg-white border border-[#D4AF37] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-semibold text-[#6A162B]"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-[#D4AF37]">%</span>
                    </div>
                    <p className="text-[10px] text-[#7A5E68] mt-1">
                      Will display as a highlighted badge on the product card (e.g., 20% FESTIVE OFF).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: PRICING & INVENTORY ==================== */}
        {activeTab === "pricing" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
            <h3 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-2">
              Pricing Details (INR)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Regular Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  placeholder="1299.00"
                  value={formData.regularPrice}
                  onChange={(e) => setFormData({ ...formData, regularPrice: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Sale Price (₹, Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1099.00"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Cost / Material Price (Admin Only, ₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="450.00"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <h3 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-2 pt-4">
              Inventory & Tracking
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="track"
                  checked={formData.trackInventory}
                  onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })}
                  className="rounded border-[#E8E0D5] text-[#2C332D] focus:ring-[#D4AF37]"
                />
                <label htmlFor="track" className="text-xs font-semibold text-[#2C332D] cursor-pointer">
                  Track Stock Quantity
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Available Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                  disabled={!formData.trackInventory}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                  disabled={!formData.trackInventory}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: IMAGES & VERCEL BLOB ==================== */}
        {activeTab === "images" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C332D]">
                  Product Image Gallery (Vercel Blob)
                </h3>
                <p className="text-xs text-[#736C66]">
                  Upload high-resolution photography. Set primary image and reorder.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="px-4 py-2 bg-[#FAF8F5] border border-[#E8E0D5] hover:border-[#D4AF37] text-[#2C332D] rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#B8972E]" />
                  <span>Choose from Media Library</span>
                </button>
                <label className="px-4 py-2 bg-[#2C332D] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer hover:bg-[#3D473E] shadow-sm transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? "Uploading..." : "Upload Images"}</span>
                  <input
                    type="file"
                    accept="image/*,.heic,.heif,image/heic,image/heif"
                    multiple
                    className="hidden"
                    onChange={handleImageFileChange}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            </div>

            {formData.images.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-[#E8E0D5] rounded-2xl text-center space-y-2 bg-[#FAF8F5]">
                <ImageIcon className="w-8 h-8 text-[#8C7A72] mx-auto" />
                <p className="text-xs text-[#736C66]">No product images uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {formData.images.map((img: any, idx: number) => (
                  <div
                    key={img.id || idx}
                    className="relative group bg-[#FAF8F5] rounded-2xl overflow-hidden border border-[#E8E0D5] aspect-square"
                  >
                    <img src={img.imageUrl} alt={img.altText} className="w-full h-full object-cover" />

                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 bg-[#2C332D] text-[#D4AF37] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                        Primary
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(idx)}
                          className="px-2 py-1 bg-white text-[#2C332D] text-[10px] font-bold rounded-lg shadow"
                        >
                          Make Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1.5 bg-[#DF4C4C] text-white rounded-lg shadow"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: VARIANTS (MULTI-TITLE GROUPS) ==================== */}
        {activeTab === "variants" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F4EBE6] pb-4 gap-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C332D] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#B8972E]" />
                  <span>Product Variants & Custom Options</span>
                </h3>
                <p className="text-xs text-[#736C66] mt-0.5">
                  Enter a title for each variant category (e.g. &ldquo;Size&rdquo;, &ldquo;Hardware Tone&rdquo;, &ldquo;Stand Base&rdquo;) and add multiple options under each title.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariantGroup}
                className="px-4 py-2 bg-[#2C332D] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 hover:bg-[#3D473E] shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant Title / Group</span>
              </button>
            </div>

            {(!formData.variantGroups || formData.variantGroups.length === 0) ? (
              <div className="p-10 border-2 border-dashed border-[#E8E0D5] rounded-2xl text-center space-y-3 bg-[#FAF8F5]">
                <Layers className="w-8 h-8 text-[#8C7A72] mx-auto opacity-70" />
                <p className="text-xs text-[#736C66] max-w-md mx-auto">
                  No variant categories configured yet. Click below to add a variant title (e.g., &ldquo;Select Size&rdquo; or &ldquo;Hardware Color&rdquo;) and configure its options.
                </p>
                <button
                  type="button"
                  onClick={addVariantGroup}
                  className="px-4 py-2 bg-[#2C332D] text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 hover:bg-[#3D473E]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Variant Title</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.variantGroups.map((group: any, gIdx: number) => (
                  <div
                    key={group.id || gIdx}
                    className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#E8E0D5] shadow-xs space-y-4"
                  >
                    {/* Variant Group Title Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E0D5] pb-3">
                      <div className="flex-1 max-w-md">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C332D] block mb-1">
                          Variant Title #{gIdx + 1} (e.g. Size, Hardware, Frame Finish) *
                        </label>
                        <input
                          type="text"
                          value={group.title}
                          onChange={(e) => updateVariantGroupTitle(gIdx, e.target.value)}
                          placeholder="e.g. Size, Hardware Finish, Chain Style"
                          className="w-full px-3 py-2 text-xs font-semibold bg-white border border-[#D4AF37]/50 rounded-xl focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => addVariantOption(gIdx)}
                          className="px-3 py-1.5 bg-[#2C332D] text-white rounded-lg text-[11px] font-semibold flex items-center space-x-1 hover:bg-[#3D473E] shadow-xs transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Option</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVariantGroup(gIdx)}
                          className="p-1.5 text-[#DF4C4C] hover:bg-[#FDF2F2] rounded-lg transition"
                          title="Delete this entire title/group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Options list under this title */}
                    <div className="space-y-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A72] hidden sm:grid grid-cols-12 gap-3 px-2">
                        <span className="col-span-4">Option Name (e.g. P / Medium)</span>
                        <span className="col-span-3">Price (₹)</span>
                        <span className="col-span-2">SKU Suffix</span>
                        <span className="col-span-3 text-right">Default / Actions</span>
                      </div>

                      {(!group.options || group.options.length === 0) ? (
                        <p className="text-xs text-[#8C7A72] italic py-2">
                          No options added under &ldquo;{group.title || "this title"}&rdquo;. Click &ldquo;Add Option&rdquo; above.
                        </p>
                      ) : (
                        group.options.map((opt: any, oIdx: number) => (
                          <div
                            key={opt.id || oIdx}
                            className="bg-white p-3 rounded-xl border border-[#E8E0D5] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                          >
                            <div className="sm:col-span-4">
                              <label className="text-[10px] text-[#8C7A72] block sm:hidden">Option Name</label>
                              <input
                                type="text"
                                value={opt.name}
                                onChange={(e) => updateVariantOption(gIdx, oIdx, "name", e.target.value)}
                                placeholder="e.g. Medium (8-inch)"
                                className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="text-[10px] text-[#8C7A72] block sm:hidden">Price (₹)</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-xs font-bold text-[#8C7A72]">₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={opt.priceAdjustment}
                                  onChange={(e) => updateVariantOption(gIdx, oIdx, "priceAdjustment", Number(e.target.value))}
                                  placeholder="0.00"
                                  className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                                />
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-[#8C7A72] block sm:hidden">SKU Suffix</label>
                              <input
                                type="text"
                                value={opt.skuModifier || ""}
                                onChange={(e) => updateVariantOption(gIdx, oIdx, "skuModifier", e.target.value)}
                                placeholder="e.g. P"
                                className="w-full px-2.5 py-1.5 text-xs uppercase bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                              />
                            </div>
                            <div className="sm:col-span-3 flex items-center justify-between sm:justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setDefaultVariantOption(gIdx, oIdx)}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center space-x-1 ${
                                  opt.isDefault
                                    ? "bg-[#2C332D] text-[#D4AF37] ring-1 ring-[#D4AF37] shadow-xs"
                                    : "bg-[#FAF4EC] text-[#736C66] hover:bg-[#F3E8DB] hover:text-[#2C332D]"
                                }`}
                                title={opt.isDefault ? "Default selected option" : "Click to make this option the default selected"}
                              >
                                <span>{opt.isDefault ? "★ Default" : "Set Default"}</span>
                              </button>
                              <label className="flex items-center space-x-1 text-[11px] text-[#2C332D] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={opt.inStock !== false}
                                  onChange={(e) => updateVariantOption(gIdx, oIdx, "inStock", e.target.checked)}
                                  className="rounded text-[#2C332D]"
                                />
                                <span className="text-[10px]">Stock</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => removeVariantOption(gIdx, oIdx)}
                                className="p-1.5 text-[#DF4C4C] hover:bg-[#FDF2F2] rounded-lg transition"
                                title="Remove this option"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addVariantGroup}
                  className="w-full py-3 bg-[#FAF8F5] border-2 border-dashed border-[#E8E0D5] hover:border-[#D4AF37] text-[#2C332D] rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition"
                >
                  <Plus className="w-4 h-4 text-[#B8972E]" />
                  <span>+ Add Another Variant Title / Category</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 5: RESIN PERSONALISATION & CUSTOMISATION ==================== */}
        {activeTab === "customization" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C332D] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>Resin Art Customisation & Personalisation</span>
                </h3>
                <p className="text-xs text-[#736C66] mt-0.5">
                  Configure bespoke customer inputs: reference photo upload, resin color palette, custom names, and monogram initials.
                </p>
              </div>
              <label className="flex items-center space-x-2 text-xs font-bold text-[#2C332D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enablePersonalization}
                  onChange={(e) => setFormData({ ...formData, enablePersonalization: e.target.checked })}
                  className="rounded border-[#E8E0D5] text-[#2C332D] focus:ring-[#D4AF37]"
                />
                <span>Enable Personalisation</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2.5 p-3.5 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] hover:bg-white cursor-pointer text-xs transition">
                <input
                  type="checkbox"
                  checked={formData.customImageUploadEnabled}
                  onChange={(e) => setFormData({ ...formData, customImageUploadEnabled: e.target.checked })}
                  className="rounded text-[#2C332D]"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[#2C332D] block">Allow Reference Photo Upload</span>
                  <span className="text-[10px] text-[#736C66] block">Customer can upload reference image (HEIC/JPG/PNG) sent to WhatsApp</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-3.5 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] hover:bg-white cursor-pointer text-xs transition">
                <input
                  type="checkbox"
                  checked={formData.customColorEnabled}
                  onChange={(e) => setFormData({ ...formData, customColorEnabled: e.target.checked })}
                  className="rounded text-[#2C332D]"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[#2C332D] block">Allow Resin Color Palette Selection</span>
                  <span className="text-[10px] text-[#736C66] block">Customer chooses from custom curated resin pigment colors</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-3.5 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] hover:bg-white cursor-pointer text-xs transition">
                <input
                  type="checkbox"
                  checked={formData.customNameEnabled}
                  onChange={(e) => setFormData({ ...formData, customNameEnabled: e.target.checked })}
                  className="rounded text-[#2C332D]"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[#2C332D] block">Allow Custom Name / Word</span>
                  <span className="text-[10px] text-[#736C66] block">Customer enters custom name or phrase to be embedded in resin</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-3.5 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] hover:bg-white cursor-pointer text-xs transition">
                <input
                  type="checkbox"
                  checked={formData.customInitialsEnabled}
                  onChange={(e) => setFormData({ ...formData, customInitialsEnabled: e.target.checked })}
                  className="rounded text-[#2C332D]"
                />
                <div className="flex-1">
                  <span className="font-semibold text-[#2C332D] block">Allow Monogram Initials</span>
                  <span className="text-[10px] text-[#736C66] block">Customer specifies 1-4 uppercase initials</span>
                </div>
              </label>
            </div>

            {/* Resin Color Palette Manager (when customColorEnabled is true) */}
            {formData.customColorEnabled && (
              <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#D4AF37]/50 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-2">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-[#B8972E]" />
                    <h4 className="font-serif text-xs font-bold text-[#2C332D] uppercase tracking-wider">
                      Resin Color Palette Options for this Product
                    </h4>
                  </div>
                  <span className="text-[10px] text-[#8C7A72]">
                    {(formData.customColorPalette || []).length} colors configured
                  </span>
                </div>

                {/* Active color chips */}
                <div className="flex flex-wrap gap-2">
                  {(formData.customColorPalette || []).map((col: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4AF37]/60 text-[#2C332D] text-xs font-semibold rounded-full shadow-xs"
                    >
                      <span>{col}</span>
                      <button
                        type="button"
                        onClick={() => removeColorFromPalette(idx)}
                        className="text-[#8C7A72] hover:text-[#DF4C4C] transition p-0.5"
                        title="Remove color"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {(!formData.customColorPalette || formData.customColorPalette.length === 0) && (
                    <p className="text-xs text-[#8C7A72] italic">
                      No colors added yet. Type a color below or click a studio preset.
                    </p>
                  )}
                </div>

                {/* Add Custom Color Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addColorToPalette(newColorInput);
                      }
                    }}
                    placeholder="Enter custom pigment / theme (e.g. Sunset Amber & Gold Leaf)"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => addColorToPalette(newColorInput)}
                    className="px-4 py-2 bg-[#2C332D] text-white rounded-xl text-xs font-semibold hover:bg-[#3D473E] shadow-xs transition"
                  >
                    + Add Color
                  </button>
                </div>

                {/* Preset Studio Pigments Quick Add */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A72] block">
                    Quick Add Studio Favorites:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Ocean Blue & Gold Leaf",
                      "Rose Gold & Blush Pink",
                      "Emerald Green & Gold",
                      "Cosmic Lavender & Pearl",
                      "Obsidian Black & 24K Gold",
                      "Royal Navy Blue",
                      "Sunset Amber & Copper",
                      "Pearl White Minimalist",
                    ].map((preset) => {
                      const alreadyAdded = (formData.customColorPalette || []).includes(preset);
                      return (
                        <button
                          key={preset}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => addColorToPalette(preset)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border transition ${alreadyAdded
                              ? "bg-[#FAF4EC] border-[#D4AF37]/30 text-[#8C7A72] opacity-60 cursor-not-allowed"
                              : "bg-white border-[#E8E0D5] hover:border-[#D4AF37] text-[#2C332D] font-medium"
                            }`}
                        >
                          + {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Personalisation Surcharge (+₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.personalizationSurcharge}
                  onChange={(e) => setFormData({ ...formData, personalizationSurcharge: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Estimated Production & Curing Time (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.productionTimeDays}
                  onChange={(e) => setFormData({ ...formData, productionTimeDays: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Customisation Instructions for Customer
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Please enter couple initials and wedding date to be engraved..."
                value={formData.customizationInstructions}
                onChange={(e) => setFormData({ ...formData, customizationInstructions: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>
          </div>
        )}

        {/* ==================== TAB 6: SHIPPING & SEO ==================== */}
        {activeTab === "shipping" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
            <h3 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-2">
              Shipping Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Weight (Grams)
                </label>
                <input
                  type="number"
                  placeholder="450"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Dimensions (e.g. 10 x 10 x 1 cm)
                </label>
                <input
                  type="text"
                  placeholder="10 x 10 x 0.8 cm"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="freeship"
                  checked={formData.isFreeShipping}
                  onChange={(e) => setFormData({ ...formData, isFreeShipping: e.target.checked })}
                  className="rounded border-[#E8E0D5] text-[#2C332D] focus:ring-[#D4AF37]"
                />
                <label htmlFor="freeship" className="text-xs font-semibold text-[#2C332D] cursor-pointer">
                  Complimentary Free Shipping
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Materials Used
              </label>
              <input
                type="text"
                placeholder="e.g. Food-safe UV-stable epoxy resin, mica pigments, gold leaf flakes"
                value={formData.materials}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                Care Instructions
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Wipe clean with a soft microfiber cloth. Do not soak in hot water..."
                value={formData.careInstructions}
                onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
              />
            </div>

            <h3 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-2 pt-4">
              SEO Optimization
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  SEO Meta Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handcrafted Ocean Wave Resin Coasters Set of 4 | Devangi Resin Studio"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  SEO Meta Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary for Google and search engines..."
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        multiple={true}
        title="Select Product Images from Library"
        onSelect={handleSelectFromLibrary}
      />
    </div>
  );
}
