import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { dbStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getCustomerSession();
    const { searchParams } = new URL(request.url);
    const guestOrderNumber = searchParams.get("guestOrderNumber");

    const identifier = session?.customerId || session?.email || guestOrderNumber;
    if (!identifier) {
      return NextResponse.json({ hasDeliveredOrder: false });
    }

    const order = await dbStore.getDeliveredUnreviewedOrders(identifier);
    if (!order) {
      return NextResponse.json({ hasDeliveredOrder: false });
    }

    return NextResponse.json({
      hasDeliveredOrder: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        totalAmount: order.totalAmount,
        deliveredAt: order.updatedAt || order.createdAt,
        items: order.items || [],
      },
    });
  } catch (err: any) {
    console.error("[Delivered Check Error]:", err);
    return NextResponse.json({ hasDeliveredOrder: false });
  }
}

