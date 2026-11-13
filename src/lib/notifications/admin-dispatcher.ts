import { dbStore } from "@/lib/db";
import { sendAdminWebPush } from "@/lib/notifications/vapid";
import {
  sendAdminOrderReceivedEmail,
  sendAdminCustomRequestReceivedEmail,
  sendAdminReviewReceivedEmail,
} from "@/lib/email/admin-alerts";

/**
 * Master dispatcher for New Order alerts.
 * 1. Saves notification in admin database for the Notification Center.
 * 2. Fires Web Push notification to mobile notification bar (even when browser is closed).
 * 3. Sends accurate, styled order email to admin inbox via Brevo.
 */
export async function notifyAdminOnNewOrder(order: any): Promise<void> {
  try {
    const settings = await dbStore.getSiteSettings();
    if (settings.notifyOnOrder === false) {
      console.log("[Admin Dispatcher] Order notifications are disabled in settings.");
      return;
    }

    const orderNumber = order.orderNumber || "New";
    const totalAmount = Number(order.totalAmount || 0).toFixed(2);
    const customerName = order.customerName || "Customer";
    const title = `🛍️ New Order #${orderNumber} (₹${totalAmount})`;
    const message = `${customerName} placed an order for ₹${totalAmount}. Tap to view full shipping & payment details.`;
    const link = `/admin/orders/${order.id || order.orderNumber}`;

    // 1. Record in DB
    await dbStore.createAdminNotification({
      type: "order",
      title,
      message,
      link,
      referenceId: order.id || order.orderNumber,
      metadata: {
        orderNumber,
        totalAmount,
        customerName,
        paymentStatus: order.paymentStatus,
        orderSource: order.orderSource,
      },
    });

    // 2. Dispatch Mobile / Web Push Notification
    await sendAdminWebPush({
      title,
      body: message,
      url: link,
      type: "order",
      tag: `order-${order.orderNumber || order.id}`,
      metadata: { orderId: order.id, orderNumber },
    }).catch((pushErr) => {
      console.warn("[Admin Dispatcher] Web push failed:", pushErr?.message || pushErr);
    });

    // 3. Dispatch Admin Email
    await sendAdminOrderReceivedEmail(order).catch((emailErr) => {
      console.warn("[Admin Dispatcher] Admin order email failed:", emailErr?.message || emailErr);
    });
  } catch (err: any) {
    console.error("[notifyAdminOnNewOrder Fatal Error]:", err?.message || err);
  }
}

/**
 * Master dispatcher for Custom Studio Inquiry alerts.
 * 1. Saves notification in admin database.
 * 2. Fires Web Push notification to mobile notification bar.
 * 3. Sends accurate custom inquiry email with customer vision & details to admin inbox.
 */
export async function notifyAdminOnCustomRequest(request: any): Promise<void> {
  try {
    const settings = await dbStore.getSiteSettings();
    if (settings.notifyOnCustomRequest === false) {
      console.log("[Admin Dispatcher] Custom inquiry notifications are disabled in settings.");
      return;
    }

    const customerName = request.customerName || "Customer";
    const productType = request.productType || "Bespoke Resin Piece";
    const title = `🎨 New Custom Studio Inquiry: ${productType}`;
    const message = `${customerName} submitted a vision for ${productType} (Budget: ${request.budget || "Flexible"}). Tap to review.`;
    const link = `/admin/custom-requests`;

    // 1. Record in DB
    await dbStore.createAdminNotification({
      type: "custom_request",
      title,
      message,
      link,
      referenceId: request.id,
      metadata: {
        customerName,
        customerPhone: request.customerPhone,
        customerEmail: request.customerEmail,
        productType,
        budget: request.budget,
      },
    });

    // 2. Dispatch Mobile / Web Push Notification
    await sendAdminWebPush({
      title,
      body: message,
      url: link,
      type: "custom_request",
      tag: `custom-${request.id || Date.now()}`,
      metadata: { requestId: request.id },
    }).catch((pushErr) => {
      console.warn("[Admin Dispatcher] Web push failed:", pushErr?.message || pushErr);
    });

    // 3. Dispatch Admin Email
    await sendAdminCustomRequestReceivedEmail(request).catch((emailErr) => {
      console.warn("[Admin Dispatcher] Custom request email failed:", emailErr?.message || emailErr);
    });
  } catch (err: any) {
    console.error("[notifyAdminOnCustomRequest Fatal Error]:", err?.message || err);
  }
}

/**
 * Master dispatcher for New Review alerts.
 * 1. Saves notification in admin database.
 * 2. Fires Web Push notification to mobile notification bar.
 * 3. Sends accurate review email to admin inbox.
 */
export async function notifyAdminOnNewReview(review: any, product?: any): Promise<void> {
  try {
    const settings = await dbStore.getSiteSettings();
    if (settings.notifyOnReview === false) {
      console.log("[Admin Dispatcher] Review notifications are disabled in settings.");
      return;
    }

    const customerName = review.customerName || "A customer";
    const productName = product?.name || review.productName || "Handmade Resin Creation";
    const rating = review.rating || 5;
    const title = `⭐ New Review: ${rating}/5 Stars for "${productName}"`;
    const message = `${customerName} wrote: "${(review.reviewText || "Great artwork!").slice(0, 80)}..." Tap to moderate.`;
    const link = `/admin/reviews`;

    // 1. Record in DB
    await dbStore.createAdminNotification({
      type: "review",
      title,
      message,
      link,
      referenceId: review.id,
      metadata: {
        customerName,
        productId: review.productId,
        productName,
        rating,
      },
    });

    // 2. Dispatch Mobile / Web Push Notification
    await sendAdminWebPush({
      title,
      body: message,
      url: link,
      type: "review",
      tag: `review-${review.id || Date.now()}`,
      metadata: { reviewId: review.id },
    }).catch((pushErr) => {
      console.warn("[Admin Dispatcher] Web push failed:", pushErr?.message || pushErr);
    });

    // 3. Dispatch Admin Email
    await sendAdminReviewReceivedEmail(review, product).catch((emailErr) => {
      console.warn("[Admin Dispatcher] Review email failed:", emailErr?.message || emailErr);
    });
  } catch (err: any) {
    console.error("[notifyAdminOnNewReview Fatal Error]:", err?.message || err);
  }
}

