import test from "node:test";
import assert from "node:assert/strict";
import { dbStore } from "../lib/db/index";

test("Reviews & Delivered Order Popup Test Suite", async (t) => {
  // Setup sample test user and product
  const testCustomerId = "cust_test_reviewer";
  const testCustomerEmail = "reviewer.test@example.com";
  const testCustomerName = "Meera Krishnan";
  const testProductId = "prod_ocean_coasters";

  await t.test("Initial Eligibility: User without delivered order or permission cannot review directly", async () => {
    const unauthEligibility = await dbStore.checkUserReviewEligibility(testProductId);
    assert.equal(unauthEligibility.canReview, false);

    const normalUserEligibility = await dbStore.checkUserReviewEligibility(
      testProductId,
      "unrelated_user",
      "noorder@example.com"
    );
    assert.equal(normalUserEligibility.canReview, false);
    assert.ok(normalUserEligibility.reason?.includes("verified"));
  });

  await t.test("Admin can grant review permission to any registered user for any product", async () => {
    // Register/mock customer in dbStore
    const customer = await dbStore.createCustomerOrGet({
      name: testCustomerName,
      email: testCustomerEmail,
      phone: "+91 9988776655",
    });

    // Admin grants permission
    const perm = await dbStore.grantReviewPermission(customer.id, testProductId, "admin_test");
    assert.ok(perm);
    assert.equal(perm.productId, testProductId);
    assert.equal(perm.customerId, customer.id);
    assert.equal(perm.hasReviewed, false);

    // Verify user eligibility now allows review with adminGranted = true
    const eligibility = await dbStore.checkUserReviewEligibility(
      testProductId,
      customer.id,
      customer.email
    );
    assert.equal(eligibility.canReview, true);
    assert.equal(eligibility.adminGranted, true);
    assert.equal(eligibility.isVerifiedPurchase, false);
  });

  await t.test("User with admin permission submits review with rating, images, and text limit (up to 900 chars)", async () => {
    const customer = await dbStore.getCustomerByEmail(testCustomerEmail);
    assert.ok(customer);

    const reviewText = "Stunning ocean wave depth with realistic foam effects! Packaging was pristine.";
    assert.ok(reviewText.length <= 900);

    const created = await dbStore.createReview({
      productId: testProductId,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerAvatar: "/images/logo/resin_logo.png",
      rating: 5,
      reviewText,
      images: [
        "/images/logo/resin_logo.png",
        "/images/home/Devangi_Resin_Studio_Handmade_Keepsakes.png",
      ],
      adminGranted: true,
      isVerifiedPurchase: false,
    });

    assert.ok(created.id);
    assert.equal(created.rating, 5);
    assert.equal(created.reviewText, reviewText);
    assert.equal(created.images.length, 2);
    assert.equal(created.adminGranted, true);

    // Permission record should now be marked hasReviewed = true
    const perms = await dbStore.getReviewPermissions();
    const userPerm = perms.find((p) => p.productId === testProductId && p.customerId === customer.id);
    assert.ok(userPerm);
    assert.equal(userPerm.hasReviewed, true);

    // Trying to review again should be blocked
    const reEligibility = await dbStore.checkUserReviewEligibility(
      testProductId,
      customer.id,
      customer.email
    );
    assert.equal(reEligibility.canReview, false);
    assert.equal(reEligibility.hasAlreadyReviewed, true);
  });

  await t.test("Product reviews query returns all reviews, statistics breakdown, and user photos", async () => {
    const data = await dbStore.getReviewsByProduct(testProductId);
    assert.ok(data.reviews.length >= 1);
    assert.ok(data.stats.averageRating >= 4.0);
    assert.ok(data.stats.totalReviews >= 1);
    assert.ok(data.stats.distribution[5] >= 1);

    // Verify reviewer details exist
    const sample = data.reviews.find((r) => r.customerEmail === testCustomerEmail);
    assert.ok(sample);
    assert.equal(sample.customerName, testCustomerName);
    assert.ok(sample.images.length > 0);
  });

  await t.test("Review Likes: Users can like reviews and increment/decrement like counts", async () => {
    const reviews = await dbStore.getAllReviews();
    assert.ok(reviews.length > 0);
    const targetReview = reviews[0];
    const initialLikes = targetReview.likesCount || 0;

    const testUserLiker = "user_liker_101";

    // Like review
    const likeResult = await dbStore.toggleReviewLike(targetReview.id, testUserLiker);
    assert.equal(likeResult.liked, true);
    assert.equal(likeResult.likesCount, initialLikes + 1);

    // Unlike review (toggling again)
    const unlikeResult = await dbStore.toggleReviewLike(targetReview.id, testUserLiker);
    assert.equal(unlikeResult.liked, false);
    assert.equal(unlikeResult.likesCount, initialLikes);
  });

  await t.test("Delivered Order Popup: Triggers when order reaches delivered status", async () => {
    const deliveredCustomerEmail = "delivered.buyer@example.com";
    const orderNumber = "RA-TEST-DELIV-99";

    // Create an order in 'confirmed' status
    const order = await dbStore.createOrder({
      orderNumber,
      customerName: "Siddharth Rao",
      customerEmail: deliveredCustomerEmail,
      customerPhone: "+91 9123456789",
      shippingAddressLine1: "12 Marine Drive",
      shippingCity: "Mumbai",
      shippingState: "Maharashtra",
      shippingPostalCode: "400020",
      subtotal: "999.00",
      totalAmount: "999.00",
      paymentMethod: "upi",
      orderStatus: "shipped",
      paymentStatus: "paid",
      secureLookupToken: "tok_test_deliv_99",
      items: [
        {
          productId: "prod_amethyst_clock",
          productName: "Raw Amethyst Geode Resin Wall Clock",
          sku: "CLK-AME-001",
          unitPrice: "999.00",
          quantity: 1,
          totalPrice: "999.00",
        },
      ],
    });

    assert.ok(order);

    // Before delivery: popup should NOT trigger
    let check = await dbStore.getDeliveredUnreviewedOrders(deliveredCustomerEmail);
    assert.equal(check, null);

    // Admin marks order delivered
    await dbStore.updateOrderStatus(order.id, "delivered");

    // After delivery: popup SHOULD trigger with order details and items
    check = await dbStore.getDeliveredUnreviewedOrders(deliveredCustomerEmail);
    assert.ok(check);
    assert.equal(check.orderNumber, orderNumber);
    assert.equal(check.orderStatus, "delivered");
    assert.ok(check.items.length > 0);
    assert.equal(check.items[0].productId, "prod_amethyst_clock");

    // Once dismissed or reviewed, popup does not re-trigger
    await dbStore.markOrderDeliveredPopupSeen(order.id);
    const dismissedCheck = await dbStore.getDeliveredUnreviewedOrders(deliveredCustomerEmail);
    assert.equal(dismissedCheck, null);
  });

  await t.test("Admin can view all reviews with product specified, likes count, and delete review", async () => {
    const allReviews = await dbStore.getAllReviews();
    assert.ok(allReviews.length > 0);

    for (const r of allReviews) {
      assert.ok(r.productName, "Product name must be present on review");
      assert.ok(typeof r.likesCount === "number", "Likes count must be numeric");
      assert.ok(r.rating >= 1 && r.rating <= 5, "Rating must be 1 to 5");
      assert.ok(r.customerName, "Customer name must be present");
    }

    // Delete review test
    const toDelete = allReviews[0];
    const deleteRes = await dbStore.deleteReview(toDelete.id);
    assert.equal(deleteRes.success, true);

    const afterDelete = await dbStore.getAllReviews();
    assert.equal(afterDelete.some((r) => r.id === toDelete.id), false);
  });

  await t.test("Admin can revoke review permission", async () => {
    const testCust = await dbStore.createCustomerOrGet({
      name: "Temporary Invited User",
      email: "temp.invite@example.com",
    });

    const perm = await dbStore.grantReviewPermission(testCust.id, "prod_golden_bookmark");
    assert.ok(perm);

    const revoked = await dbStore.revokeReviewPermission(perm.id);
    assert.equal(revoked.success, true);

    const permsAfter = await dbStore.getReviewPermissions();
    assert.equal(permsAfter.some((p) => p.id === perm.id), false);
  });
});

