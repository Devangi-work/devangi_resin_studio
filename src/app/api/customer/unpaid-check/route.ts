import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { dbStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ hasUnpaidOrder: false });
    }

    const unpaidOrder = await dbStore.getCustomerLatestUnpaidOrder(session.customerId || session.email);
    if (!unpaidOrder) {
      return NextResponse.json({ hasUnpaidOrder: false });
    }

    return NextResponse.json({
      hasUnpaidOrder: true,
      orderNumber: unpaidOrder.orderNumber,
      orderId: unpaidOrder.id,
    });
  } catch (err: any) {
    console.error("[Unpaid Check Error]:", err);
    return NextResponse.json({ hasUnpaidOrder: false });
  }
}
