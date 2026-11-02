export function formatWhatsAppNumber(phone?: string): string {
  if (!phone) return "919967313355";
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return "919967313355";
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function buildSingleProductWhatsAppMessage(params: {
  product: {
    id: string;
    name: string;
    slug?: string;
    sku?: string;
  };
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  giftWrapped?: boolean;
  giftWrapCharge?: number;
  personalizationDetails?: {
    customName?: string;
    initials?: string;
    color?: string;
    design?: string;
    notes?: string;
  } | null;
  referenceImageUrl?: string | null;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  orderNumber?: string | null;
}): string {
  const {
    product,
    variantName,
    unitPrice,
    quantity,
    giftWrapped,
    giftWrapCharge = 0,
    personalizationDetails,
    referenceImageUrl,
    customer,
    orderNumber,
  } = params;

  const giftTotal = giftWrapped ? giftWrapCharge * quantity : 0;
  const totalAmount = unitPrice * quantity + giftTotal;

  let msg = `*ORDER INQUIRY - DEVANGI RESIN STUDIO*\n\n`;
  msg += `Hello Devangi! I would like to place an order for this handcrafted piece:\n\n`;
  if (orderNumber) {
    msg += `*Order Reference:* ${orderNumber}\n\n`;
  }
  msg += `*Product:* ${product.name}\n`;
  if (variantName) {
    msg += `*Variant / Option:* ${variantName}\n`;
  }
  msg += `*Quantity:* ${quantity}\n`;
  msg += `*Unit Price:* ₹${unitPrice.toFixed(2)}\n`;
  if (giftWrapped) {
    msg += `*Boutique Gift Packaging:* Yes (+₹${giftTotal.toFixed(2)})\n`;
  } else {
    msg += `*Gift Packaging:* No\n`;
  }

  if (personalizationDetails) {
    if (personalizationDetails.customName) {
      msg += `*Custom Name / Text:* "${personalizationDetails.customName}"\n`;
    }
    if (personalizationDetails.initials) {
      msg += `*Initials:* ${personalizationDetails.initials}\n`;
    }
    if (personalizationDetails.color) {
      msg += `*Selected Color:* ${personalizationDetails.color}\n`;
    }
    if (personalizationDetails.design) {
      msg += `*Design / Theme:* ${personalizationDetails.design}\n`;
    }
    if (personalizationDetails.notes) {
      msg += `*Personalization Notes:* ${personalizationDetails.notes}\n`;
    }
  }

  if (referenceImageUrl) {
    msg += `*Reference Photo:* ${referenceImageUrl}\n`;
  }

  if (product.sku) {
    msg += `*SKU:* ${product.sku}\n`;
  }

  msg += `\n*Total Calculated Amount:* ₹${totalAmount.toFixed(2)}\n\n`;

  msg += `*Customer Details:*\n`;
  msg += `• Name: ${customer?.name || "Customer"}\n`;
  if (customer?.phone) {
    msg += `• Phone: ${customer.phone}\n`;
  }
  if (customer?.email) {
    msg += `• Email: ${customer.email}\n`;
  }

  msg += `\nPlease confirm availability, bespoke customization options, and payment instructions. Thank you!`;

  return msg;
}

export function buildCartWhatsAppMessage(params: {
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    variantName?: string | null;
    personalizationDetails?: any;
    giftWrapped?: boolean;
    giftWrapCharge?: number;
    referenceImageUrl?: string | null;
  }>;
  subtotal: number;
  discountAmount?: number;
  couponCode?: string | null;
  shippingCharge?: number;
  finalTotal: number;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
  } | null;
  orderNumber?: string | null;
}): string {
  const {
    items,
    subtotal,
    discountAmount = 0,
    couponCode,
    shippingCharge = 0,
    finalTotal,
    customer,
    orderNumber,
  } = params;

  let msg = `*CHECKOUT ORDER - DEVANGI RESIN STUDIO*\n\n`;
  msg += `Hello Devangi! I would like to place an order for the items in my cart:\n\n`;
  if (orderNumber) {
    msg += `*Order Reference:* ${orderNumber}\n\n`;
  }
  msg += `*ITEMS ORDERED (${items.length}):*\n`;
  msg += `---------------------------------\n`;

  items.forEach((item, idx) => {
    const itemTotal = (item.price + (item.giftWrapped ? item.giftWrapCharge || 0 : 0)) * item.quantity;
    msg += `${idx + 1}. *${item.name}*\n`;
    if (item.variantName) {
      msg += `   • Variant: ${item.variantName}\n`;
    }
    msg += `   • Qty: ${item.quantity} × ₹${item.price.toFixed(2)} = ₹${(item.price * item.quantity).toFixed(2)}\n`;
    if (item.giftWrapped) {
      msg += `   • Gift Packaging: Yes (+₹${((item.giftWrapCharge || 0) * item.quantity).toFixed(2)})\n`;
    }
    if (item.personalizationDetails?.customName) {
      msg += `   • Custom Name: "${item.personalizationDetails.customName}"\n`;
    }
    if (item.personalizationDetails?.initials) {
      msg += `   • Initials: ${item.personalizationDetails.initials}\n`;
    }
    if (item.personalizationDetails?.color) {
      msg += `   • Color: ${item.personalizationDetails.color}\n`;
    }
    if (item.personalizationDetails?.design) {
      msg += `   • Design: ${item.personalizationDetails.design}\n`;
    }
    if (item.personalizationDetails?.notes) {
      msg += `   • Notes: ${item.personalizationDetails.notes}\n`;
    }
    if (item.referenceImageUrl) {
      msg += `   • Ref Image: ${item.referenceImageUrl}\n`;
    }
    msg += `   • Item Total: ₹${itemTotal.toFixed(2)}\n\n`;
  });

  msg += `---------------------------------\n`;
  msg += `*ORDER SUMMARY:*\n`;
  msg += `• Items Subtotal: ₹${subtotal.toFixed(2)}\n`;
  if (discountAmount > 0) {
    msg += `• Coupon Savings (${couponCode || "DISCOUNT"}): -₹${discountAmount.toFixed(2)}\n`;
  }
  msg += `• Insured Delivery: ${shippingCharge === 0 ? "FREE (Complimentary Insured Shipping)" : `₹${shippingCharge.toFixed(2)}`}\n`;
  msg += `• *Grand Total to Pay: ₹${finalTotal.toFixed(2)}*\n\n`;

  msg += `*CUSTOMER DETAILS:*\n`;
  msg += `• Name: ${customer?.name || "Customer"}\n`;
  if (customer?.phone) {
    msg += `• Phone: ${customer.phone}\n`;
  }
  if (customer?.email) {
    msg += `• Email: ${customer.email}\n`;
  }
  if (customer?.city || customer?.state) {
    msg += `• Location: ${[customer.city, customer.state].filter(Boolean).join(", ")}\n`;
  }

  msg += `\nPlease review my order details and share the UPI QR code / payment link to confirm. Thank you!`;

  return msg;
}

export function getWhatsAppUrl(phone: string | undefined, message: string): string {
  const cleanPhone = formatWhatsAppNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

