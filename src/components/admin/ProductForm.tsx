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
} from "lucide-react";

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
    status: initialData?.status || "draft",
    isFeatured: initialData?.isFeatured || false,
    isBestseller: initialData?.isBestseller || false,

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

    enablePersonalization: initialData?.enablePersonalization || false,
    customNameEnabled: initialData?.customNameEnabled || false,
    customInitialsEnabled: initialData?.customInitialsEnabled || false,
    customColorEnabled: initialData?.customColorEnabled || false,
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

  // Image Upload handler (Vercel Blob)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMessage("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        const newImg = {
          id: `img_${Date.now()}`,
          imageUrl: data.url,
          altText: formData.name || "Resin Art Product",
          isPrimary: formData.images.length === 0,
          displayOrder: formData.images.length + 1,
        };
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, newImg],
        }));
      } else {
        setErrorMessage(data.error || "Image upload failed.");
      }
    } catch {
      setErrorMessage("Upload request failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const updated = [...formData.images];
    updated.splice(index, 1);
    if (updated.length > 0 && !updated.some((i: any) => i.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setFormData({ ...formData, images: updated });
  };

  const setPrimaryImage = (index: number) => {
    const updated = formData.images.map((img: any, i: number) => ({
      ...img,
      isPrimary: i === index,
    }));
    setFormData({ ...formData, images: updated });
  };

  // Add / Remove Variant
  const addVariant = () => {
    const newVariant = {
      id: `var_${Date.now()}`,
      name: "Option Name",
      sku: `${formData.sku || "VAR"}-${formData.variants.length + 1}`,
      priceAdjustment: 0,
      inventory: 10,
      isActive: true,
    };
    setFormData({
      ...formData,
      enableVariants: true,
      variants: [...formData.variants, newVariant],
    });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...formData.variants];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, variants: updated });
  };

  const removeVariant = (index: number) => {
    const updated = [...formData.variants];
    updated.splice(index, 1);
    setFormData({
      ...formData,
      variants: updated,
      enableVariants: updated.length > 0,
    });
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

      const payload = {
        ...formData,
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
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.key
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
                  <option value="draft">Draft (Hidden)</option>
                  <option value="published">Published (Live on Store)</option>
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
              <label className="px-4 py-2 bg-[#2C332D] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer hover:bg-[#3D473E] shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingImage ? "Uploading..." : "Upload New Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                  disabled={uploadingImage}
                />
              </label>
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

        {/* ==================== TAB 4: VARIANTS ==================== */}
        {activeTab === "variants" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C332D]">
                  Product Variants
                </h3>
                <p className="text-xs text-[#736C66]">
                  Configure shapes, sizes, chains, or finishes with custom price adjustments and SKUs.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="px-4 py-2 bg-[#2C332D] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 hover:bg-[#3D473E]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            {formData.variants.length === 0 ? (
              <div className="p-8 border border-dashed border-[#E8E0D5] rounded-2xl text-center text-xs text-[#736C66] bg-[#FAF8F5]">
                No variants configured for this product. Click "Add Variant" to add options.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.variants.map((v: any, idx: number) => (
                  <div
                    key={v.id || idx}
                    className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D5] grid grid-cols-1 sm:grid-cols-5 gap-3 items-center"
                  >
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-[#736C66] block">Option Name</label>
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => updateVariant(idx, "name", e.target.value)}
                        placeholder="e.g. Size: Large (16x8 inch)"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8E0D5] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#736C66] block">SKU</label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8E0D5] rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#736C66] block">Price Adj (+₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={v.priceAdjustment}
                        onChange={(e) => updateVariant(idx, "priceAdjustment", Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8E0D5] rounded-lg"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-3 sm:pt-0 justify-end">
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="text-[#DF4C4C] hover:bg-[#FDF2F2] p-1.5 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 5: RESIN PERSONALISATION ==================== */}
        {activeTab === "customization" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C332D]">
                  Resin Art Customisation & Personalisation
                </h3>
                <p className="text-xs text-[#736C66]">
                  Enable customer inputs like custom names, initials, color selection, and reference image uploads.
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
              <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.customNameEnabled}
                  onChange={(e) => setFormData({ ...formData, customNameEnabled: e.target.checked })}
                  className="rounded text-[#2C332D]"
                />
                <span>Allow Custom Name / Word</span>
              </label>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.customInitialsEnabled}
                  onChange={(e) => setFormData({ ...formData, customInitialsEnabled: e.target.checked })}
                  className="rounded text-[#2C332D]"
                />
                <span>Allow Monogram Initials</span>
              </label>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.customColorEnabled}
                  onChange={(e) => setFormData({ ...formData, customColorEnabled: e.target.checked })}
                  className="rounded text-[#2C332D]"
                />
                <span>Allow Color Palette Selection</span>
              </label>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-[#E8E0D5] bg-[#FAF8F5] cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.customImageUploadEnabled}
                  onChange={(e) => setFormData({ ...formData, customImageUploadEnabled: e.target.checked })}
                  className="rounded text-[#2C332D]"
                />
                <span>Allow Customer Reference Image Upload</span>
              </label>
            </div>

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
                  placeholder="e.g. Handcrafted Ocean Wave Resin Coasters Set of 4 | Aura Resin"
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
    </div>
  );
}
