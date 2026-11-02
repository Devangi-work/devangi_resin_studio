import test from "node:test";
import assert from "node:assert/strict";
import {
  formatWhatsAppNumber,
  buildSingleProductWhatsAppMessage,
  buildCartWhatsAppMessage,
  getWhatsAppUrl,
} from "../lib/whatsapp";

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
});
