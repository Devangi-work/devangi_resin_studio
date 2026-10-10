import { NextResponse } from "next/server";
import { dbStore } from "@/lib/db";
import { verifyCashfreePayment } from "@/lib/cashfree";
import { sendOrderConfirmationEmail } from "@/lib/email/brevo";

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await dbStore.getOrderByNumber(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If order is already verified and paid, return idempotently
    if (order.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        order,
      });
    }

    // Verify independently with Cashfree
    const verification = await verifyCashfreePayment(orderId);

    if (verification.verified && verification.paymentStatus === "SUCCESS") {
      // Mark order as paid & confirmed (automatically handles idempotent inventory decrement)
      const updatedOrder = await dbStore.updateOrderPaymentStatus(order.id, "paid", verification);

      // Send Brevo confirmation email
      try {
        await sendOrderConfirmationEmail(updatedOrder);
      } catch (emailErr) {
        console.error("Order confirmation email failed:", emailErr);
      }

      return NextResponse.json({
        success: true,
        order: updatedOrder,
      });
    }

    return NextResponse.json(
      {
        success: false,
        paymentStatus: verification.paymentStatus,
        message: "Payment is pending or unverified.",
      },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Verify payment error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
