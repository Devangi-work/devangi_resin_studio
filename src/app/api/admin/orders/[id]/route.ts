import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateOrderSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().nullable().or(z.literal("")),
  customerPhone: z.string().optional(),
  shippingAddressLine1: z.string().optional(),
  shippingAddressLine2: z.string().optional().nullable(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),
  orderSource: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().optional(),
  orderStatus: z.string().optional(),
  trackingNumber: z.string().optional().nullable(),
  courierName: z.string().optional().nullable(),
  upiTransactionId: z.string().optional().nullable(),
  paymentScreenshotUrl: z.string().optional().nullable(),
  orderNotes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  subtotal: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  shippingCharge: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  packingImages: z.array(z.string()).optional(),
  productImages: z.array(z.string()).optional(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      productId: z.string().optional().nullable(),
      productName: z.string().min(1),
      variantName: z.string().optional().nullable(),
      sku: z.string().optional().nullable(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
      price: z.number().min(0).optional(),
      totalPrice: z.number().min(0).optional(),
      personalizationDetails: z.any().optional(),
      referenceImageUrl: z.string().optional().nullable(),
    })
  ).optional(),
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

    const resolvedOrder = await dbStore.updateOrder(id, result.data, admin.email);

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
