import crypto from "crypto";

const CASHFREE_ENV = process.env.CASHFREE_ENV || "sandbox";
const CASHFREE_BASE_URL =
  CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID || "";
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET || "";
const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || "2023-08-01";

export interface CreateCashfreeOrderParams {
  orderId: string;
  orderAmount: number;
  orderCurrency?: string;
  customerDetails: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  orderMeta?: {
    returnUrl?: string;
    notifyUrl?: string;
  };
  orderNote?: string;
}

export function isCashfreeConfigured(): boolean {
  return Boolean(
    CASHFREE_CLIENT_ID &&
    CASHFREE_CLIENT_SECRET &&
    !CASHFREE_CLIENT_ID.includes("PLACEHOLDER") &&
    !CASHFREE_CLIENT_SECRET.includes("PLACEHOLDER")
  );
}

/**
 * Creates a Cashfree payment session for an order.
 * If credentials are not configured or in sandbox mockup mode,
 * returns a sandbox mock session for local testing.
 */
export async function createCashfreeOrder(params: CreateCashfreeOrderParams) {
  // If actual Cashfree credentials are not yet set, provide clean sandbox simulation
  if (!isCashfreeConfigured()) {
    console.warn("Cashfree credentials are placeholder/sandbox mock mode. Generating mock session.");
    return {
      cfOrderId: `cf_mock_${params.orderId}`,
      paymentSessionId: `mock_session_${Date.now()}_${params.orderId}`,
      orderStatus: "ACTIVE",
      isMock: true,
      sandboxPaymentUrl: `/checkout/sandbox-payment?order_id=${params.orderId}&amount=${params.orderAmount}`,
    };
  }

  const payload = {
    order_id: params.orderId,
    order_amount: params.orderAmount,
    order_currency: params.orderCurrency || "INR",
    customer_details: {
      customer_id: params.customerDetails.customerId.replace(/[^a-zA-Z0-9_-]/g, "_"),
      customer_name: params.customerDetails.customerName,
      customer_email: params.customerDetails.customerEmail,
      customer_phone: params.customerDetails.customerPhone.replace(/[^0-9]/g, "").slice(-10),
    },
    order_meta: {
      return_url:
        params.orderMeta?.returnUrl ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout/verify?order_id={order_id}`,
      notify_url:
        params.orderMeta?.notifyUrl ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/webhooks/cashfree`,
    },
    order_note: params.orderNote || "Handmade Resin Art Order",
  };

  const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": CASHFREE_API_VERSION,
      "x-client-id": CASHFREE_CLIENT_ID,
      "x-client-secret": CASHFREE_CLIENT_SECRET,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Cashfree Order Creation Failed: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    cfOrderId: data.cf_order_id,
    paymentSessionId: data.payment_session_id,
    orderStatus: data.order_status,
    isMock: false,
    sandboxPaymentUrl: null,
  };
}

/**
 * Verifies payment status directly with Cashfree PG API.
 */
export async function verifyCashfreePayment(orderId: string) {
  if (!isCashfreeConfigured()) {
    // In mock sandbox, simulate verified payment
    return {
      verified: true,
      paymentStatus: "SUCCESS",
      orderId,
      amount: null,
      cfPaymentId: `mock_pay_${Date.now()}`,
      isMock: true,
    };
  }

  const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}/payments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": CASHFREE_API_VERSION,
      "x-client-id": CASHFREE_CLIENT_ID,
      "x-client-secret": CASHFREE_CLIENT_SECRET,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to verify payment with Cashfree: ${response.statusText}`);
  }

  const payments = await response.json();
  if (!Array.isArray(payments) || payments.length === 0) {
    return { verified: false, paymentStatus: "NOT_FOUND" };
  }

  // Find a successful payment
  const successPayment = payments.find((p: any) => p.payment_status === "SUCCESS");
  if (successPayment) {
    return {
      verified: true,
      paymentStatus: "SUCCESS",
      orderId,
      amount: successPayment.payment_amount,
      cfPaymentId: successPayment.cf_payment_id,
      paymentMethod: successPayment.payment_group,
      completionTime: successPayment.payment_completion_time,
      raw: successPayment,
      isMock: false,
    };
  }

  return {
    verified: false,
    paymentStatus: payments[0]?.payment_status || "PENDING",
    isMock: false,
  };
}

/**
 * Validates Cashfree webhook signature using HMAC-SHA256.
 */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  if (!isCashfreeConfigured()) return true; // Accept during mock sandbox testing

  try {
    const signatureData = `${timestamp}${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", CASHFREE_CLIENT_SECRET)
      .update(signatureData)
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}
