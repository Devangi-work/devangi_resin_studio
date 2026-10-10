import { NextResponse } from "next/server";
import { dbStore } from "@/lib/db";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { sendOrderConfirmationEmail } from "@/lib/email/brevo";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature") || "";
    const timestamp = request.headers.get("x-webhook-timestamp") || "";

    // 1. Verify Cashfree signature
    const isSignatureValid = verifyCashfreeWebhookSignature(rawBody, timestamp, signature);
    if (!isSignatureValid) {
      console.warn("Cashfree webhook signature mismatch.");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    const eventType = payload.type || payload.event || "";
    const orderData = payload.data?.order || payload.order;
    const paymentData = payload.data?.payment || payload.payment;
    const orderId = orderData?.order_id || payload.order_id;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    // Handle PAYMENT_SUCCESS / ORDER_PAID event
    if (
      eventType === "PAYMENT_SUCCESS_WEBHOOK" ||
      eventType === "ORDER_PAID" ||
      paymentData?.payment_status === "SUCCESS"
    ) {
      const order = await dbStore.getOrderByNumber(orderId);
      if (order && order.paymentStatus !== "paid") {
        const updatedOrder = await dbStore.updateOrderPaymentStatus(order.id, "paid", paymentData);
        try {
          await sendOrderConfirmationEmail(updatedOrder);
        } catch (e) {
          console.error("Webhook email notification error:", e);
        }
      }
    }

    return NextResponse.json({ status: "ok", received: true });
  } catch (err: any) {
    console.error("Cashfree webhook processing error:", err);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
