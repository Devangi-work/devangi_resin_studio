import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { sendOrderStatusEmail, sendOrderConfirmationEmail } from "@/lib/email/brevo";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const targetStatus = body.status || (body.type === "confirmation" ? "confirmed" : undefined);

    const order = await dbStore.getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.customerEmail || order.customerEmail.startsWith("offline_") || !order.customerEmail.includes("@")) {
      return NextResponse.json(
        { error: "This order does not have a valid customer email address." },
        { status: 400 }
      );
    }

    const statusToSend = targetStatus || order.orderStatus || "confirmed";
    const emailResult = await sendOrderStatusEmail(order, statusToSend);

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: `Order ${statusToSend} email dispatched to ${order.customerEmail}.`,
        messageId: emailResult.messageId,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: typeof emailResult.error === "string" ? emailResult.error : "Failed to deliver email through Brevo.",
        details: emailResult.error,
      },
      { status: 502 }
    );
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

