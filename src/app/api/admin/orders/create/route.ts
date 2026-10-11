import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { z } from "zod";

const createOfflineOrderSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().min(10, "Phone number is required"),
  shippingAddressLine1: z.string().optional().default("Offline / Pick-up / Studio"),
  shippingAddressLine2: z.string().optional().default(""),
  shippingCity: z.string().optional().default("Mumbai"),
  shippingState: z.string().optional().default("Maharashtra"),
  shippingPostalCode: z.string().optional().default("400001"),
  orderSource: z.enum(["offline", "exhibition", "instagram", "custom", "online"]).default("offline"),
  paymentMethod: z.enum(["cash", "upi", "card", "bank_transfer"]).default("cash"),
  paymentStatus: z.enum(["paid", "unpaid", "pending"]).default("paid"),
  orderStatus: z.enum(["confirmed", "processing", "ready_to_ship", "shipped", "delivered"]).default("confirmed"),
  items: z.array(
    z.object({
      productId: z.string().optional().nullable(),
      productName: z.string().min(1, "Product name is required"),
      variantName: z.string().optional().nullable(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
      totalPrice: z.number().min(0),
    })
  ).min(1, "At least one product item is required"),
  subtotal: z.number().min(0),
  discountAmount: z.number().optional().default(0),
  shippingCharge: z.number().optional().default(0),
  totalAmount: z.number().min(0),
  orderNotes: z.string().optional().default(""),
  internalNotes: z.string().optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();
    const body = await request.json();
    const result = createOfflineOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const orderNumber = `OFF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = await dbStore.createOrder({
      orderNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail || `offline_${Date.now()}@devangiresinstudio.com`,
      customerPhone: data.customerPhone,
      shippingAddressLine1: data.shippingAddressLine1,
      shippingAddressLine2: data.shippingAddressLine2,
      shippingCity: data.shippingCity,
      shippingState: data.shippingState,
      shippingPostalCode: data.shippingPostalCode,
      shippingCountry: "India",
      orderSource: data.orderSource,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      orderStatus: data.orderStatus,
      subtotal: data.subtotal,
      discountAmount: data.discountAmount,
      shippingCharge: data.shippingCharge,
      taxAmount: 0,
      totalAmount: data.totalAmount,
      orderNotes: data.orderNotes,
      internalNotes: `Created manually by admin (${admin.email}) [Source: ${data.orderSource}]\n${data.internalNotes}`.trim(),
      items: data.items,
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err: any) {
    console.error("[Create Offline Order Error]:", err);
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
  }
}
