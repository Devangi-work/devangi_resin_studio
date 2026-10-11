import test from "node:test";
import assert from "node:assert/strict";
import { dbStore } from "../lib/db/index";
import { hashPassword, verifyPassword, signAdminSession, verifyAdminSession } from "../lib/auth/index";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "../lib/blob/index";

test("E-Commerce Test Suite", async (t) => {
  // 1. Admin Authentication & Hashing
  await t.test("Admin Password Hashing & Verification", async () => {
    const rawPass = "ArtisanSecurePass123!";
    const hash = await hashPassword(rawPass);
    assert.notEqual(hash, rawPass);
    const valid = await verifyPassword(rawPass, hash);
    assert.equal(valid, true);
    const invalid = await verifyPassword("WrongPassword", hash);
    assert.equal(invalid, false);
  });

  await t.test("Admin JWT Session Signing & Verification", async () => {
    const payload = {
      userId: "adm_test_123",
      email: "owner@auraresinart.com",
      role: "owner",
      fullName: "Lead Studio Artist",
    };
    const token = await signAdminSession(payload);
    assert.ok(token);
    assert.ok(token.length > 20);

    const verified = await verifyAdminSession(token);
    assert.ok(verified);
    assert.equal(verified?.email, "owner@auraresinart.com");
    assert.equal(verified?.role, "owner");
  });

  // 2. Category Management
  await t.test("Category Creation & Validation", async () => {
    const newCat = await dbStore.createCategory({
      name: "Resin Wall Clocks",
      slug: "resin-wall-clocks",
      description: "Artisan geode timepieces.",
    });
    assert.ok(newCat.id);
    assert.equal(newCat.slug, "resin-wall-clocks");

    const fetched = await dbStore.getCategoryBySlug("resin-wall-clocks");
    assert.ok(fetched);
    assert.equal(fetched?.name, "Resin Wall Clocks");
  });

  // 3. Product CRUD & Safeguards
  await t.test("Product Creation, Retrieval & Duplication", async () => {
    const prod = await dbStore.createProduct({
      name: "Geode Crystal Table Clock",
      slug: "geode-crystal-table-clock",
      description: "Handcrafted table clock with real raw quartz.",
      categoryId: "cat_coasters",
      sku: "CLK-GEO-001",
      regularPrice: "1499.00",
      salePrice: "1299.00",
      stockQuantity: 10,
      trackInventory: true,
      status: "published",
    });
    assert.ok(prod.id);
    assert.equal(prod.regularPrice, "1499.00");
    assert.equal(prod.stockQuantity, 10);

    // Duplicate product
    const dup = await dbStore.duplicateProduct(prod.id);
    assert.ok(dup);
    assert.equal(dup?.status, "draft");
    assert.ok(dup?.name.includes("(Copy)"));
    assert.notEqual(dup?.slug, prod.slug);
  });

  // 4. Cart & Coupon Validation
  await t.test("Coupon Validation & Cart Price Calculation", async () => {
    const couponRes = await dbStore.validateCoupon("WELCOME10", 1200);
    assert.equal(couponRes.valid, true);
    // 10% of 1200 = 120
    assert.equal(couponRes.discountAmount, 120);

    const invalidCoupon = await dbStore.validateCoupon("INVALIDCODE999", 1200);
    assert.equal(invalidCoupon.valid, false);

    // Below minimum cart amount requirement
    const belowMin = await dbStore.validateCoupon("RESIN100", 300);
    assert.equal(belowMin.valid, false);
  });

  // 5. Order Creation & Idempotent Stock Deduction
  await t.test("Order Lifecycle, Payment Status & Inventory Transaction", async () => {
    const initialProds = await dbStore.getProducts();
    const targetProd = initialProds.products[0];
    const initialStock = targetProd.stockQuantity;

    // Create Order
    const order = await dbStore.createOrder({
      customerName: "Sneha Patel",
      customerEmail: "sneha@example.com",
      customerPhone: "+91 98765 00000",
      shippingAddressLine1: "123 Coral Villa",
      shippingCity: "Ahmedabad",
      shippingState: "Gujarat",
      shippingPostalCode: "380015",
      subtotal: 1099,
      totalAmount: 1099,
      orderStatus: "pending_payment",
      paymentStatus: "pending",
      items: [
        {
          productId: targetProd.id,
          productName: targetProd.name,
          sku: targetProd.sku,
          quantity: 2,
          unitPrice: "1099.00",
          totalPrice: "2198.00",
        },
      ],
    });
    assert.ok(order.orderNumber);
    assert.equal(order.paymentStatus, "pending");

    // Simulate First Verified Payment -> Stock Decrement
    const updatedOrder = await dbStore.updateOrderPaymentStatus(order.id, "paid");
    assert.equal(updatedOrder?.paymentStatus, "paid");
    assert.equal(updatedOrder?.orderStatus, "confirmed");

    const refreshedProd = await dbStore.getProductById(targetProd.id);
    assert.equal(refreshedProd?.stockQuantity, initialStock - 2);

    // Simulate Duplicate Payment Event (Idempotency check)
    // Calling updateOrderPaymentStatus on an already paid order should not decrement stock a second time!
    await dbStore.updateOrderPaymentStatus(order.id, "paid");
    const idempotentProd = await dbStore.getProductById(targetProd.id);
    assert.equal(idempotentProd?.stockQuantity, initialStock - 2);
  });


  // 7. Image File Restrictions
  await t.test("Media Upload Allowed Formats and Size Limit Safeguards", async () => {
    assert.ok(ALLOWED_IMAGE_TYPES.includes("image/jpeg"));
    assert.ok(ALLOWED_IMAGE_TYPES.includes("image/png"));
    assert.ok(ALLOWED_IMAGE_TYPES.includes("image/webp"));
    assert.equal(ALLOWED_IMAGE_TYPES.includes("application/pdf"), false);
    assert.equal(MAX_FILE_SIZE_BYTES, 5 * 1024 * 1024);
  });
});
