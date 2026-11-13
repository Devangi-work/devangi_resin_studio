import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { dbStore } from "@/lib/db";
import { z } from "zod";

const whatsappOrderItemSchema = z.object({
  productId: z.string().optional().nullable(),
  name: z.string().min(1, "Product name is required"),
  price: z.number().min(0),
  quantity: z.number().min(1),
  variantId: z.string().optional().nullable(),
  variantName: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  personalizationDetails: z.any().optional().nullable(),
  referenceImageUrl: z.string().optional().nullable(),
  giftWrapped: z.boolean().optional().default(false),
  giftWrapCharge: z.number().optional().default(0),
});

const createWhatsAppOrderSchema = z.object({
  items: z.array(whatsappOrderItemSchema).min(1, "At least one item is required"),
  couponCode: z.string().optional().nullable(),
  discountAmount: z.number().optional().default(0),
  shippingCharge: z.number().optional().default(0),
  subtotal: z.number().optional(),
  finalTotal: z.number().optional(),
  orderNotes: z.string().optional().default("WhatsApp 1-Click Buy / Checkout"),
  paymentReference: z.string().optional().nullable(),
  upiTransactionId: z.string().optional().nullable(),
  paymentScreenshotUrl: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  shippingAddressLine1: z.string().optional().nullable(),
  shippingAddressLine2: z.string().optional().nullable(),
  shippingCity: z.string().optional().nullable(),
  shippingState: z.string().optional().nullable(),
  shippingPostalCode: z.string().optional().nullable(),
  shippingCountry: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session?.customerId) {
      return NextResponse.json(
        { error: "Customer authentication required to place WhatsApp order" },
        { status: 401 }
      );
    }

    const customer = await dbStore.getCustomerById(session.customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Registered customer record not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = createWhatsAppOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid order data", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      items,
      couponCode,
      discountAmount,
      shippingCharge,
      subtotal: reqSubtotal,
      finalTotal: reqFinalTotal,
      orderNotes,
      paymentReference,
      upiTransactionId,
      paymentScreenshotUrl,
    } = result.data;

    let calculatedSubtotal = 0;
    const formattedItems = items.map((item) => {
      const unitPrice = Number(item.price);
      const giftWrapCharge = item.giftWrapped ? Number(item.giftWrapCharge || 0) : 0;
      const lineTotal = (unitPrice + giftWrapCharge) * item.quantity;
      calculatedSubtotal += lineTotal;

      return {
        productId: item.productId || null,
        variantId: item.variantId || null,
        productName: item.name,
        variantName: item.variantName || null,
        sku: item.sku || `WA-${item.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "ART"}`,
        unitPrice,
        price: unitPrice,
        quantity: item.quantity,
        totalPrice: lineTotal,
        personalizationDetails: item.personalizationDetails || null,
        referenceImageUrl: item.referenceImageUrl || null,
        giftWrapped: Boolean(item.giftWrapped),
        giftWrapCharge,
        productImage: item.image || null,
      };
    });

    const subtotal = reqSubtotal !== undefined ? Number(reqSubtotal) : calculatedSubtotal;
    const totalAmount = reqFinalTotal !== undefined ? Number(reqFinalTotal) : Math.max(0, subtotal - discountAmount + shippingCharge);

    const productImages: string[] = [];
    items.forEach((i) => {
      if (i.image && !productImages.includes(i.image)) productImages.push(i.image);
      if (i.referenceImageUrl && !productImages.includes(i.referenceImageUrl)) productImages.push(i.referenceImageUrl);
    });

    const orderNumber = `WA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const finalCustomerName = (result.data.customerName || "").trim() || customer.name || session.name || "Customer";
    const finalCustomerPhone = (result.data.customerPhone || "").trim() || (customer.phone && customer.phone.trim()) || "WhatsApp Customer";
    const finalAddress1 = (result.data.shippingAddressLine1 !== undefined ? result.data.shippingAddressLine1 : customer.addressLine1) || null;
    const finalAddress2 = (result.data.shippingAddressLine2 !== undefined ? result.data.shippingAddressLine2 : customer.addressLine2) || null;
    const finalCity = (result.data.shippingCity !== undefined ? result.data.shippingCity : customer.city) || null;
    const finalState = (result.data.shippingState !== undefined ? result.data.shippingState : customer.state) || null;
    const finalPostalCode = (result.data.shippingPostalCode !== undefined ? result.data.shippingPostalCode : customer.postalCode) || null;
    const finalCountry = finalAddress1 ? ((result.data.shippingCountry !== undefined ? result.data.shippingCountry : customer.country) || "India") : null;

    // Auto-sync customer profile in database if new shipping details were provided
    if (result.data.shippingAddressLine1 || result.data.customerPhone || result.data.shippingCity) {
      try {
        await dbStore.updateCustomerProfile(customer.id, {
          ...(result.data.customerName && result.data.customerName.trim() ? { name: result.data.customerName.trim() } : {}),
          ...(result.data.customerPhone && result.data.customerPhone.trim() ? { phone: result.data.customerPhone.trim() } : {}),
          ...(result.data.shippingAddressLine1 && result.data.shippingAddressLine1.trim() ? { addressLine1: result.data.shippingAddressLine1.trim() } : {}),
          ...(result.data.shippingAddressLine2 !== undefined ? { addressLine2: (result.data.shippingAddressLine2 || "").trim() } : {}),
          ...(result.data.shippingCity && result.data.shippingCity.trim() ? { city: result.data.shippingCity.trim() } : {}),
          ...(result.data.shippingState && result.data.shippingState.trim() ? { state: result.data.shippingState.trim() } : {}),
          ...(result.data.shippingPostalCode && result.data.shippingPostalCode.trim() ? { postalCode: result.data.shippingPostalCode.trim() } : {}),
        });
      } catch (profErr) {
        console.warn("Could not sync customer profile from checkout:", profErr);
      }
    }

    const newOrder = await dbStore.createOrder({
      orderNumber,
      customerId: customer.id,
      customerName: finalCustomerName,
      customerEmail: customer.email || session.email || null,
      customerPhone: finalCustomerPhone,
      shippingAddressLine1: finalAddress1,
      shippingAddressLine2: finalAddress2,
      shippingCity: finalCity,
      shippingState: finalState,
      shippingPostalCode: finalPostalCode,
      shippingCountry: finalCountry,
      orderSource: "whatsapp",
      paymentMethod: "upi",
      upiTransactionId: paymentReference || upiTransactionId || null,
      paymentScreenshotUrl: paymentScreenshotUrl || null,
      paymentStatus: "paid",
      orderStatus: "confirmed",
      subtotal,
      discountAmount,
      discountReason: couponCode || null,
      shippingCharge,
      taxAmount: 0,
      totalAmount,
      orderNotes,
      internalNotes: `Auto-generated WhatsApp order. Customer ID: ${customer.id}`,
      productImages,
      items: formattedItems,
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      orderNumber: newOrder.orderNumber,
    });
  } catch (err: any) {
    console.error("[WhatsApp Order Creation Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create WhatsApp order" },
      { status: 500 }
    );
  }
}

