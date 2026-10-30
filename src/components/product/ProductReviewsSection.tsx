"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Star,
  ThumbsUp,
  Camera,
  Upload,
  X,
  Loader2,
  ShieldCheck,
  Sparkles,
  Lock,
  CheckCircle2,
  Image as ImageIcon,
  ChevronDown,
  Filter,
} from "lucide-react";

interface ReviewItem {
  id: string;
  productId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  rating: number;
  reviewText: string;
  images: string[];
  likesCount: number;
  isVerifiedPurchase: boolean;
  adminGranted: boolean;
  createdAt: string;
  userHasLiked?: boolean;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: Record<number, number>;
}

interface ReviewEligibility {
  canReview: boolean;
  reason?: string;
  hasAlreadyReviewed: boolean;
  isVerifiedPurchase: boolean;
  adminGranted: boolean;
  orderId?: string;
}

export function ProductReviewsSection({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Filtering
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.stats) setStats(data.stats);
        if (data.eligibility) setEligibility(data.eligibility);
      }
    } catch (err) {
      console.error("Error loading product reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      setFormError("Maximum 5 photos allowed per review.");
      return;
    }

    setIsUploading(true);
    setFormError("");

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setFormError(`Image ${file.name} is larger than 5MB limit.`);
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
          setFormError(json.error || `Failed to upload ${file.name}`);
        }
      }
      setUploadedImages((prev) => [...prev, ...newUrls]);
    } catch {
      setFormError("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleLikeReview = async (reviewId: string) => {
    // Optimistic UI update
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const currentlyLiked = r.userHasLiked;
          return {
            ...r,
            userHasLiked: !currentlyLiked,
            likesCount: currentlyLiked ? Math.max(0, r.likesCount - 1) : r.likesCount + 1,
          };
        }
        return r;
      })
    );

    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, userHasLiked: data.liked, likesCount: data.likesCount } : r
          )
        );
      }
    } catch (e) {
      console.error("Like toggle error:", e);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reviewText.trim().length < 3) {
      setFormError("Please write at least a few words (minimum 3 characters).");
      return;
    }

    if (reviewText.length > 900) {
      setFormError("Review cannot exceed 900 characters.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          reviewText: reviewText.trim(),
          images: uploadedImages,
          orderId: eligibility?.orderId || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "Failed to submit review.");
      } else {
        setFormSuccess(true);
        setTimeout(() => {
          setFormSuccess(false);
          setShowForm(false);
          setReviewText("");
          setUploadedImages([]);
          loadReviews();
        }, 1500);
      }
    } catch {
      setFormError("Network error while submitting review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    if (filterRating !== null && r.rating !== filterRating) return false;
    if (onlyWithPhotos && (!r.images || r.images.length === 0)) return false;
    return true;
  });

  return (
    <div id="product-reviews" className="bg-white rounded-3xl border border-[#E8E0D5] p-6 sm:p-10 shadow-sm space-y-8">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Customer review photo"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Header & Overall Ratings Grid */}
      <div className="border-b border-[#E8E0D5] pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#B8972E]">
                Client Experiences
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C332D] mt-1">
              Customer Reviews
            </h2>
          </div>

          {/* Review Button / Eligibility Notice */}
          <div>
            {eligibility?.canReview ? (
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="py-3 px-6 bg-[#2C332D] hover:bg-[#3D473E] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>{showForm ? "Close Review Form" : "Write a Review"}</span>
              </button>
            ) : eligibility?.hasAlreadyReviewed ? (
              <div className="flex items-center space-x-1.5 text-xs text-[#2E7D32] bg-[#E8EFE8] px-3.5 py-2 rounded-xl font-bold border border-[#C5D8C5]">
                <CheckCircle2 className="w-4 h-4" />
                <span>You reviewed this piece</span>
              </div>
            ) : (
              <div className="text-right">
                <div className="inline-flex items-center space-x-1.5 text-xs text-[#736C66] bg-[#FAF8F5] px-3 py-2 rounded-xl border border-[#E8E0D5]">
                  <Lock className="w-3.5 h-3.5 text-[#B8972E]" />
                  <span>Verified buyers & invited reviewers only</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-8 items-center bg-[#FAF8F5] p-6 rounded-2xl border border-[#E8E0D5]">
          {/* Average Rating Block */}
          <div className="text-center md:border-r border-[#E8E0D5] md:pr-6">
            <span className="font-serif text-5xl font-extrabold text-[#2C332D]">
              {stats.averageRating > 0 ? stats.averageRating : "5.0"}
            </span>
            <div className="flex justify-center items-center space-x-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    (stats.averageRating || 5) >= star
                      ? "text-[#D4AF37] fill-[#D4AF37]"
                      : "text-[#D1C7BD]"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[#736C66] mt-1.5">
              Based on {stats.totalReviews} verified {stats.totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="md:col-span-2 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] || 0;
              const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center space-x-3 text-xs">
                  <span className="w-8 font-semibold text-[#2C332D] flex items-center space-x-1">
                    <span>{star}</span>
                    <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                  </span>
                  <div className="flex-1 h-2 bg-[#E8E0D5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B8972E] rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[#736C66] font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slide-down Review Submission Form */}
      {showForm && eligibility?.canReview && (
        <div className="bg-[#FAF8F5] border-2 border-[#D4AF37]/40 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8972E]">
                {eligibility.adminGranted ? "Invited Review" : "Verified Order Review"}
              </span>
              <h3 className="font-serif text-lg font-bold text-[#2C332D]">
                Write a Review for {productName}
              </h3>
            </div>
            <span className="text-xs text-[#2E7D32] bg-[#E8EFE8] px-2.5 py-1 rounded-full font-bold">
              {eligibility.adminGranted ? "Invited Reviewer" : "Verified Buyer"}
            </span>
          </div>

          {formSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-[#E8EFE8] text-[#2E7D32] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-serif text-lg font-bold text-[#2C332D]">
                Thank you for your valuable feedback!
              </h4>
              <p className="text-xs text-[#736C66]">
                Your review and photos have been published to the product page.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="text-xs font-bold text-[#2C332D] block mb-1">
                  Overall Rating *
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          (hoverRating || rating) >= star
                            ? "text-[#D4AF37] fill-[#D4AF37]"
                            : "text-[#D1C7BD]"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-[#8C7A72] pl-2">
                    {rating === 5
                      ? "Loved it! (5 Stars)"
                      : rating === 4
                      ? "Very Good (4 Stars)"
                      : rating === 3
                      ? "Good (3 Stars)"
                      : rating === 2
                      ? "Fair (2 Stars)"
                      : "Needs Improvement (1 Star)"}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#2C332D]">
                    Your Review (Max 900 Characters) *
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      reviewText.length > 850 ? "text-[#DF4C4C] font-bold" : "text-[#8C7A72]"
                    }`}
                  >
                    {reviewText.length} / 900
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={900}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details of clarity, preservation, gloss, craftsmanship, and how it looks in your space..."
                  className="w-full px-4 py-3 text-xs sm:text-sm bg-white border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#2C332D]"
                />
              </div>

              {/* Photos upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#2C332D] flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-[#B8972E]" />
                    <span>Upload Real Customer Photos (Up to 5 images)</span>
                  </label>
                  <span className="text-[11px] text-[#8C7A72]">
                    {uploadedImages.length} / 5
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E8E0D5] group shadow-xs"
                    >
                      <img src={img} alt="Uploaded review" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {uploadedImages.length < 5 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-[#D1C7BD] hover:border-[#D4AF37] bg-white hover:bg-[#FAF4EC] flex flex-col items-center justify-center cursor-pointer transition-colors">
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 text-[#B8972E] animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#8C7A72]" />
                          <span className="text-[9px] font-bold text-[#8C7A72] mt-0.5">+ Photo</span>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={isUploading}
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              {formError && (
                <p className="text-xs text-[#DF4C4C] bg-[#FDF2F2] border border-[#FADBD8] px-3 py-2 rounded-xl">
                  {formError}
                </p>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="py-3 px-6 bg-[#2C332D] hover:bg-[#3D473E] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>Post Review</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="py-3 px-4 text-xs font-semibold text-[#736C66] hover:text-[#2C332D]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Review Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E8E0D5]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterRating(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterRating === null
                ? "bg-[#2C332D] text-white border-[#2C332D]"
                : "bg-white text-[#736C66] border-[#E8E0D5] hover:border-[#D4AF37]"
            }`}
          >
            All Ratings ({reviews.length})
          </button>
          {[5, 4, 3].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFilterRating(filterRating === star ? null : star)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center space-x-1 ${
                filterRating === star
                  ? "bg-[#2C332D] text-white border-[#2C332D]"
                  : "bg-white text-[#736C66] border-[#E8E0D5] hover:border-[#D4AF37]"
              }`}
            >
              <span>{star}★</span>
              <span className="text-[10px] opacity-75">({stats.distribution[star] || 0})</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOnlyWithPhotos(!onlyWithPhotos)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
              onlyWithPhotos
                ? "bg-[#FAF4EC] text-[#B8972E] border-[#D4AF37] font-bold"
                : "bg-white text-[#736C66] border-[#E8E0D5] hover:border-[#D4AF37]"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>With Photos Only</span>
          </button>
        </div>

        <span className="text-xs text-[#8C7A72]">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </span>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-12 text-center text-[#8C7A72]">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D4AF37]" />
          <p className="text-xs">Loading verified customer reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-12 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E0D5] space-y-2">
          <Star className="w-8 h-8 text-[#D1C7BD] mx-auto" />
          <p className="text-sm font-semibold text-[#2C332D]">No reviews match this filter.</p>
          <p className="text-xs text-[#736C66]">Try resetting your filter to see all reviews.</p>
        </div>
      ) : (
        <div className="space-y-6 divide-y divide-[#E8E0D5]">
          {filteredReviews.map((rev) => {
            const formattedDate = new Date(rev.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div key={rev.id} className="pt-6 first:pt-0 space-y-3.5">
                {/* User Info & Rating Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {/* User Profile Avatar */}
                    {rev.customerAvatar ? (
                      <img
                        src={rev.customerAvatar}
                        alt={rev.customerName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#D4AF37]/40 shadow-xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2C332D] to-[#3D473E] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs border border-[#E8E0D5]">
                        {rev.customerName.slice(0, 2)}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#2C332D]">
                          {rev.customerName}
                        </span>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#2E7D32] bg-[#E8EFE8] px-2 py-0.5 rounded-full border border-[#C5D8C5]">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                        {rev.adminGranted && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#946C00] bg-[#FFF8E1] px-2 py-0.5 rounded-full border border-[#FFE082]">
                            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                            <span>Verified Reviewer</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#A69E96]">{formattedDate}</span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center space-x-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          rev.rating >= s
                            ? "text-[#D4AF37] fill-[#D4AF37]"
                            : "text-[#D1C7BD]"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-[#4A433D] leading-relaxed whitespace-pre-line font-light">
                  {rev.reviewText}
                </p>

                {/* Uploaded Photos Gallery */}
                {rev.images && rev.images.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {rev.images.map((imgUrl, imgIdx) => (
                      <button
                        key={imgIdx}
                        type="button"
                        onClick={() => setLightboxImage(imgUrl)}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#E8E0D5] hover:border-[#D4AF37] transition-all transform hover:scale-105 shadow-xs cursor-pointer bg-[#FAF8F5]"
                        title="Click to expand"
                      >
                        <img
                          src={imgUrl}
                          alt={`Review photo ${imgIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Like Review Action */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleLikeReview(rev.id)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all ${
                      rev.userHasLiked
                        ? "bg-[#FAF4EC] text-[#B8972E] border-[#D4AF37] font-bold shadow-xs"
                        : "bg-white text-[#736C66] border-[#E8E0D5] hover:border-[#D4AF37] hover:text-[#2C332D]"
                    }`}
                  >
                    <ThumbsUp
                      className={`w-3.5 h-3.5 ${
                        rev.userHasLiked ? "text-[#B8972E] fill-[#B8972E]" : ""
                      }`}
                    />
                    <span>{rev.likesCount > 0 ? `Helpful (${rev.likesCount})` : "Helpful"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

