import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { dbStore } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const orderNumberOrId = body.orderNumber || body.orderId;

    if (!orderNumberOrId) {
      return NextResponse.json({ error: "Order identifier required" }, { status: 400 });
    }

    await dbStore.discardUnpaidOrder(orderNumberOrId);
    return NextResponse.json({ success: true, discarded: true });
  } catch (err: any) {
    console.error("[Unpaid Discard Error]:", err);
    return NextResponse.json({ error: "Failed to discard order" }, { status: 500 });
  }
}
