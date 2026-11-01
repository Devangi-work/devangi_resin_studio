import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateOrderSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().nullable().or(z.literal("")),
  customerPhone: z.string().optional().nullable().or(z.literal("")),
  shippingAddressLine1: z.string().optional().nullable().or(z.literal("")),
  shippingAddressLine2: z.string().optional().nullable().or(z.literal("")),
  shippingCity: z.string().optional().nullable().or(z.literal("")),
  shippingState: z.string().optional().nullable().or(z.literal("")),
  shippingPostalCode: z.string().optional().nullable().or(z.literal("")),
  shippingCountry: z.string().optional().nullable().or(z.literal("")),
  orderSource: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  paymentStatus: z.string().optional().nullable(),
  orderStatus: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable().or(z.literal("")),
  courierName: z.string().optional().nullable().or(z.literal("")),
  upiTransactionId: z.string().optional().nullable().or(z.literal("")),
  paymentScreenshotUrl: z.string().optional().nullable().or(z.literal("")),
  orderNotes: z.string().optional().nullable().or(z.literal("")),
  internalNotes: z.string().optional().nullable().or(z.literal("")),
  subtotal: z.union([z.number(), z.string()]).transform((v) => Number(v) || 0).optional(),
  discountAmount: z.union([z.number(), z.string()]).transform((v) => Number(v) || 0).optional(),
  discountReason: z.string().optional().nullable().or(z.literal("")),
  shippingCharge: z.union([z.number(), z.string()]).transform((v) => Number(v) || 0).optional(),
  totalAmount: z.union([z.number(), z.string()]).transform((v) => Number(v) || 0).optional(),
  packingImages: z.array(z.string()).optional().nullable(),
  productImages: z.array(z.string()).optional().nullable(),
  items: z.array(
    z.object({
      id: z.string().optional().nullable(),
      productId: z.string().optional().nullable(),
      productName: z.string().min(1, "Product name cannot be empty"),
      variantName: z.string().optional().nullable(),
      sku: z.string().optional().nullable(),
      quantity: z.union([z.number(), z.string()]).transform((v) => Math.max(1, parseInt(String(v), 10) || 1)),
      unitPrice: z.union([z.number(), z.string()]).transform((v) => Math.max(0, parseFloat(String(v)) || 0)),
      price: z.union([z.number(), z.string()]).transform((v) => Math.max(0, parseFloat(String(v)) || 0)).optional(),
      totalPrice: z.union([z.number(), z.string()]).transform((v) => Math.max(0, parseFloat(String(v)) || 0)).optional(),
      personalizationDetails: z.any().optional(),
      referenceImageUrl: z.string().optional().nullable(),
      productImage: z.string().optional().nullable(),
    })
  ).optional().nullable(),
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
