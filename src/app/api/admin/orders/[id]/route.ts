import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { z } from "zod";

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
  trackingNumber: z.string().optional(),
  courierName: z.string().optional(),
  internalNotes: z.string().optional(),
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

    const { orderStatus, trackingNumber, courierName, internalNotes } = result.data;
    let order = await dbStore.getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (trackingNumber && courierName) {
      order = await dbStore.updateTracking(id, trackingNumber, courierName);
    }

    if (orderStatus && orderStatus !== order?.orderStatus) {
      order = await dbStore.updateOrderStatus(id, orderStatus, internalNotes, admin.email);
    } else if (internalNotes) {
      order = await dbStore.updateOrderStatus(id, order.orderStatus, internalNotes, admin.email);
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
