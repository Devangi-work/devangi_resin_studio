import { NextResponse } from "next/server";
import { dbStore } from "@/lib/db";
import { checkoutSchema } from "@/lib/validations";
import { getCustomerSession } from "@/lib/auth/customer";
import { sendBrevoEmail } from "@/lib/email/brevo";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddressLine1,
      shippingAddressLine2,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry,
      orderNotes,
      couponCode,
      upiTransactionId,
      paymentScreenshotUrl,
      items,
    } = result.data;

    // 1. Server-side product & price revalidation
    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const product = await dbStore.getProductById(item.productId);
      if (!product || product.status !== "published") {
        return NextResponse.json(
          { error: `Product "${item.productId}" is currently unavailable.` },
          { status: 400 }
        );
      }

      // Check stock
      if (product.trackInventory && !product.allowBackorders) {
        if (product.stockQuantity < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}` },
            { status: 400 }
          );
        }
      }

      let unitPrice = Number(product.salePrice || product.regularPrice);
      let variantName: string | null = null;

      // Check variant
      if (item.variantId && product.variants) {
        const variant = product.variants.find((v: any) => v.id === item.variantId);
        if (variant && variant.isActive) {
          unitPrice += Number(variant.priceAdjustment || 0);
          variantName = variant.name;
          if (variant.inventory < item.quantity && product.trackInventory && !product.allowBackorders) {
            return NextResponse.json(
              { error: `Insufficient stock for variant "${variant.name}".` },
              { status: 400 }
            );
          }
        }
      }

      // Surcharges: personalization & gift wrap
      let itemTotal = unitPrice * item.quantity;
      let giftWrapCharge = 0;

      if (item.giftWrapped && product.giftWrappingAvailable) {
        giftWrapCharge = Number(product.giftWrappingCharge || 49);
        itemTotal += giftWrapCharge * item.quantity;
      }

      if (
        product.enablePersonalization &&
        Number(product.personalizationSurcharge || 0) > 0 &&
        item.personalizationDetails?.customName
      ) {
        itemTotal += Number(product.personalizationSurcharge) * item.quantity;
      }

      subtotal += itemTotal;

      validatedItems.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        variantId: item.variantId || null,
        productName: product.name,
        sku: product.sku,
        variantName,
        unitPrice: Number(unitPrice).toFixed(2),
        quantity: item.quantity,
        totalPrice: Number(itemTotal).toFixed(2),
        personalizationDetails: item.personalizationDetails || null,
        referenceImageUrl: item.referenceImageUrl || null,
        giftWrapped: item.giftWrapped,
        giftWrapCharge: Number(giftWrapCharge).toFixed(2),
      });
    }

    // 2. Fetch site settings for shipping & thresholds
    const settings = await dbStore.getSiteSettings();
    const freeShippingThreshold = Number(settings.freeShippingThreshold || 999);
    const defaultShippingCharge = Number(settings.defaultShippingCharge || 79);

    const shippingCharge = subtotal >= freeShippingThreshold ? 0 : defaultShippingCharge;

    // 3. Coupon validation
    let discountAmount = 0;
    if (couponCode) {
      const couponValidation = await dbStore.validateCoupon(couponCode, subtotal, customerEmail);
      if (couponValidation.valid) {
        discountAmount = couponValidation.discountAmount || 0;
      }
    }

    // 4. Final payable amount (strictly no round off)
    const totalAmount = Math.max(1, subtotal - discountAmount + shippingCharge);
    const orderNumber = `RA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Check if customer is logged in
    const customerSession = await getCustomerSession();

    // 6. Create Order in database
    const order = await dbStore.createOrder({
      orderNumber,
      customerId: customerSession?.customerId || null,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddressLine1,
      shippingAddressLine2,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry,
      orderNotes,
      subtotal,
      discountAmount,
      shippingCharge,
      taxAmount: 0,
      totalAmount,
      orderStatus: "confirmed",
      paymentStatus: "pending_verification",
      paymentMethod: "upi",
      upiTransactionId,
      paymentScreenshotUrl,
      items: validatedItems,
    });

    // 7. Decrement Inventory
    for (const item of validatedItems) {
      if (item.productId) {
        try {
          await dbStore.adjustStock(
            item.productId,
            item.variantId || null,
            -Number(item.quantity),
            `Order Placed via UPI (${order.orderNumber})`,
            "checkout"
          );
        } catch (err) {
          console.error("Stock adjustment error:", err);
        }
      }
    }

    // 8. Send Brevo Transactional Email confirmation
    try {
      const itemsHtml = validatedItems
        .map(
          (i) => `
          <tr style="border-bottom: 1px solid #f0e6df;">
            <td style="padding: 10px 8px; font-weight: 500; color: #2c2523;">
              ${i.productName} ${i.variantName ? `<small>(${i.variantName})</small>` : ""}
              ${i.personalizationDetails?.customName ? `<br><small style="color: #b37d4e;">Custom Name: "${i.personalizationDetails.customName}"</small>` : ""}
            </td>
            <td style="padding: 10px 8px; text-align: center;">${i.quantity}</td>
            <td style="padding: 10px 8px; text-align: right; font-weight: 600;">₹${i.totalPrice}</td>
          </tr>
        `
        )
        .join("");

      await sendBrevoEmail({
        to: [{ email: customerEmail, name: customerName }],
        subject: `Order Confirmed: #${order.orderNumber} - Devangi Resin Studio`,
        htmlContent: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f2; padding: 24px; color: #2c2523;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #eee4db;">
              <div style="background: #2C332D; padding: 28px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">DEVANGI RESIN STUDIO</h1>
                <p style="margin: 6px 0 0; color: #D4AF37; font-size: 13px;">Order #${order.orderNumber} Confirmed</p>
              </div>
              <div style="padding: 24px;">
                <p>Hello <strong>${customerName}</strong>,</p>
                <p>Thank you for your order! We have received your UPI payment submission (Ref: <code>${upiTransactionId}</code>) and your handmade pieces are entering our curing queue.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                  <thead>
                    <tr style="background: #FAF8F5; text-align: left; font-size: 12px; color: #8C7A72;">
                      <th style="padding: 8px;">Item</th>
                      <th style="padding: 8px; text-align: center;">Qty</th>
                      <th style="padding: 8px; text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>${itemsHtml}</tbody>
                </table>
                <p style="text-align: right; font-size: 15px; font-weight: bold; margin-top: 12px;">Total Paid: ₹${Number(totalAmount).toFixed(2)}</p>
                <div style="margin-top: 20px; padding: 12px; background: #FAF4EC; border-radius: 8px; font-size: 12px; color: #8C7A72;">
                  <strong>Cancellation Policy:</strong> You can modify or cancel this handmade order within <strong>1 hour</strong> of placement. After 1 hour, our artists begin pouring resin and orders cannot be cancelled.
                </div>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("[Checkout Email Notification Error]", emailErr);
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      secureLookupToken: order.secureLookupToken,
      totalAmount: Number(totalAmount).toFixed(2),
    });
  } catch (err: any) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
  }
}
