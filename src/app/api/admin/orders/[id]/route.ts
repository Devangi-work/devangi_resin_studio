import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateOrderSchema = z.object({
  orderStatus: z.enum([
    "pending_payment",
    "confirmed",
    "processing",
    "ready_to_ship",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]).optional(),
  paymentStatus: z.enum([
    "paid",
    "unpaid",
    "pending",
    "pending_verification",
    "failed",
    "cancelled",
  ]).optional(),
  paymentScreenshotUrl: z.string().optional().nullable(),
  trackingNumber: z.string().optional(),
  courierName: z.string().optional(),
  internalNotes: z.string().optional(),
  packingImages: z.array(z.string()).optional(),
  productImages: z.array(z.string()).optional(),
  shippingCharge: z.number().min(0).optional(),
  shippingAddressLine1: z.string().optional(),
  shippingAddressLine2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    const order = await dbStore.getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const { id } = await params;
    const body = await request.json();
    const result = updateOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      orderStatus,
      paymentStatus,
      paymentScreenshotUrl,
      trackingNumber,
      courierName,
      internalNotes,
      packingImages,
      shippingCharge,
      shippingAddressLine1,
      shippingAddressLine2,
      shippingCity,
      shippingState,
      shippingPostalCode,
    } = result.data;
    let order = await dbStore.getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      shippingCharge !== undefined ||
      shippingAddressLine1 !== undefined ||
      shippingAddressLine2 !== undefined ||
      shippingCity !== undefined ||
      shippingState !== undefined ||
      shippingPostalCode !== undefined
    ) {
      order = await dbStore.updateOrderShipping(
        id,
        shippingCharge !== undefined ? shippingCharge : Number(order.shippingCharge || 0),
        {
          shippingAddressLine1,
          shippingAddressLine2,
          shippingCity,
          shippingState,
          shippingPostalCode,
        }
      );
    }

    if (paymentStatus && paymentStatus !== order?.paymentStatus) {
      order = await dbStore.updateOrderPaymentStatus(id, paymentStatus);
    }

    if (paymentScreenshotUrl !== undefined) {
      order = await dbStore.updateOrderPaymentScreenshot(id, paymentScreenshotUrl || "");
    }

    if (packingImages) {
      order = await dbStore.updateOrderPackingImages(id, packingImages);
    }

    if (trackingNumber) {
      order = await dbStore.updateTracking(id, trackingNumber, courierName || order.courierName || "Standard Courier");
    }

    if (orderStatus) {
      order = await dbStore.updateOrderStatus(
        id,
        orderStatus,
        internalNotes,
        admin.email,
        trackingNumber,
        courierName,
        packingImages
      );
    } else if (internalNotes) {
      order = await dbStore.updateOrderStatus(id, order.orderStatus, internalNotes, admin.email);
    }

    // Return fresh state
    const freshOrder = await dbStore.getOrderById(id);
    const resolvedOrder = freshOrder || order;

    try {
      revalidatePath("/admin/orders");
      if (resolvedOrder?.orderNumber) {
        revalidatePath(`/orders/${resolvedOrder.orderNumber}`);
      }
      revalidatePath("/track-order");
      revalidatePath("/account");
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, order: resolvedOrder });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
