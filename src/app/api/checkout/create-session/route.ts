import { NextResponse } from "next/server";
import { dbStore } from "@/lib/db";
import { checkoutSchema } from "@/lib/validations";
import { createCashfreeOrder } from "@/lib/cashfree";

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
        unitPrice: unitPrice.toFixed(2),
        quantity: item.quantity,
        totalPrice: itemTotal.toFixed(2),
        personalizationDetails: item.personalizationDetails || null,
        referenceImageUrl: item.referenceImageUrl || null,
        giftWrapped: item.giftWrapped,
        giftWrapCharge: giftWrapCharge.toFixed(2),
      });
    }

    // 2. Fetch site settings for shipping & tax policy
    const settings = await dbStore.getSiteSettings();
    const freeShippingThreshold = Number(settings.freeShippingThreshold || 999);
    const defaultShippingCharge = Number(settings.defaultShippingCharge || 79);

    let shippingCharge = subtotal >= freeShippingThreshold ? 0 : defaultShippingCharge;

    // 3. Coupon validation
    let discountAmount = 0;
    if (couponCode) {
      const couponValidation = await dbStore.validateCoupon(couponCode, subtotal, customerEmail);
      if (couponValidation.valid) {
        discountAmount = couponValidation.discountAmount || 0;
      }
    }

    // 4. Final payable amount
    const totalAmount = Math.max(1, subtotal - discountAmount + shippingCharge);
    const orderNumber = `RA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Create Pending Order in database
    const order = await dbStore.createOrder({
      orderNumber,
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
      orderStatus: "pending_payment",
      paymentStatus: "pending",
      items: validatedItems,
    });

    // 6. Initiate Cashfree Payment Session
    const cfSession = await createCashfreeOrder({
      orderId: order.orderNumber,
      orderAmount: totalAmount,
      customerDetails: {
        customerId: `cust_${customerPhone.replace(/[^0-9]/g, "")}`,
        customerName,
        customerEmail,
        customerPhone,
      },
      orderNote: `Resin Art Order #${order.orderNumber}`,
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      secureLookupToken: order.secureLookupToken,
      paymentSessionId: cfSession.paymentSessionId,
      cfOrderId: cfSession.cfOrderId,
      sandboxPaymentUrl: cfSession.sandboxPaymentUrl,
      isMock: cfSession.isMock,
      totalAmount,
    });
  } catch (err: any) {
    console.error("Create session error:", err);
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
  }
}
