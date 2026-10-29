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

  // 8. UPI Payment Screenshot OCR Text Parser Test
  await t.test("UPI Receipt Text Parser Extracts 12-digit UTR, Amount & Payee", async () => {
    const { parseUpiReceiptText } = await import("../lib/ocr/upi-receipt");

    // PhonePe sample receipt text
    const phonePeSample = `
      PhonePe
      Payment Successful
      Paid to Devangi Banshilal Barai
      ₹ 850.00
      UPI Ref No: 428901234567
      Transaction ID: T241011123456
      11 Oct 2026, 04:30 PM
    `;
    const parsedPhonePe = parseUpiReceiptText(phonePeSample);
    assert.equal(parsedPhonePe.detectedUtr, "428901234567");
    assert.equal(parsedPhonePe.detectedAmount, "850.00");
    assert.equal(parsedPhonePe.detectedApp, "PhonePe");
    assert.equal(parsedPhonePe.payeeMatched, true);
    assert.equal(parsedPhonePe.statusMatched, true);

    // Google Pay sample receipt text
    const gpaySample = `
      Google Pay
      Paid ₹1,299.00 to Devangi Resin Studio
      devangibarai0403@okhdfcbank
      UPI transaction ID: 529103847291
      Completed
      Oct 11, 2026
    `;
    const parsedGPay = parseUpiReceiptText(gpaySample);
    assert.equal(parsedGPay.detectedUtr, "529103847291");
    assert.equal(parsedGPay.detectedAmount, "1299.00");
    assert.equal(parsedGPay.detectedApp, "Google Pay");
    assert.equal(parsedGPay.payeeMatched, true);
    assert.equal(parsedGPay.statusMatched, true);
  });

  // 9. Order Creation with Payment Screenshot Persistence
  await t.test("Order creation persists paymentScreenshotUrl correctly", async () => {
    const orderWithReceipt = await dbStore.createOrder({
      customerName: "Aarav Patel",
      customerEmail: "aarav@example.com",
      customerPhone: "9876543210",
      shippingAddressLine1: "12 Marine Drive",
      shippingCity: "Mumbai",
      shippingState: "Maharashtra",
      shippingPostalCode: "400020",
      subtotal: 500,
      totalAmount: 500,
      paymentMethod: "upi",
      upiTransactionId: "428901234567",
      paymentScreenshotUrl: "https://blob.vercel-storage.com/payment-receipts/aarav_receipt.png",
      items: [],
    });

    assert.equal(orderWithReceipt.paymentScreenshotUrl, "https://blob.vercel-storage.com/payment-receipts/aarav_receipt.png");
    assert.equal(orderWithReceipt.upiTransactionId, "428901234567");

    const fetched = await dbStore.getOrderByNumber(orderWithReceipt.orderNumber);
    assert.equal(fetched?.paymentScreenshotUrl, "https://blob.vercel-storage.com/payment-receipts/aarav_receipt.png");
  });

  // 10. Admin Bulk Item Deletion Test
  await t.test("Admin can select and bulk delete multiple items together", async () => {
    // Create test products to delete
    const p1 = await dbStore.createProduct({
      name: "Bulk Test Item 1",
      slug: "bulk-test-item-1",
      sku: "TEST-B1",
      regularPrice: 299,
      categoryId: "cat_1",
      stockQuantity: 10,
      trackInventory: true,
      status: "draft",
    });

    const p2 = await dbStore.createProduct({
      name: "Bulk Test Item 2",
      slug: "bulk-test-item-2",
      sku: "TEST-B2",
      regularPrice: 399,
      categoryId: "cat_1",
      stockQuantity: 10,
      trackInventory: true,
      status: "draft",
    });

    assert.ok(p1.id);
    assert.ok(p2.id);

    // Verify they exist
    const beforeP1 = await dbStore.getProductById(p1.id);
    const beforeP2 = await dbStore.getProductById(p2.id);
    assert.ok(beforeP1);
    assert.ok(beforeP2);

    // Bulk delete them together
    const deleteRes = await dbStore.bulkDeleteProducts([p1.id, p2.id]);
    assert.equal(deleteRes.deleted, true);
    assert.equal(deleteRes.count, 2);

    // Verify both are deleted
    const afterP1 = await dbStore.getProductById(p1.id);
    const afterP2 = await dbStore.getProductById(p2.id);
    assert.equal(afterP1, null);
    assert.equal(afterP2, null);
  });

  // 11. Order Shipping Update & Total Recalculation (Edit Order)
  await t.test("Admin can edit order shipping yes/no, update amount and recalculate total", async () => {
    const newOrd = await dbStore.createOrder({
      customerName: "Shipping Test User",
      customerEmail: "shiptest@example.com",
      customerPhone: "9876543210",
      shippingAddressLine1: "Studio Pick-up / Walk-in",
      shippingCity: "Mumbai",
      shippingState: "Maharashtra",
      shippingPostalCode: "400001",
      shippingCountry: "India",
      subtotal: 1000,
      discountAmount: 100,
      shippingCharge: 0,
      totalAmount: 900,
      orderStatus: "confirmed",
      paymentStatus: "paid",
      paymentMethod: "upi",
      orderSource: "offline",
      items: [
        {
          productId: "test-prod",
          productName: "Resin Coaster Set",
          quantity: 2,
          unitPrice: 500,
          totalPrice: 1000,
        },
      ],
    });

    assert.ok(newOrd.id);
    assert.equal(Number(newOrd.shippingCharge), 0);
    assert.equal(Number(newOrd.totalAmount), 900);

    // Edit Order: Toggle Shipping to Yes (₹79) and update address
    const updatedWithShipping = await dbStore.updateOrderShipping(newOrd.id, 79, {
      shippingAddressLine1: "404 Marine Drive",
      shippingCity: "Mumbai",
      shippingState: "Maharashtra",
      shippingPostalCode: "400020",
    });

    assert.ok(updatedWithShipping);
    assert.equal(Number(updatedWithShipping?.shippingCharge), 79);
    // Total should be subtotal (1000) - discount (100) + shipping (79) = 979
    assert.equal(Number(updatedWithShipping?.totalAmount), 979);
    assert.equal(updatedWithShipping?.shippingAddressLine1, "404 Marine Drive");
    assert.equal(updatedWithShipping?.shippingPostalCode, "400020");

    // Edit Order: Toggle Shipping back to No (₹0 Pickup)
    const updatedBackToPickup = await dbStore.updateOrderShipping(newOrd.id, 0, {
      shippingAddressLine1: "Studio Pick-up / Direct Handover",
    });

    assert.ok(updatedBackToPickup);
    assert.equal(Number(updatedBackToPickup?.shippingCharge), 0);
    assert.equal(Number(updatedBackToPickup?.totalAmount), 900);
    assert.equal(updatedBackToPickup?.shippingAddressLine1, "Studio Pick-up / Direct Handover");
  });

  // 12. Custom Studio Inquiry Persistence & Management
  await t.test("Custom Studio form persists inquiry with user reference photo and details", async () => {
    const customReq = await dbStore.createCustomRequest({
      customerName: "Aishwarya Rai",
      customerEmail: "aishwarya@example.com",
      customerPhone: "9820011223",
      productType: "Preserved Wedding Garland Keepsake Block",
      budget: "₹3,000 - ₹5,000",
      description: "Preserve red roses from varmala in a 9-inch hexagonal resin block with gold leaf accents.",
      referenceImageUrl: "https://rus9f71hta9djnrh.public.blob.vercel-storage.com/reference-images/sample-garland.jpg",
    });

    assert.ok(customReq.id);
    assert.equal(customReq.customerName, "Aishwarya Rai");
    assert.equal(customReq.productType, "Preserved Wedding Garland Keepsake Block");
    assert.equal(customReq.referenceImageUrl, "https://rus9f71hta9djnrh.public.blob.vercel-storage.com/reference-images/sample-garland.jpg");
    assert.equal(customReq.status, "new");

    const allRequests = await dbStore.getCustomRequests();
    const found = allRequests.find((r) => r.id === customReq.id);
    assert.ok(found);
    assert.equal(found?.customerPhone, "9820011223");

    // Admin updates status to quoted
    const updated = await dbStore.updateCustomRequestStatus(customReq.id, "quoted", "Quoted ₹3,500 with gold foil", 3500);
    assert.equal(updated?.status, "quoted");
    assert.equal(updated?.adminNotes, "Quoted ₹3,500 with gold foil");
    assert.equal(Number(updated?.quoteAmount), 3500);
  });

  // 13. Orders Listing includes Products Ordered with Images
  await t.test("Orders retrieval includes items with product name and image thumbnail for admin", async () => {
    const ordersList = await dbStore.getOrders();
    assert.ok(Array.isArray(ordersList));
    assert.ok(ordersList.length > 0);
    // Ensure orders have items array attached
    for (const ord of ordersList) {
      assert.ok(Array.isArray(ord.items));
    }
  });

  // 14. Custom Studio Inquiry Conversion to Order
  await t.test("Custom Studio inquiry converted to order marks status as converted and retains reference details", async () => {
    const customInquiry = await dbStore.createCustomRequest({
      customerName: "Meera Patel",
      customerEmail: "meera@example.com",
      customerPhone: "9820456789",
      productType: "Floral Resin Wall Clock",
      budget: "₹2,500",
      description: "Custom floral wall clock with Roman numerals and preserved carnations",
      referenceImageUrl: "https://example.com/meera-floral-clock.jpg",
    });

    assert.ok(customInquiry.id);
    assert.equal(customInquiry.status, "new");

    // Convert to order: Admin creates order and updates inquiry status to converted
    const convertedReq = await dbStore.updateCustomRequestStatus(
      customInquiry.id,
      "converted",
      "Converted to Order #ORD-2026-TEST"
    );

    assert.ok(convertedReq);
    assert.equal(convertedReq?.status, "converted");
    assert.equal(convertedReq?.adminNotes, "Converted to Order #ORD-2026-TEST");

    // Verify retrieval reflects converted status
    const retrieved = await dbStore.getCustomRequestById(customInquiry.id);
    assert.ok(retrieved);
    assert.equal(retrieved?.status, "converted");
    assert.equal(retrieved?.adminNotes, "Converted to Order #ORD-2026-TEST");
  });
});
