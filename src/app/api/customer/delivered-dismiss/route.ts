import { NextResponse } from "next/server";
import { dbStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderNumberOrId = body.orderNumber || body.orderId;

    if (!orderNumberOrId) {
      return NextResponse.json({ error: "Missing orderNumber or orderId" }, { status: 400 });
    }

    await dbStore.markOrderDeliveredPopupSeen(orderNumberOrId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Delivered Dismiss Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

