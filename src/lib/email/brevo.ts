const BREVO_API_URL = "https://api.brevo.com/v3";
const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "orders@resinartstudio.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Devangi Resin Studio";

export function isBrevoConfigured(): boolean {
  return Boolean(
    BREVO_API_KEY &&
    !BREVO_API_KEY.includes("placeholder") &&
    BREVO_API_KEY.length > 10
  );
}

export interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendBrevoEmail(params: SendEmailParams) {
  if (!isBrevoConfigured()) {
    console.log(`[Brevo Email Mock] To: ${params.to.map((t) => t.email).join(", ")} | Subject: "${params.subject}"`);
    return { success: true, messageId: `mock_email_${Date.now()}` };
  }

  try {
    const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL,
        },
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("[Brevo Error]", errorData);
      return { success: false, error: errorData };
    }

    const data = await res.json();
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("[Brevo Network Error]", error);
    return { success: false, error };
  }
}

/**
 * Sends order confirmation email with itemized list and order lookup link.
 */
export async function sendOrderConfirmationEmail(order: any) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
      <tr style="border-bottom: 1px solid #f0e6df;">
        <td style="padding: 12px 8px; font-weight: 500; color: #2c2523;">
          ${item.productName}
          ${item.variantName ? `<br><small style="color: #8c7a72;">${item.variantName}</small>` : ""}
          ${
            item.personalizationDetails?.customName
              ? `<br><small style="color: #b37d4e;">Custom Name: "${item.personalizationDetails.customName}"</small>`
              : ""
          }
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #665a54;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #2c2523;">₹${item.totalPrice}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - ${order.orderNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f2; padding: 24px; color: #2c2523;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #eee4db;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2c2523 0%, #4a3e3a 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 600;">DEVANGI RESIN STUDIO</h1>
          <p style="margin: 8px 0 0; color: #d4af37; font-size: 14px; letter-spacing: 0.5px;">Handcrafted Resin Creations by Devangi</p>
        </div>

        <div style="padding: 32px 24px;">
          <h2 style="margin: 0 0 8px; color: #2c2523; font-size: 20px;">Thank You for Your Order, ${order.customerName}!</h2>
          <p style="color: #665a54; line-height: 1.6; margin: 0 0 24px;">
            We've received your order <strong>#${order.orderNumber}</strong>. Each piece is handmade with utmost precision and dedicated resin curing.
          </p>

          <!-- Order Summary Card -->
          <div style="background: #faf7f2; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #eee4db;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #8c7a72;">ORDER NUMBER</p>
            <p style="margin: 0 0 16px; font-size: 18px; font-weight: bold; color: #2c2523;">${order.orderNumber}</p>
            <p style="margin: 0 0 4px; font-size: 13px; color: #8c7a72;">SHIPPING ADDRESS</p>
            <p style="margin: 0; font-size: 14px; color: #4a3e3a; line-height: 1.5;">
              ${order.shippingAddressLine1}${order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ""}<br>
              ${order.shippingCity}, ${order.shippingState} - ${order.shippingPostalCode}
            </p>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 2px solid #eee4db; color: #8c7a72;">
                <th style="padding: 8px; text-align: left;">Product</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 12px 8px 4px; text-align: right; color: #8c7a72;">Subtotal:</td>
                <td style="padding: 12px 8px 4px; text-align: right; font-weight: 500;">₹${order.subtotal}</td>
              </tr>
              ${
                Number(order.discountAmount) > 0
                  ? `<tr>
                      <td colspan="2" style="padding: 4px 8px; text-align: right; color: #2e7d32;">Discount:</td>
                      <td style="padding: 4px 8px; text-align: right; color: #2e7d32; font-weight: 500;">-₹${order.discountAmount}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td colspan="2" style="padding: 4px 8px; text-align: right; color: #8c7a72;">Shipping:</td>
                <td style="padding: 4px 8px; text-align: right; font-weight: 500;">
                  ${Number(order.shippingCharge) === 0 ? "FREE" : `₹${order.shippingCharge}`}
                </td>
              </tr>
              <tr style="border-top: 2px solid #eee4db;">
                <td colspan="2" style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 16px; color: #2c2523;">Grand Total:</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 16px; color: #b37d4e;">₹${order.totalAmount}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Track CTA -->
          <div style="text-align: center; margin: 32px 0 16px;">
            <a href="${siteUrl}/orders/${order.orderNumber}?token=${order.secureLookupToken}" 
               style="background: #2c2523; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
              Track Your Order & Status
            </a>
          </div>

          <p style="text-align: center; font-size: 12px; color: #8c7a72; margin: 24px 0 0;">
            Need help? Reply directly to this email or message us on WhatsApp.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    to: [{ email: order.customerEmail, name: order.customerName }],
    subject: `Order Confirmed #${order.orderNumber} - Devangi Resin Studio`,
    htmlContent: html,
  });
}

/**
 * Adds an email subscriber to Brevo contact list.
 */
export async function addBrevoNewsletterSubscriber(email: string) {
  if (!isBrevoConfigured()) {
    console.log(`[Brevo Newsletter Mock] Subscribed email: ${email}`);
    return { success: true };
  }

  try {
    const res = await fetch(`${BREVO_API_URL}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        updateEnabled: true,
      }),
    });

    if (res.ok || res.status === 201 || res.status === 204) {
      return { success: true };
    }
    return { success: true }; // Don't block user if already subscribed
  } catch (err) {
    console.error("[Brevo Newsletter Error]", err);
    return { success: false, error: err };
  }
}
