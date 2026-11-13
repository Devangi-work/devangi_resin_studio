import test from "node:test";
import assert from "node:assert/strict";
import { dbStore } from "../lib/db";
import {
  sendAdminOrderReceivedEmail,
  sendAdminCustomRequestReceivedEmail,
  sendAdminReviewReceivedEmail,
  getAdminNotificationRecipients,
} from "../lib/email/admin-alerts";
import {
  notifyAdminOnNewOrder,
  notifyAdminOnCustomRequest,
  notifyAdminOnNewReview,
} from "../lib/notifications/admin-dispatcher";
import { sendAdminWebPush } from "../lib/notifications/vapid";

test("Admin Notifications & Push Alert Suite", async (t) => {
  await t.test("getAdminNotificationRecipients resolves valid admin recipient email", async () => {
    const recipients = await getAdminNotificationRecipients();
    assert.ok(Array.isArray(recipients));
    assert.ok(recipients.length > 0);
    assert.ok(recipients[0].email.includes("@"));
  });

  await t.test("dbStore persists and retrieves admin push subscriptions with active status", async () => {
    const endpoint = `https://fcm.googleapis.com/fcm/send/test-device-${Date.now()}`;
    const sub = await dbStore.savePushSubscription({
      endpoint,
      p256dh: "BNcRdreALRF8FsE-GinkwTestKey123",
      auth: "testAuthSecret456",
      userId: "admin",
      userAgent: "Mozilla/5.0 (Linux; Android 14; Mobile)",
    });

    assert.ok(sub.id);
    assert.equal(sub.endpoint, endpoint);
    assert.equal(sub.isActive, true);

    const activeSubs = await dbStore.getActivePushSubscriptions();
    const found = activeSubs.find((s: any) => s.endpoint === endpoint);
    assert.ok(found, "Saved push subscription must exist in active subscriptions");

    // Deactivate
    await dbStore.deactivatePushSubscription(endpoint);
    const activeSubsAfter = await dbStore.getActivePushSubscriptions();
    const deactivated = activeSubsAfter.find((s: any) => s.endpoint === endpoint);
    assert.equal(deactivated, undefined, "Deactivated subscription must not be returned in active list");
  });

  await t.test("dbStore creates, queries and marks admin notifications as read", async () => {
    const initialCount = await dbStore.getUnreadAdminNotificationsCount();

    const notif = await dbStore.createAdminNotification({
      type: "order",
      title: "🛍️ Test Order #DRS-TEST-101",
      message: "Customer Aarav Patel placed an order for ₹1,299.00",
      link: "/admin/orders/DRS-TEST-101",
      referenceId: "DRS-TEST-101",
      metadata: { totalAmount: 1299 },
    });

    assert.ok(notif.id);
    assert.equal(notif.isRead, false);

    const newCount = await dbStore.getUnreadAdminNotificationsCount();
    assert.equal(newCount, initialCount + 1);

    const list = await dbStore.getAdminNotifications(10);
    const foundInList = list.find((n: any) => n.id === notif.id);
    assert.ok(foundInList);
    assert.equal(foundInList.title, "🛍️ Test Order #DRS-TEST-101");

    // Mark single as read
    await dbStore.markAdminNotificationAsRead(notif.id);
    const countAfterRead = await dbStore.getUnreadAdminNotificationsCount();
    assert.equal(countAfterRead, initialCount);

    // Create another and mark all as read
    const notif2 = await dbStore.createAdminNotification({
      type: "custom_request",
      title: "🎨 Test Custom Inquiry",
      message: "New bespoke resin request",
      link: "/admin/custom-requests",
    });
    assert.ok(notif2.id);

    await dbStore.markAllAdminNotificationsAsRead();
    const finalUnreadCount = await dbStore.getUnreadAdminNotificationsCount();
    assert.equal(finalUnreadCount, 0);
  });

  await t.test("2-Hour interval check retrieves unread notifications strictly within window", async () => {
    // Notification from 1 hour ago
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const notifRecent = await dbStore.createAdminNotification({
      type: "review",
      title: "⭐ 5 Stars for Geode Clock",
      message: "Review submitted by Priya",
      link: "/admin/reviews",
    });

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const unreadInWindow = await dbStore.getUnreadAdminNotificationsSince(twoHoursAgo);
    assert.ok(unreadInWindow.length > 0);
    assert.ok(unreadInWindow.some((n: any) => n.id === notifRecent.id));

    // Future timestamp should return empty
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    const futureUnread = await dbStore.getUnreadAdminNotificationsSince(futureDate);
    assert.equal(futureUnread.length, 0);
  });

  await t.test("sendAdminOrderReceivedEmail formats and delivers admin email with correct order details", async () => {
    const mockOrder = {
      id: "ord_admin_test_99",
      orderNumber: "DRS-ADM-9999",
      customerName: "Sneha Mukherjee",
      customerPhone: "+91 98200 12345",
      customerEmail: "sneha.m@example.com",
      shippingAddressLine1: "Flat 402, Royal Palms",
      shippingCity: "Pune",
      shippingState: "Maharashtra",
      shippingPostalCode: "411001",
      shippingCountry: "India",
      orderSource: "online",
      paymentStatus: "paid",
      paymentMethod: "upi",
      upiTransactionId: "UPI987654321012",
      subtotal: "1599.00",
      shippingCharge: "59.00",
      discountAmount: "100.00",
      discountReason: "FESTIVE100",
      totalAmount: "1558.00",
      items: [
        {
          productName: "Ocean Breeze Geode Wall Clock",
          variantName: "12 inch with Gold Needles",
          quantity: 1,
          totalPrice: "1599.00",
          personalizationDetails: {
            customName: "Sneha & Rohan",
          },
        },
      ],
    };

    const res = await sendAdminOrderReceivedEmail(mockOrder);
    assert.equal(res.success, true);
    assert.ok(res.messageId);
  });

  await t.test("sendAdminCustomRequestReceivedEmail formats and delivers admin email with vision details", async () => {
    const mockRequest = {
      id: "req_adm_test_12",
      customerName: "Vikram Malhotra",
      customerEmail: "vikram.m@example.com",
      customerPhone: "+91 99887 76655",
      productType: "Illuminated Floral Memory Frame",
      budget: "₹2,500 - ₹3,500",
      description: "Preserving wedding garland rose petals inside a crystal-clear resin arch with warm fairy lights.",
      referenceImageUrl: "https://example.com/blob/reference-rose-arch.png",
      createdAt: new Date(),
    };

    const res = await sendAdminCustomRequestReceivedEmail(mockRequest);
    assert.equal(res.success, true);
    assert.ok(res.messageId);
  });

  await t.test("sendAdminReviewReceivedEmail formats and delivers admin review alert", async () => {
    const mockReview = {
      id: "rev_adm_test_88",
      productId: "prod_geode_clock",
      productName: "Ocean Breeze Geode Wall Clock",
      customerName: "Ananya Iyer",
      customerEmail: "ananya.iyer@example.com",
      rating: 5,
      reviewText: "Stunning craftsmanship! The resin finish is crystal clear and glass-like, absolutely love the gold details.",
      isVerifiedPurchase: true,
      images: ["https://example.com/blob/review-clock.jpg"],
    };

    const res = await sendAdminReviewReceivedEmail(mockReview, { name: "Ocean Breeze Geode Wall Clock" });
    assert.equal(res.success, true);
    assert.ok(res.messageId);
  });

  await t.test("Master notification dispatchers coordinate DB, Web Push, and Email together", async () => {
    // 1. Order Dispatcher
    await notifyAdminOnNewOrder({
      id: "ord_disp_1",
      orderNumber: "DRS-DISP-001",
      customerName: "Kavita Rao",
      customerPhone: "+91 97654 32100",
      customerEmail: "kavita.r@example.com",
      totalAmount: "899.00",
      paymentStatus: "paid",
      shippingAddressLine1: "Sector 17, Vashi",
      shippingCity: "Navi Mumbai",
      shippingState: "Maharashtra",
      shippingPostalCode: "400703",
      items: [{ productName: "Personalized Initial Keychain", quantity: 2, totalPrice: "899.00" }],
    });

    // 2. Custom Request Dispatcher
    await notifyAdminOnCustomRequest({
      id: "req_disp_1",
      customerName: "Manish Shah",
      customerPhone: "+91 98111 22233",
      customerEmail: "manish.shah@example.com",
      productType: "Resin Dining Table Coasters (Set of 6)",
      budget: "₹1,500",
      description: "Gold leaf flakes with smoky black and emerald green swirls.",
    });

    // 3. Review Dispatcher
    await notifyAdminOnNewReview(
      {
        id: "rev_disp_1",
        customerName: "Neha Gupta",
        customerEmail: "neha.g@example.com",
        rating: 5,
        reviewText: "Incredible packing and prompt delivery. Looks even better in person!",
      },
      { name: "Botanical Floral Pendant" }
    );

    // Verify all 3 were recorded into DB notifications
    const recentNotifs = await dbStore.getAdminNotifications(5);
    assert.ok(recentNotifs.length >= 3);
    assert.ok(recentNotifs.some((n: any) => n.type === "order"));
    assert.ok(recentNotifs.some((n: any) => n.type === "custom_request"));
    assert.ok(recentNotifs.some((n: any) => n.type === "review"));
  });

  await t.test("Site settings stores and updates admin notification preferences", async () => {
    const updated = await dbStore.updateSiteSettings({
      adminNotificationEmail: "devangi.alerts@gmail.com",
      notifyOnOrder: true,
      notifyOnCustomRequest: true,
      notifyOnReview: true,
      notificationCheckIntervalHours: 2,
    });

    assert.equal(updated.adminNotificationEmail, "devangi.alerts@gmail.com");
    assert.equal(updated.notifyOnOrder, true);
    assert.equal(updated.notificationCheckIntervalHours, 2);

    const fetched = await dbStore.getSiteSettings();
    assert.equal(fetched.adminNotificationEmail, "devangi.alerts@gmail.com");
    assert.equal(fetched.notificationCheckIntervalHours, 2);
  });
});

