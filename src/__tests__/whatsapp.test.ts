import test from "node:test";
import assert from "node:assert/strict";
import {
  formatWhatsAppNumber,
  buildSingleProductWhatsAppMessage,
  buildCartWhatsAppMessage,
  getWhatsAppUrl,
  formatCombinedAddress,
} from "../lib/whatsapp";
import { getProductionSiteUrl } from "../lib/email/brevo";
import {
  buildUpiPaymentUri,
  generateUpiQrCodeDataUrl,
  generatePaymentReference,
} from "../lib/upi";
import { defaultPolicyTemplates } from "../lib/policies-default";
import { dbStore } from "../lib/db";

test("WhatsApp Integration Test Suite", async (t) => {
  await t.test("formatWhatsAppNumber cleans formatting and handles 10-digit/12-digit Indian numbers", () => {
    assert.equal(formatWhatsAppNumber("+91 99673 13355"), "919967313355");
    assert.equal(formatWhatsAppNumber("9967313355"), "919967313355");
    assert.equal(formatWhatsAppNumber("919967313355"), "919967313355");
    assert.equal(formatWhatsAppNumber("+91-99673-13355"), "919967313355");
    assert.equal(formatWhatsAppNumber(""), "919967313355");
    assert.equal(formatWhatsAppNumber(undefined), "919967313355");
  });

  await t.test("buildSingleProductWhatsAppMessage formats single product details, options and customer info", () => {
    const msg = buildSingleProductWhatsAppMessage({
      product: {
        id: "p1",
        name: "Ocean Resin Clock",
        slug: "ocean-resin-clock",
        sku: "CLK-001",
      },
      variantName: "12 inch with Gold Hands",
      unitPrice: 1499,
      quantity: 2,
      giftWrapped: true,
      giftWrapCharge: 150,
      personalizationDetails: {
        customName: "Ananya & Rohan",
        initials: "A & R",
        color: "Ocean Turquoise",
        design: "Gold Flakes Edge",
        notes: "Please pack with extra protection",
      },
      referenceImageUrl: "https://example.com/ref.heic",
      customer: {
        name: "Ananya Sharma",
        phone: "+91 9876543210",
        email: "ananya@example.com",
      },
    });

    assert.ok(msg.includes("Ocean Resin Clock"));
    assert.ok(msg.includes("12 inch with Gold Hands"));
    assert.ok(msg.includes("Quantity:* 2"));
    assert.ok(msg.includes("Unit Price:* ₹1499.00"));
    assert.ok(msg.includes("Boutique Gift Packaging:* Yes (+₹300.00)"));
    assert.ok(msg.includes('Custom Name / Text:* "Ananya & Rohan"'));
    assert.ok(msg.includes("Initials:* A & R"));
    assert.ok(msg.includes("Selected Color:* Ocean Turquoise"));
    assert.ok(msg.includes("Design / Theme:* Gold Flakes Edge"));
    assert.ok(msg.includes("Personalization Notes:* Please pack with extra protection"));
    assert.ok(msg.includes("Reference Photo:* https://example.com/ref.heic"));
    assert.ok(msg.includes("SKU:* CLK-001"));
    // (1499 * 2) + (150 * 2) = 3298
    assert.ok(msg.includes("Total Calculated Amount:* ₹3298.00"));
    assert.ok(msg.includes("Name: Ananya Sharma"));
    assert.ok(msg.includes("Phone: +91 9876543210"));
  });

  await t.test("buildCartWhatsAppMessage formats multiple items with full totals and customer info", () => {
    const msg = buildCartWhatsAppMessage({
      items: [
        {
          name: "Floral Resin Coaster Set",
          quantity: 2,
          price: 499,
          variantName: "Set of 4",
          giftWrapped: true,
          giftWrapCharge: 50,
          personalizationDetails: { customName: "Devangi" },
        },
        {
          name: "Geode Resin Bookmark",
          quantity: 1,
          price: 299,
          giftWrapped: false,
        },
      ],
      subtotal: 1297,
      discountAmount: 100,
      couponCode: "WELCOME10",
      shippingCharge: 0,
      finalTotal: 1297 - 100,
      customer: {
        name: "Rahul Mehta",
        phone: "+91 9820011223",
        email: "rahul@example.com",
        city: "Mumbai",
        state: "Maharashtra",
      },
    });

    assert.ok(msg.includes("ITEMS ORDERED (2):"));
    assert.ok(msg.includes("1. *Floral Resin Coaster Set*"));
    assert.ok(msg.includes("Variant: Set of 4"));
    assert.ok(msg.includes("Qty: 2 × ₹499.00 = ₹998.00"));
    assert.ok(msg.includes("Gift Packaging: Yes (+₹100.00)"));
    assert.ok(msg.includes('Custom Name: "Devangi"'));
    assert.ok(msg.includes("2. *Geode Resin Bookmark*"));
    assert.ok(msg.includes("Items Subtotal: ₹1297.00"));
    assert.ok(msg.includes("Coupon Savings (WELCOME10): -₹100.00"));
    assert.ok(msg.includes("Insured Delivery: FREE (Complimentary Insured Shipping)"));
    assert.ok(msg.includes("Grand Total to Pay: ₹1197.00"));
    assert.ok(msg.includes("Name: Rahul Mehta"));
    assert.ok(msg.includes("Location: Mumbai, Maharashtra"));
  });

  await t.test("getWhatsAppUrl generates valid wa.me URL with phone and encoded query", () => {
    const url = getWhatsAppUrl("+91 99673 13355", "Hello Devangi!");
    assert.equal(url, "https://wa.me/919967313355?text=Hello%20Devangi!");
  });

  await t.test("WhatsApp message includes Order Reference when orderNumber is provided", () => {
    const singleMsg = buildSingleProductWhatsAppMessage({
      product: { id: "p1", name: "Keychain", slug: "keychain", sku: "KC-01" },
      unitPrice: 199,
      quantity: 1,
      orderNumber: "WA-20261102-1234",
    });
    assert.ok(singleMsg.includes("*Order Reference:* WA-20261102-1234"));

    const cartMsg = buildCartWhatsAppMessage({
      items: [{ name: "Keychain", quantity: 1, price: 199 }],
      subtotal: 199,
      finalTotal: 199,
      orderNumber: "WA-20261102-5678",
    });
    assert.ok(cartMsg.includes("*Order Reference:* WA-20261102-5678"));
  });

  await t.test("WhatsApp order creation persists single order with multiple items and orderSource whatsapp", async () => {
    const { dbStore } = await import("../lib/db");
    const testOrderNumber = `WA-TEST-${Date.now()}`;
    const created = await dbStore.createOrder({
      orderNumber: testOrderNumber,
      customerName: "Pooja Patel",
      customerPhone: "+91 9876543210",
      customerEmail: "pooja@example.com",
      orderSource: "whatsapp",
      paymentMethod: "upi",
      paymentStatus: "unpaid",
      orderStatus: "confirmed",
      subtotal: 1500,
      totalAmount: 1500,
      orderNotes: "WhatsApp Cart Multi-item Checkout",
      items: [
        {
          productName: "Resin Ocean Tray",
          sku: "TR-01",
          quantity: 1,
          unitPrice: 1000,
          totalPrice: 1000,
          personalizationDetails: { customName: "Ocean Waves" },
        },
        {
          productName: "Gold Leaf Coaster Pair",
          sku: "CS-02",
          quantity: 2,
          unitPrice: 250,
          totalPrice: 500,
        },
      ],
    });

    assert.ok(created.id);
    assert.equal(created.orderNumber, testOrderNumber);
    assert.equal(created.orderSource, "whatsapp");

    // Fetch order back from DB
    const fetched = await dbStore.getOrderById(created.id);
    assert.ok(fetched);
    assert.equal(fetched.orderSource, "whatsapp");
    assert.equal(fetched.items?.length, 2);
    assert.equal(fetched.items[0].productName, "Resin Ocean Tray");
    assert.equal(fetched.items[0].personalizationDetails?.customName, "Ocean Waves");
    assert.equal(fetched.items[1].productName, "Gold Leaf Coaster Pair");
    assert.equal(fetched.items[1].quantity, 2);

    // Clean up test order
    await dbStore.deleteOrder(created.id);
  });

  await t.test("WhatsApp 1-click and cart checkout sets default orderStatus to waiting and prevents auto-cancellation", async () => {
    const { dbStore } = await import("../lib/db");
    const testOrderNumber = `WA-WAITING-${Date.now()}`;
    const custEmail = "waiting_test@example.com";
    const created = await dbStore.createOrder({
      orderNumber: testOrderNumber,
      customerName: "Rohan Varma",
      customerEmail: custEmail,
      orderSource: "whatsapp",
      paymentMethod: "upi",
      paymentStatus: "unpaid",
      orderStatus: "waiting",
      subtotal: 999,
      totalAmount: 999,
      items: [
        {
          productName: "Resin Art Coaster",
          quantity: 1,
          unitPrice: 999,
          totalPrice: 999,
        },
      ],
    });

    assert.equal(created.orderStatus, "waiting");

    // 1. Unpaid check should ignore waiting orders so they are not cancelled on refresh/revisit
    let unpaid = await dbStore.getCustomerLatestUnpaidOrder(custEmail);
    assert.equal(unpaid, null, "Order in waiting status should not be returned as unpaid discard candidate");

    // 2. When admin sets orderStatus to 'confirmed', it must also NOT be returned as unpaid discard candidate
    await dbStore.updateOrderStatus(created.id, "confirmed");
    unpaid = await dbStore.getCustomerLatestUnpaidOrder(custEmail);
    assert.equal(unpaid, null, "Order in confirmed status should not be cancelled on visit");

    // Attempting to discard confirmed order should be ignored
    await dbStore.discardUnpaidOrder(created.id);
    let fetched = await dbStore.getOrderById(created.id);
    assert.equal(fetched?.orderStatus, "confirmed", "Confirmed order must not be cancelled automatically");

    // 3. ONLY when admin marks order as 'pending_payment', unpaid check triggers and allows discard
    await dbStore.updateOrderStatus(created.id, "pending_payment");
    unpaid = await dbStore.getCustomerLatestUnpaidOrder(custEmail);
    assert.ok(unpaid, "Pending payment order should be returned by unpaid check");
    assert.equal(unpaid?.orderNumber, testOrderNumber);

    await dbStore.discardUnpaidOrder(created.id);
    fetched = await dbStore.getOrderById(created.id);
    assert.equal(fetched?.orderStatus, "cancelled", "Pending payment order gets cancelled when discarded");

    await dbStore.deleteOrder(created.id);
  });

  await t.test("buildSingleProductWhatsAppMessage auto-fills multi-title variant selections, color palette, and blob reference URL", () => {
    const msg = buildSingleProductWhatsAppMessage({
      product: {
        id: "prod_resin_clock",
        name: "Geode Floral Wall Clock",
        sku: "RA-CLK-99",
      },
      unitPrice: 2299.00,
      quantity: 1,
      giftWrapped: true,
      giftWrapCharge: 49.00,
      personalizationDetails: {
        color: "Emerald Green & Gold",
        customName: "Shrikesh & Devangi",
        initials: "S & D",
        selectedVariants: [
          { groupTitle: "Select Size", name: "Large (16-inch)", priceAdjustment: 500 },
          { groupTitle: "Clock Hands Hardware", name: "Rose Gold Silent Sweep", priceAdjustment: 150 },
        ],
      },
      referenceImageUrl: "https://mockblob.public.blob.vercel-storage.com/ref-photo.jpg",
      customer: {
        name: "Shrikesh Shetty",
        phone: "7045332855",
        email: "shrikesh123shetty@gmail.com",
      },
      orderNumber: "WA-20261104-5544",
    });

    assert.ok(msg.includes("*Order Reference:* WA-20261104-5544"));
    assert.ok(msg.includes("*Product:* Geode Floral Wall Clock"));
    assert.ok(msg.includes("*Selected Variants / Custom Options:*"));
    assert.ok(msg.includes("• Select Size: Large (16-inch) (+₹500.00)"));
    assert.ok(msg.includes("• Clock Hands Hardware: Rose Gold Silent Sweep (+₹150.00)"));
    assert.ok(msg.includes("*Selected Color:* Emerald Green & Gold"));
    assert.ok(msg.includes('*Custom Name / Text:* "Shrikesh & Devangi"'));
    assert.ok(msg.includes("*Initials:* S & D"));
    assert.ok(msg.includes("*Reference Photo:* https://mockblob.public.blob.vercel-storage.com/ref-photo.jpg"));
    assert.ok(msg.includes("*Unit Price:* ₹2299.00"));
    assert.ok(msg.includes("*Boutique Gift Packaging:* Yes (+₹49.00)"));
    // 2299 + 49 = 2348
    assert.ok(msg.includes("*Total Calculated Amount:* ₹2348.00"));
    assert.ok(msg.includes("Name: Shrikesh Shetty"));
    assert.ok(msg.includes("Phone: 7045332855"));
  });

  await t.test("Product creation and update stores variantGroups, customColorPalette, and primary image properly", async () => {
    const testProdId = `prod_test_vg_${Date.now()}`;
    const created = await dbStore.createProduct({
      id: testProdId,
      name: "Custom Resin Nameplate",
      slug: `custom-resin-nameplate-${Date.now()}`,
      description: "Handcrafted resin nameplate with custom lettering",
      categoryId: "cat_clocks_home_decor",
      regularPrice: 1499,
      enableVariants: true,
      variantGroups: [
        {
          id: "vg_size",
          title: "Dimensions",
          options: [
            { id: "opt_sm", name: "12x6 inches", priceAdjustment: 0 },
            { id: "opt_lg", name: "16x8 inches", priceAdjustment: 350 },
          ],
        },
        {
          id: "vg_mount",
          title: "Mounting Option",
          options: [
            { id: "opt_wall", name: "Heavy Duty Wall Mount", priceAdjustment: 0 },
            { id: "opt_stand", name: "Desk Acrylic Stand", priceAdjustment: 120 },
          ],
        },
      ],
      enablePersonalization: true,
      customColorEnabled: true,
      customColorPalette: ["Rose Gold & Blush Pink", "Emerald Green & Gold", "Ocean Turquoise & Gold Leaf"],
      customImageUploadEnabled: true,
      images: [
        { imageUrl: "https://example.com/secondary.jpg", altText: "Secondary", isPrimary: false, displayOrder: 2 },
        { imageUrl: "https://example.com/primary.jpg", altText: "Primary", isPrimary: true, displayOrder: 1 },
      ],
    });

    assert.ok(created);
    const fetched = await dbStore.getProductById(testProdId);
    assert.ok(fetched);
    assert.equal(fetched.variantGroups?.length, 2);
    assert.equal(fetched.variantGroups[0].title, "Dimensions");
    assert.equal(fetched.variantGroups[0].options?.length, 2);
    assert.equal(fetched.variantGroups[1].title, "Mounting Option");
    assert.equal(fetched.customColorPalette?.length, 3);
    assert.ok(fetched.customColorPalette.includes("Ocean Turquoise & Gold Leaf"));
    // Primary image is guaranteed to be first
    assert.ok(fetched.images && fetched.images.length >= 2);
    assert.equal(fetched.images[0].isPrimary, true);
    assert.equal(fetched.images[0].imageUrl, "https://example.com/primary.jpg");

    // Clean up test product
    await dbStore.deleteProduct(testProdId);
  });

  await t.test("buildUpiPaymentUri correctly formats standard UPI URI with exact amount, payee, and transaction ID", () => {
    const upiUri = buildUpiPaymentUri({
      upiId: "devangibarai0403@okhdfcbank",
      accountHolderName: "Devangi Banshilal Barai",
      amount: 230,
      orderReference: "DRS-ORDER12345",
      transactionId: "DRS-TXN9988",
    });

    assert.ok(upiUri.startsWith("upi://pay?"));
    assert.ok(upiUri.includes("pa=devangibarai0403%40okhdfcbank"));
    assert.ok(upiUri.includes("pn=Devangi%20Banshilal%20Barai"));
    assert.ok(upiUri.includes("am=230.00"));
    assert.ok(upiUri.includes("cu=INR"));
    assert.ok(upiUri.includes("tr=DRS-TXN9988"));
    assert.ok(upiUri.includes("tn=Order%20DRS-ORDER12345"));
  });

  await t.test("generateUpiQrCodeDataUrl produces valid Base64 PNG QR code from UPI payment URI", async () => {
    const upiUri = buildUpiPaymentUri({
      upiId: "devangibarai0403@okhdfcbank",
      accountHolderName: "Devangi Banshilal Barai",
      amount: 150.5,
      transactionId: "DRS-TEST-REF",
    });
    const qrDataUrl = await generateUpiQrCodeDataUrl(upiUri);
    assert.ok(qrDataUrl.startsWith("data:image/png;base64,"));
    assert.ok(qrDataUrl.length > 100);
  });

  await t.test("generatePaymentReference produces unique reference strings with DRS prefix", () => {
    const ref1 = generatePaymentReference();
    const ref2 = generatePaymentReference();
    assert.ok(ref1.startsWith("DRS"));
    assert.ok(ref2.startsWith("DRS"));
    assert.notEqual(ref1, ref2);
  });

  await t.test("buildSingleProductWhatsAppMessage generates exact confirmation format with Payment Reference and Pending Verification", () => {
    const msg = buildSingleProductWhatsAppMessage({
      product: {
        id: "p_keychain",
        name: "Resin Keychain",
      },
      unitPrice: 89,
      quantity: 2,
      shippingCharge: 50,
      discountAmount: 20,
      paymentReference: "ORDER12345",
      paymentStatus: "Pending Verification",
      customer: {
        name: "Priya Sharma",
        phone: "+91 9820011223",
      },
    });

    assert.ok(msg.includes("Hello Devangi Resin Studio,"));
    assert.ok(msg.includes("I would like to confirm my order."));
    assert.ok(msg.includes("Product: Resin Keychain"));
    assert.ok(msg.includes("Quantity: 2"));
    assert.ok(msg.includes("Product Total: ₹178.00"));
    assert.ok(msg.includes("Shipping: ₹50.00"));
    assert.ok(msg.includes("Discount: ₹20.00"));
    assert.ok(msg.includes("Final Payable Amount: ₹208.00"));
    assert.ok(msg.includes("Payment Reference: ORDER12345"));
    assert.ok(msg.includes("Payment Status: Pending Verification"));
    assert.ok(msg.includes("I have completed the payment. Please verify the transaction and confirm my order."));
  });

  await t.test("buildCartWhatsAppMessage generates exact confirmation format with Payment Reference, Pending Verification, and items", () => {
    const msg = buildCartWhatsAppMessage({
      items: [
        {
          name: "Resin Bookmark",
          quantity: 2,
          price: 150,
        },
        {
          name: "Geode Coaster",
          quantity: 1,
          price: 300,
        },
      ],
      subtotal: 600,
      shippingCharge: 60,
      discountAmount: 50,
      finalTotal: 610,
      couponCode: "STUDIO50",
      paymentReference: "DRS982109AK",
      paymentStatus: "Pending Verification",
      customer: {
        name: "Aarav Gupta",
        phone: "+91 9876543210",
        city: "Jaipur",
        state: "Rajasthan",
      },
    });

    assert.ok(msg.includes("Hello Devangi Resin Studio,"));
    assert.ok(msg.includes("I would like to confirm my order."));
    assert.ok(msg.includes("ITEMS ORDERED (2):"));
    assert.ok(msg.includes("1. *Resin Bookmark*"));
    assert.ok(msg.includes("2. *Geode Coaster*"));
    assert.ok(msg.includes("Items Subtotal: ₹600.00"));
    assert.ok(msg.includes("Coupon Savings (STUDIO50): -₹50.00"));
    assert.ok(msg.includes("Shipping: ₹60.00"));
    assert.ok(msg.includes("Final Payable Amount: ₹610.00"));
    assert.ok(msg.includes("Payment Reference: DRS982109AK"));
    assert.ok(msg.includes("Payment Status: Pending Verification"));
    assert.ok(msg.includes("I have completed the payment. Please verify the transaction and confirm my order."));
  });

  await t.test("defaultPolicyTemplates includes comprehensive dynamic UPI QR payment policy", () => {
    const paymentPolicy = defaultPolicyTemplates.payment;
    assert.ok(paymentPolicy, "Payment policy template must exist");
    assert.equal(paymentPolicy.key, "payment");
    assert.ok(paymentPolicy.name.includes("Dynamic UPI QR Payment"));
    assert.ok(paymentPolicy.statement.includes("Devangi Banshilal Barai"));
    assert.ok(paymentPolicy.statement.includes("UPI PIN"));
    assert.ok(paymentPolicy.highlights.length >= 4);
    assert.ok(paymentPolicy.detailedSections.length >= 5);
    assert.ok(paymentPolicy.alertBox.title.includes("Anti-Fraud"));
  });

  await t.test("formatCombinedAddress deduplicates repeated locality, city and state names cleanly", () => {
    const combined1 = formatCombinedAddress({
      addressLine1: "Flat 402, Lotus Heights, Indiranagar, Bangalore",
      addressLine2: "Near Metro, Indiranagar",
      city: "Bangalore",
      state: "Karnataka",
      postalCode: "560038",
    });
    // Indiranagar and Bangalore should not be repeated
    assert.equal(combined1, "Flat 402, Lotus Heights, Indiranagar, Bangalore, Near Metro, Karnataka, 560038");

    const combined2 = formatCombinedAddress({
      addressLine1: "Shop 12, MG Road, Mumbai",
      addressLine2: null,
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
    });
    assert.equal(combined2, "Shop 12, MG Road, Mumbai, Maharashtra, 400001");

    const empty = formatCombinedAddress(null);
    assert.equal(empty, "");
  });

  await t.test("WhatsApp messages default payment status to Paid and include Receiver Name, Contact No, and combined address", () => {
    const singleMsg = buildSingleProductWhatsAppMessage({
      product: { id: "p100", name: "Custom Geode Clock" },
      unitPrice: 2499,
      quantity: 1,
      paymentReference: "DRS-PAID-99",
      customer: {
        name: "Rohit Malhotra",
        phone: "+91 9811223344",
        email: "rohit@example.com",
        addressLine1: "Villa 5, Palm Meadows, Whitefield",
        addressLine2: "Whitefield, Bangalore",
        city: "Bangalore",
        state: "Karnataka",
        postalCode: "560066",
      },
    });

    assert.ok(singleMsg.includes("Payment Status: Paid"), "Default payment status must be Paid");
    assert.ok(singleMsg.includes("• Receiver Name: Rohit Malhotra"));
    assert.ok(singleMsg.includes("• Contact No: +91 9811223344"));
    assert.ok(singleMsg.includes("• Delivery Address: Villa 5, Palm Meadows, Whitefield, Bangalore, Karnataka, 560066"));

    const cartMsg = buildCartWhatsAppMessage({
      items: [{ name: "Mini Resin Tray", price: 650, quantity: 2 }],
      subtotal: 1300,
      finalTotal: 1300,
      paymentReference: "DRS-CART-PAID",
      customer: {
        name: "Neha Joshi",
        phone: "+91 9988776655",
        addressLine1: "Flat 101, Galaxy Apts, Andheri West",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400053",
      },
    });

    assert.ok(cartMsg.includes("Payment Status: Paid"), "Cart message default payment status must be Paid");
    assert.ok(cartMsg.includes("• Receiver Name: Neha Joshi"));
    assert.ok(cartMsg.includes("• Contact No: +91 9988776655"));
    assert.ok(cartMsg.includes("• Delivery Address: Flat 101, Galaxy Apts, Andheri West, Mumbai, Maharashtra, 400053"));
  });

  await t.test("getProductionSiteUrl strictly rejects localhost and returns live domain", () => {
    const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;
    try {
      process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
      const siteUrl = getProductionSiteUrl();
      assert.ok(!siteUrl.includes("localhost"), "Must never return localhost");
      assert.ok(!siteUrl.includes("127.0.0.1"), "Must never return 127.0.0.1");
      assert.equal(siteUrl, "https://devangiresinstudio.com");
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    }
  });
});
