import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { dbStore } from "@/lib/db";
import { notifyAdminOnNewReview } from "@/lib/notifications/admin-dispatcher";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5 stars"),
  reviewText: z
    .string()
    .trim()
    .min(3, "Review text must be at least 3 characters")
    .max(900, "Review text cannot exceed 900 characters"),
  images: z.array(z.string().url()).optional().default([]),
  orderId: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let productId = searchParams.get("productId");
    const slug = searchParams.get("slug");

    if (!productId && slug) {
      const product = await dbStore.getProductBySlug(slug);
      if (product) {
        productId = product.id;
      }
    }

    if (!productId) {
      return NextResponse.json({ error: "Product ID or slug is required" }, { status: 400 });
    }

    const session = await getCustomerSession();
    const userIdentifier = session?.customerId || session?.email || undefined;

    const data = await dbStore.getReviewsByProduct(productId, userIdentifier);

    let eligibility: {
      canReview: boolean;
      reason?: string;
      hasAlreadyReviewed: boolean;
      isVerifiedPurchase: boolean;
      adminGranted: boolean;
      orderId?: string;
    } = {
      canReview: false,
      reason: "Please sign in to write a verified review.",
      hasAlreadyReviewed: false,
      isVerifiedPurchase: false,
      adminGranted: false,
    };

    if (session) {
      eligibility = await dbStore.checkUserReviewEligibility(productId, session.customerId, session.email);
    }

    return NextResponse.json({
      success: true,
      reviews: data.reviews,
      stats: data.stats,
      eligibility,
    });
  } catch (err: any) {
    console.error("[Get Reviews Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to submit a review." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { productId, rating, reviewText, images, orderId } = parsed.data;

    // Check Eligibility: Delivered Order or Admin Granted Permission
    const eligibility = await dbStore.checkUserReviewEligibility(
      productId,
      session.customerId,
      session.email
    );

    if (!eligibility.canReview) {
      return NextResponse.json(
        {
          error:
            eligibility.reason ||
            "You are not eligible to review this product. Only verified purchasers with delivered orders or invited users can review.",
          hasAlreadyReviewed: eligibility.hasAlreadyReviewed,
        },
        { status: 403 }
      );
    }

    // Retrieve customer profile for avatar and full name
    const customer = await dbStore.getCustomerById(session.customerId);
    const customerName = customer?.name || session.name || "Resin Art Enthusiast";
    const customerAvatar = customer?.avatarUrl || null;

    const review = await dbStore.createReview({
      productId,
      customerId: session.customerId,
      orderId: orderId || eligibility.orderId || null,
      customerName,
      customerEmail: session.email,
      customerAvatar,
      rating,
      reviewText,
      images,
      isVerifiedPurchase: eligibility.isVerifiedPurchase,
      adminGranted: eligibility.adminGranted,
    });

    // Dispatch Admin Notification (Push + Email)
    try {
      const product = await dbStore.getProductById(productId);
      await notifyAdminOnNewReview(review, product);
    } catch (notifErr) {
      console.warn("[Review Admin Notification Error]:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your valuable review!",
      review,
    });
  } catch (err: any) {
    console.error("[Create Review Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

