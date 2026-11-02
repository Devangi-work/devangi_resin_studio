"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  PackageCheck,
  Star,
  Camera,
  X,
  Upload,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

interface DeliveredItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  quantity?: number;
  hasReviewed?: boolean;
}

interface DeliveredOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string | number;
  deliveredAt: string;
  items: DeliveredItem[];
}

export function DeliveredOrderModal() {
  const [order, setOrder] = useState<DeliveredOrder | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DeliveredItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll for delivered orders on mount and periodically
  const checkForDeliveredOrders = async () => {
    try {
      const res = await fetch("/api/customer/delivered-check", { cache: "no-store" });
      const data = await res.json();
      if (data.hasDeliveredOrder && data.order) {
        setOrder(data.order);
        setIsOpen(true);
        // Default to first unreviewed item
        const unreviewed = data.order.items?.find((i: DeliveredItem) => !i.hasReviewed);
        if (unreviewed) {
          setSelectedProduct(unreviewed);
        } else if (data.order.items?.[0]) {
          setSelectedProduct(data.order.items[0]);
        }
      }
    } catch (e) {
      // Silently catch check error
    }
  };

  useEffect(() => {
    checkForDeliveredOrders();
    const interval = setInterval(checkForDeliveredOrders, 25000);

    const onFocus = () => checkForDeliveredOrders();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleDismiss = async () => {
    if (order) {
      try {
        await fetch("/api/customer/delivered-dismiss", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: order.orderNumber, orderId: order.id }),
        });
      } catch (e) {
        console.error("Failed to dismiss delivered order popup", e);
      }
    }
    setIsOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      setErrorMessage("You can upload a maximum of 5 images per review.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage(`File ${file.name} exceeds 5MB limit.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/review-image", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (res.ok && json.url) {
          newUrls.push(json.url);
        } else {
          setErrorMessage(json.error || `Failed to upload ${file.name}`);
        }
      }

      setUploadedImages((prev) => [...prev, ...newUrls]);
    } catch {
      setErrorMessage("Error uploading image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !selectedProduct) return;

    if (reviewText.trim().length < 3) {
      setErrorMessage("Please write at least a few words about your experience (minimum 3 characters).");
      return;
    }

    if (reviewText.length > 900) {
      setErrorMessage("Review text cannot exceed 900 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.productId,
          orderId: order.id,
          rating,
          reviewText: reviewText.trim(),
          images: uploadedImages,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || "Failed to submit review. Please try again.");
      } else {
        setSubmitSuccess(true);
        setReviewedProductIds((prev) => new Set(prev).add(selectedProduct.productId));

        // Reset fields
        setTimeout(() => {
          setSubmitSuccess(false);
          setReviewText("");
          setUploadedImages([]);
          setRating(5);

          // Find next unreviewed item
          const remaining = order.items.find(
            (i) => i.productId !== selectedProduct.productId && !reviewedProductIds.has(i.productId) && !i.hasReviewed
          );
          if (remaining) {
            setSelectedProduct(remaining);
          } else {
            // All items reviewed!
            handleDismiss();
          }
        }, 1800);
      }
    } catch {
      setErrorMessage("Network error while submitting review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  const currentProductReviewed =
    (selectedProduct && (selectedProduct.hasReviewed || reviewedProductIds.has(selectedProduct.productId))) || false;

  const ratingDescriptions: Record<number, string> = {
    1: "Needs Improvement",
    2: "Fair Quality",
    3: "Good & Decent",
    4: "Very Good & Loved It",
    5: "Exceptional Masterpiece! ★★★★★",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative bg-[#FAF8F5] border border-[#E8E0D5] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-[#2C332D] via-[#374239] to-[#2C332D] text-white px-6 py-6 sm:px-8 sm:py-7">
          <button
            onClick={handleDismiss}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 rounded-full text-[#E8E0D5] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8972E] text-white flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 border border-amber-300/40 shrink-0">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                  Delivered Successfully
                </span>
                <span className="text-[11px] text-[#A69E96]">
                  Order #{order.orderNumber}
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
                Your Resin Art Has Arrived! 🎉
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#E0D9D0] mt-3 leading-relaxed font-light">
            We hope your handcrafted resin keepsakes bring elegance and joy to your home. How was your experience?
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Order Items Selector (if multiple products) */}
          {order.items && order.items.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#736C66] block mb-2">
                Select Item to Review ({order.items.length})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-36 overflow-y-auto pr-1">
                {order.items.map((item) => {
                  const isDone = item.hasReviewed || reviewedProductIds.has(item.productId);
                  const isCurrent = selectedProduct?.productId === item.productId;
                  return (
                    <button
                      key={item.id || item.productId}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(item);
                        setReviewText("");
                        setUploadedImages([]);
                        setErrorMessage("");
                      }}
                      className={`flex items-center space-x-3 p-2.5 rounded-2xl border text-left transition-all ${
                        isCurrent
                          ? "bg-white border-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]"
                          : "bg-white/70 border-[#E8E0D5] hover:bg-white hover:border-[#D4AF37]/50"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#FAF8F5] shrink-0 border border-[#E8E0D5]">
                        <img
                          src={item.imageUrl || "/images/logo/resin_logo.png"}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#2C332D] truncate">
                          {item.productName}
                        </p>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          {isDone ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#2E7D32]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Reviewed</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-[#B8972E]">
                              Tap to review
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review Form for Selected Product */}
          {selectedProduct && (
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-5 sm:p-6 shadow-sm space-y-5">
              
              <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8972E]">
                    Reviewing Product
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#2C332D] line-clamp-1">
                    {selectedProduct.productName}
                  </h3>
                </div>
                <div className="flex items-center space-x-1 text-xs text-[#2E7D32] bg-[#E8EFE8] px-2.5 py-1 rounded-full font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Purchase</span>
                </div>
              </div>

              {submitSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 bg-[#E8EFE8] text-[#2E7D32] rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-[#2C332D]">
                    Thank you for your review!
                  </h4>
                  <p className="text-xs text-[#736C66]">
                    Your feedback and photos help our artisan studio craft even better pieces.
                  </p>
                </div>
              ) : currentProductReviewed ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-10 h-10 bg-[#E8EFE8] text-[#2E7D32] rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-[#2C332D]">
                    You have already reviewed this item.
                  </p>
                  <p className="text-xs text-[#736C66]">
                    Thank you for sharing your experience with our artisan resin collection.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Star Rating Selection */}
                  <div>
                    <label className="text-xs font-bold text-[#2C332D] block mb-1.5">
                      Your Rating (Max 5 Stars) *
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = (hoverRating || rating) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              aria-label={`Rate ${star} star`}
                              className="p-1 transition-transform hover:scale-125 focus:outline-none"
                            >
                              <Star
                                className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                                  active
                                    ? "text-[#D4AF37] fill-[#D4AF37]"
                                    : "text-[#D1C7BD] hover:text-[#D4AF37]"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs font-semibold text-[#8C7A72] pl-2 hidden sm:inline-block">
                        {ratingDescriptions[hoverRating || rating]}
                      </span>
                    </div>
                  </div>

                  {/* Review Text Area (Limit 900 Chars) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#2C332D]">
                        Your Review *
                      </label>
                      <span
                        className={`text-[11px] font-mono ${
                          reviewText.length > 850 ? "text-[#DF4C4C] font-bold" : "text-[#8C7A72]"
                        }`}
                      >
                        {reviewText.length} / 900 characters
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={900}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="How do you like the resin clarity, gloss, details, and packaging? Your honest thoughts mean the world to us..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#2C332D] placeholder-[#A69E96] transition-all"
                    />
                  </div>

                  {/* Multiple Images Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#2C332D] flex items-center space-x-1.5">
                        <Camera className="w-4 h-4 text-[#B8972E]" />
                        <span>Upload Photos of Your Delivered Piece (Optional)</span>
                      </label>
                      <span className="text-[11px] text-[#8C7A72]">
                        {uploadedImages.length} / 5 photos
                      </span>
                    </div>

                    {/* Previews and upload trigger */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {uploadedImages.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E8E0D5] group shadow-xs"
                        >
                          <img
                            src={url}
                            alt={`Uploaded review photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {uploadedImages.length < 5 && (
                        <label className="w-16 h-16 rounded-xl border-2 border-dashed border-[#D1C7BD] hover:border-[#D4AF37] bg-[#FAF8F5] hover:bg-[#FAF4EC] flex flex-col items-center justify-center cursor-pointer transition-colors">
                          {isUploading ? (
                            <Loader2 className="w-5 h-5 text-[#B8972E] animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-[#8C7A72]" />
                              <span className="text-[9px] font-bold text-[#8C7A72] mt-0.5">+ Add</span>
                            </>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                            className="hidden"
                            disabled={isUploading}
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {errorMessage && (
                    <p className="text-xs text-[#DF4C4C] bg-[#FDF2F2] border border-[#FADBD8] px-3 py-2 rounded-xl">
                      {errorMessage}
                    </p>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="flex-1 py-3 px-5 bg-[#2C332D] hover:bg-[#3D473E] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                          <span>Submitting Review...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                          <span>Submit Verified Review</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="py-3 px-4 text-xs font-semibold text-[#736C66] hover:text-[#2C332D] hover:bg-black/5 rounded-xl transition-colors"
                    >
                      Review Later
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

