import test from "node:test";
import assert from "node:assert/strict";
import {
  formatWhatsAppNumber,
  buildSingleProductWhatsAppMessage,
  buildCartWhatsAppMessage,
  getWhatsAppUrl,
} from "../lib/whatsapp";
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
});
