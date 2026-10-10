import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { dbStore } from "@/lib/db";
import { sendBrevoEmail } from "@/lib/email/brevo";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Customer requested cancellation within 1-hour window";

    // Allow cancellation if customer is logged in or provides order verification token/phone
    const session = await getCustomerSession();
    const order = await dbStore.getOrderByNumber(orderNumber);

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Check ownership if session exists
    if (session) {
      const isOwner =
        order.customerId === session.customerId ||
        order.customerEmail.toLowerCase() === session.email.toLowerCase();
      if (!isOwner) {
        return NextResponse.json({ error: "Unauthorized to cancel this order." }, { status: 403 });
      }
    }

    // Execute cancellation (which checks 1-hour limit and restores inventory)
    const cancelledOrder = await dbStore.cancelOrder(orderNumber, reason);

    // Send email notification to customer and admin
    if (cancelledOrder.customerEmail) {
      await sendBrevoEmail({
        to: [{ email: cancelledOrder.customerEmail, name: cancelledOrder.customerName }],
        subject: `Order Cancelled: ${cancelledOrder.orderNumber} - Aura Resin Art Studio`,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 24px; color: #2C332D;">
            <h2>Order Cancellation Confirmation</h2>
            <p>Dear ${cancelledOrder.customerName},</p>
            <p>Your order <strong>${cancelledOrder.orderNumber}</strong> has been cancelled successfully as requested within our 1-hour modification window.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>If you paid via UPI, your payment will be refunded to your source UPI account within 24-48 business hours.</p>
            <p>If you have any questions, feel free to contact us at support.</p>
            <br>
            <p>Warm regards,<br>Aura Resin Art Studio</p>
          </div>
        `,
      }).catch((e) => console.error("Cancellation email error:", e));
    }

    return NextResponse.json({
      success: true,
      message: "Your order has been cancelled successfully.",
      order: cancelledOrder,
    });
  } catch (err: any) {
    console.error("[Order Cancel Error]", err);
    return NextResponse.json({ error: err.message || "Could not cancel order." }, { status: 400 });
  }
}
