import nodemailer from "nodemailer";

const BREVO_API_URL = "https://api.brevo.com/v3";
const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "devangiresinstudioofficial@gmail.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Devangi Resin Studio";

export function isBrevoConfigured(): boolean {
  return Boolean(
    BREVO_API_KEY &&
    !BREVO_API_KEY.includes("placeholder") &&
    BREVO_API_KEY.length > 8
  );
}

export interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: any;
  mocked?: boolean;
  note?: string;
}

/**
 * Universal email sender with dual-transport support:
 * 1. Brevo v3 HTTP REST API (for API keys starting with xkeysib- or standard keys)
 * 2. Brevo SMTP Relay via Nodemailer (for SMTP keys starting with xsmtpsib- or fallback)
 */
export async function sendBrevoEmail(params: SendEmailParams): Promise<EmailResult> {
  if (!isBrevoConfigured()) {
    console.log(`[Brevo Email Mock] To: ${params.to.map((t) => t.email).join(", ")} | Subject: "${params.subject}"`);
    return { success: true, messageId: `mock_email_${Date.now()}` };
  }

  // Attempt 1: If key is a Brevo REST API key or doesn't explicitly begin with xsmtpsib, try HTTP API
  if (!BREVO_API_KEY.startsWith("xsmtpsib-")) {
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

      if (res.ok) {
        const data = await res.json();
        console.log(`[Brevo Email Sent via HTTP API] MessageId: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      }

      const errorData = await res.json().catch(() => ({}));
      console.warn("[Brevo HTTP API Notice]", errorData);
      // Fall through to SMTP if unauthorized or failed
    } catch (httpError) {
      console.warn("[Brevo HTTP API Network Error, attempting SMTP fallback]", httpError);
    }
  }

  // Attempt 2: Nodemailer with Brevo SMTP Relay
  try {
    const smtpHost = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
    const smtpPort = Number(process.env.BREVO_SMTP_PORT) || 587;
    const smtpUser = process.env.BREVO_SMTP_USER || process.env.BREVO_SENDER_EMAIL || "devangiresinstudioofficial@gmail.com";
    const smtpPass = process.env.BREVO_SMTP_PASS || process.env.BREVO_API_KEY;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `"${BREVO_SENDER_NAME}" <${BREVO_SENDER_EMAIL}>`,
      to: params.to.map((t) => (t.name ? `"${t.name}" <${t.email}>` : t.email)).join(", "),
      subject: params.subject,
      html: params.htmlContent,
      text: params.textContent,
    });

    console.log(`[Brevo Email Sent via SMTP] MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (smtpError: any) {
    console.error("[Brevo SMTP Error]", smtpError?.message || smtpError);

    // Also attempt HTTP API one more time if not already attempted
    if (BREVO_API_KEY.startsWith("xsmtpsib-")) {
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
        if (res.ok) {
          const data = await res.json();
          return { success: true, messageId: data.messageId };
        }
      } catch {
        // ignore
      }
    }

    const isAuthError =
      smtpError?.message?.includes("535") ||
      smtpError?.message?.includes("Authentication failed") ||
      smtpError?.message?.includes("Invalid login");

    const errorMessage = isAuthError
      ? "Brevo Authentication Failed (535): The Brevo key in .env starts with 'xsmtpsib-' (SMTP key), which requires your exact Brevo SMTP Login username. Please either:\n1. (Recommended) Generate a Brevo API Key (starts with 'xkeysib-') in Brevo Dashboard > 'SMTP & API' > 'API Keys' tab and set it as BREVO_API_KEY.\n2. OR add BREVO_SMTP_USER='your_brevo_login_email' in .env with the exact Login shown in Brevo > 'SMTP' tab."
      : smtpError?.message || "Failed to send email via Brevo. Please check Brevo credentials in .env.";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export type OrderFulfillmentStatus =
  | "confirmed"
  | "processing"
  | "ready_to_ship"
  | "dispatched"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "waiting"
  | "pending_payment";

interface StatusEmailContent {
  badgeText: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  subject: string;
  headline: string;
  greetingSubtitle: string;
  primaryMessage: string;
  nextStepText: string;
  buttonLabel: string;
  stepIndex: number; // 1 to 5
}

function getStatusEmailDetails(status: string, orderNumber: string, customerName: string): StatusEmailContent {
  const norm = (status || "").toLowerCase().trim();

  switch (norm) {
    case "confirmed":
      return {
        badgeText: "ORDER CONFIRMED &amp; VERIFIED",
        badgeBg: "#FAF0F3",
        badgeColor: "#800020",
        badgeBorder: "#D4AF37",
        subject: `Order Confirmed #${orderNumber} | Devangi Resin Studio`,
        headline: `Your Order is Confirmed, ${customerName}!`,
        greetingSubtitle: "Payment verified & scheduled for handcrafting in our studio",
        primaryMessage:
          "Thank you for your order! Your payment has been successfully verified, and your bespoke creations are now queued in our artisan workshop. Each resin piece is individually measured, pigmented, poured, and cured to ensure lasting brilliance and clarity.",
        nextStepText:
          "Our artisan will prepare your selected botanical flora and pigments to begin the casting and multi-layer curing process.",
        buttonLabel: "Track Order & Status",
        stepIndex: 1,
      };

    case "processing":
      return {
        badgeText: "CRAFTING &amp; CURING IN PROGRESS",
        badgeBg: "#FFF8E6",
        badgeColor: "#B8860B",
        badgeBorder: "#FDE047",
        subject: `Artisan at Work: Your Resin Piece is Being Crafted #${orderNumber}`,
        headline: `Our Artisan Has Begun Handcrafting Your Piece!`,
        greetingSubtitle: "Precision hand-pouring & dedicated UV resin curing",
        primaryMessage:
          "Exciting update! Devangi is now in the studio handcrafting your custom order. Handcrafted resin art is an intricate, multi-stage art form requiring precise ingredient ratios, delicate flower & pigment placement, bubble degasification, and 3 to 5 days of undisturbed UV resin curing to achieve a crystal-clear, glass-like finish.",
        nextStepText:
          "Your piece is currently resting in a temperature-controlled, dust-free curing chamber for optimal hardness and clarity.",
        buttonLabel: "Track Crafting Progress",
        stepIndex: 2,
      };

    case "ready_to_ship":
      return {
        badgeText: "QUALITY INSPECTED &amp; PACKED",
        badgeBg: "#FDF2F6",
        badgeColor: "#9B2C54",
        badgeBorder: "#F9A8D4",
        subject: `Quality Inspection Passed & Boutique Packaged #${orderNumber}`,
        headline: `Your Resin Artwork Has Passed Quality Inspection!`,
        greetingSubtitle: "Curing complete & boutique packaged with love",
        primaryMessage:
          "Wonderful news! Your pieces have fully cured and successfully passed our rigorous clarity, gloss, and edge-finishing quality inspection. They are now delicately wrapped in boutique tissue, cushioned with protective padding, and boxed with signature Devangi Resin Studio packaging, ready for courier handover.",
        nextStepText:
          "Awaiting handover to our express courier partner for dispatch to your address.",
        buttonLabel: "Track Fulfillment Status",
        stepIndex: 3,
      };

    case "dispatched":
    case "shipped":
      return {
        badgeText: "DISPATCHED &amp; IN TRANSIT",
        badgeBg: "#EBF3FA",
        badgeColor: "#1E5B94",
        badgeBorder: "#BDD7EE",
        subject: `Your Order is On the Way! Dispatched #${orderNumber}`,
        headline: `Your Handcrafted Order Has Been Dispatched!`,
        greetingSubtitle: "Handed over to express courier partner with live tracking",
        primaryMessage:
          "Your boutique package has departed our studio and is now safely in transit with our courier partner! We've taken extra care to cushion and protect your glass-like resin creations so they arrive in pristine condition at your doorstep.",
        nextStepText:
          "You can follow the live delivery progress of your shipment using the tracking button below.",
        buttonLabel: "Track Courier Delivery",
        stepIndex: 4,
      };

    case "delivered":
      return {
        badgeText: "SAFELY DELIVERED",
        badgeBg: "#E8EFE8",
        badgeColor: "#2E7D32",
        badgeBorder: "#C5D8C5",
        subject: `Delivered with Love! Your Artwork has Arrived #${orderNumber}`,
        headline: `Delivered with Love! We Hope You Adore It ❤️`,
        greetingSubtitle: "Safely arrived at your destination",
        primaryMessage:
          "Your package has been successfully delivered! It has been an absolute joy creating this handcrafted resin piece for you. We truly hope it brings warmth, charm, and cherished memories into your home.",
        nextStepText:
          "Please unbox gently. We would love to see your piece! Share an unboxing photo or tag us on Instagram @devangi_resin_studio, or leave a review on our website.",
        buttonLabel: "View Order & Leave a Review",
        stepIndex: 5,
      };

    case "cancelled":
      return {
        badgeText: "ORDER CANCELLED",
        badgeBg: "#FDF2F2",
        badgeColor: "#DF4C4C",
        badgeBorder: "#FADBD8",
        subject: `Order Cancelled #${orderNumber} | Devangi Resin Studio`,
        headline: `Order #${orderNumber} Has Been Cancelled`,
        greetingSubtitle: "Notification regarding your order cancellation",
        primaryMessage:
          "We are writing to inform you that your order has been cancelled. If payment was completed, any eligible refund will be processed in accordance with our studio policies. If this was done in error, please reply to this email or reach out on WhatsApp.",
        nextStepText: "Our team is here to assist if you have any questions or would like to re-order.",
        buttonLabel: "View Order Details",
        stepIndex: 0,
      };

    default:
      return {
        badgeText: "ORDER STATUS UPDATE",
        badgeBg: "#FAF4EC",
        badgeColor: "#B8972E",
        badgeBorder: "#E8E0D5",
        subject: `Order Status Update #${orderNumber} | Devangi Resin Studio`,
        headline: `Update on Order #${orderNumber}`,
        greetingSubtitle: "Your order fulfillment status has been updated",
        primaryMessage: `Your order status has been updated to "${status.replace(/_/g, " ")}". Our artisan team is dedicated to providing you with the highest quality handcrafted artwork.`,
        nextStepText: "You can track the progress and details of your order on our tracking portal.",
        buttonLabel: "Track Your Order",
        stepIndex: 1,
      };
  }
}

/**
 * Returns the public live canonical site URL for customer-facing transactional emails.
 * Strictly guarantees that localhost / 127.0.0.1 is NEVER dispatched to real customer inboxes.
 */
export function getProductionSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL && !process.env.VERCEL_URL.includes("localhost")) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "https://devangiresinstudio.com";
}

/**
 * Sends a professionally styled transactional email whenever an order's
 * fulfillment status changes (or upon manual admin dispatch).
 */
export async function sendOrderStatusEmail(order: any, fulfillmentStatus: string): Promise<EmailResult> {
  if (!order || !order.customerEmail || order.customerEmail.startsWith("offline_")) {
    return { success: true, mocked: true, note: "No valid customer email on order" };
  }

  const siteUrl = getProductionSiteUrl();
  // High-availability CDN hosted logo for email clients (Gmail, Apple Mail, Outlook)
  const logoUrl = "https://rus9f71hta9djnrh.public.blob.vercel-storage.com/admin-media/1794226282779-resin_logo-wbFFqYrGKb9XuvQrNYoXdXnqHrTOqz.png";
  const trackUrl = `${siteUrl}/orders/${order.orderNumber}${order.secureLookupToken ? `?token=${order.secureLookupToken}` : ""}`;
  const adminMobile = "919967313355";
  const adminMobileDisplay = "+91 99673 13355";

  const statusInfo = getStatusEmailDetails(
    fulfillmentStatus,
    order.orderNumber,
    order.customerName || "Valued Customer"
  );

  // Render Purchased Items Table
  const itemsHtml = (order.items || [])
    .map((item: any) => {
      const customName = item.personalizationDetails?.customName;
      const palette = item.personalizationDetails?.colorTheme;
      return `
        <tr style="border-bottom: 1px solid #F0E6DF;">
          <td style="padding: 14px 10px; vertical-align: top;">
            <strong style="color: #2C2523; font-size: 13.5px; display: block; line-height: 1.35;">${item.productName}</strong>
            ${item.variantName ? `<span style="color: #8C7A72; font-size: 12px; display: block; margin-top: 2px;">Variant: ${item.variantName}</span>` : ""}
            ${customName ? `<span style="color: #800020; font-size: 11.5px; display: block; margin-top: 2px; font-weight: 600;">Custom Name: "${customName}"</span>` : ""}
            ${palette ? `<span style="color: #B8972E; font-size: 11px; display: block; margin-top: 1px;">Color Palette: ${palette}</span>` : ""}
          </td>
          <td style="padding: 14px 10px; text-align: center; vertical-align: top; color: #665A54; font-size: 13px; font-weight: 600;">
            ${item.quantity}
          </td>
          <td style="padding: 14px 10px; text-align: right; vertical-align: top; font-weight: 700; color: #2C2523; font-size: 13.5px;">
            ₹${Number(item.totalPrice || (item.unitPrice || 0) * item.quantity).toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join("");

  // Timeline Step Indicators (1 to 5)
  const timelineSteps = [
    { num: 1, label: "Confirmed" },
    { num: 2, label: "Crafting" },
    { num: 3, label: "Quality Check" },
    { num: 4, label: "Dispatched" },
    { num: 5, label: "Delivered" },
  ];

  const timelineHtml = statusInfo.stepIndex > 0 ? `
    <div style="background: #FAF8F5; border: 1px solid #E8E0D5; border-radius: 14px; padding: 16px 12px; margin: 24px 0;">
      <p style="margin: 0 0 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #8C7A72; text-align: center;">
        Fulfillment Journey
      </p>
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 480px; margin: 0 auto; text-align: center;">
        <tr>
          ${timelineSteps.map((step) => {
    const isCompleted = statusInfo.stepIndex >= step.num;
    const isCurrent = statusInfo.stepIndex === step.num;
    const circleBg = isCurrent ? "#800020" : isCompleted ? "#2E7D32" : "#E8E0D5";
    const circleColor = isCompleted || isCurrent ? "#FFFFFF" : "#8C7A72";
    const labelColor = isCurrent ? "#800020" : isCompleted ? "#2C2523" : "#A89A92";
    const fontWeight = isCurrent ? "700" : isCompleted ? "600" : "500";
    return `
              <td align="center" style="padding: 0 4px; vertical-align: top;">
                <div style="width: 26px; height: 26px; line-height: 26px; border-radius: 50%; background: ${circleBg}; color: ${circleColor}; font-size: 11px; font-weight: bold; margin: 0 auto 6px; box-shadow: ${isCurrent ? "0 0 0 3px rgba(212,175,55,0.4)" : "none"};">
                  ${isCompleted && !isCurrent ? "&#10003;" : step.num}
                </div>
                <span style="font-size: 10px; color: ${labelColor}; font-weight: ${fontWeight}; display: block; line-height: 1.2;">
                  ${step.label}
                </span>
              </td>
            `;
  }).join("")}
        </tr>
      </table>
    </div>
  ` : "";

  // Courier Details Box (if available for dispatched/delivered)
  const isCourierRelevant = (statusInfo.stepIndex >= 4 || order.trackingNumber || order.courierName) && order.orderStatus !== "cancelled";
  const courierBoxHtml = isCourierRelevant && (order.courierName || order.trackingNumber) ? `
    <div style="background: #EBF3FA; border: 1px solid #BDD7EE; border-radius: 12px; padding: 14px 16px; margin: 20px 0;">
      <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
        <tr>
          <td style="font-size: 12px; color: #1E5B94; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 6px;">
            Courier Tracking Details
          </td>
        </tr>
        <tr>
          <td style="font-size: 13px; color: #2C2523; line-height: 1.5;">
            ${order.courierName ? `<strong>Courier Partner:</strong> ${order.courierName}<br>` : ""}
            ${order.trackingNumber ? `<strong>Tracking / AWB Number:</strong> <code style="background: #FFFFFF; padding: 2px 6px; border-radius: 4px; border: 1px solid #BDD7EE; font-family: monospace; font-size: 13px; font-weight: bold; color: #1E5B94;">${order.trackingNumber}</code>` : ""}
          </td>
        </tr>
      </table>
    </div>
  ` : "";

  // Shipping Address vs Studio Pickup
  const isPickup =
    !order.shippingAddressLine1 ||
    order.shippingAddressLine1.toLowerCase().includes("pick-up") ||
    order.shippingAddressLine1.toLowerCase().includes("pickup") ||
    order.shippingAddressLine1.toLowerCase().includes("walk-in");

  const addressHtml = isPickup ? `
    <div style="background: #FAF8F5; border-radius: 10px; padding: 12px; border: 1px solid #E8E0D5;">
      <span style="font-size: 11px; font-weight: 700; color: #8C7A72; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">Fulfilment Mode</span>
      <strong style="color: #2C2523; font-size: 13px;">Studio Pick-up / Direct Handover</strong>
      <p style="margin: 2px 0 0; color: #665A54; font-size: 12px;">Customer self-collection at studio (No courier shipping).</p>
    </div>
  ` : `
    <div style="background: #FAF8F5; border-radius: 10px; padding: 12px; border: 1px solid #E8E0D5;">
      <span style="font-size: 11px; font-weight: 700; color: #8C7A72; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">Shipping Address</span>
      <p style="margin: 0; color: #2C2523; font-size: 13px; line-height: 1.45;">
        ${order.customerName ? `<strong>${order.customerName}</strong><br>` : ""}
        ${order.shippingAddressLine1 || ""}${order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ""}<br>
        ${[order.shippingCity, order.shippingState].filter(Boolean).join(", ")}${order.shippingPostalCode ? ` - ${order.shippingPostalCode}` : ""}<br>
        ${order.customerPhone ? `<span style="color: #665A54; font-size: 12px;">Phone: ${order.customerPhone}</span>` : ""}
      </p>
    </div>
  `;

  // Resin Care Tips (specifically highlighted in Delivered email)
  const careTipsHtml = fulfillmentStatus === "delivered" ? `
    <div style="background: #FAF4EC; border: 1px solid #E8E0D5; border-radius: 14px; padding: 16px; margin: 24px 0;">
      <h3 style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #800020; text-transform: uppercase; letter-spacing: 1px;">
        Resin Art Care Instructions
      </h3>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #554A44; line-height: 1.6;">
        <li>Keep away from prolonged extreme heat sources or direct outdoor sun.</li>
        <li>Wipe gently with a clean, soft microfibre cloth and mild soapy water when needed.</li>
        <li>Avoid harsh chemical sprays, solvents, or abrasive scouring pads.</li>
        <li>Handle with loving care like fine crystal or art glass.</li>
      </ul>
    </div>
  ` : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusInfo.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F4EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2523; -webkit-font-smoothing: antialiased;">
  
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F8F4EE; padding: 24px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Card Container -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.06); border: 1px solid #EAE0D5;">
          
          <!-- Luxury Studio Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1A050F 0%, #2D0B1B 50%, #15040C 100%); padding: 32px 24px 28px; text-align: center; border-bottom: 3px solid #D4AF37;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center">
                    <img src="${logoUrl}" alt="Devangi Resin Studio Logo" width="68" height="68" style="display: block; border-radius: 50%; border: 2px solid #D4AF37; margin: 0 auto 10px; background: #260C18; padding: 2px;" />
                    <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 21px; font-weight: 700; letter-spacing: 2px; color: #FAF4EE; text-transform: uppercase;">
                      DEVANGI RESIN STUDIO
                    </h1>
                    <p style="margin: 5px 0 0; color: #D4AF37; font-size: 11px; letter-spacing: 1.8px; text-transform: uppercase; font-weight: 600;">
                      Handcrafted Keepsakes &amp; Botanical Resin Art
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 24px 28px;">
              
              <!-- Status Pill Badge -->
              <div style="text-align: center; margin-bottom: 18px;">
                <span style="display: inline-block; padding: 6px 16px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; background-color: ${statusInfo.badgeBg}; color: ${statusInfo.badgeColor}; border: 1px solid ${statusInfo.badgeBorder};">
                  ${statusInfo.badgeText}
                </span>
              </div>

              <!-- Main Headline & Subtitle -->
              <h2 style="margin: 0 0 8px; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #2C2523; text-align: center; line-height: 1.3;">
                ${statusInfo.headline}
              </h2>
              <p style="margin: 0 0 20px; font-size: 13px; color: #8C7A72; text-align: center;">
                ${statusInfo.greetingSubtitle}
              </p>

              <!-- Primary Status Message -->
              <div style="background-color: #FAF8F5; border-left: 4px solid #800020; border-radius: 0 12px 12px 0; padding: 14px 16px; margin-bottom: 22px;">
                <p style="margin: 0; font-size: 13.5px; line-height: 1.6; color: #4A3E38;">
                  ${statusInfo.primaryMessage}
                </p>
                ${statusInfo.nextStepText ? `
                  <p style="margin: 10px 0 0; font-size: 12.5px; line-height: 1.5; color: #800020; font-weight: 600;">
                    &#9670; ${statusInfo.nextStepText}
                  </p>
                ` : ""}
              </div>

              <!-- Visual Fulfillment Journey -->
              ${timelineHtml}

              <!-- Courier Box (If Dispatched / Has Tracking) -->
              ${courierBoxHtml}

              <!-- Track Order CTA Button -->
              <div style="text-align: center; margin: 28px 0 24px;">
                <a href="${trackUrl}" 
                   target="_blank"
                   style="background: linear-gradient(135deg, #800020 0%, #4A0E17 100%); color: #FAF4EE !important; text-decoration: none; padding: 15px 36px; border-radius: 9999px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 4px 18px rgba(128,0,32,0.3); border: 1px solid #D4AF37;">
                  ${statusInfo.buttonLabel} &rarr;
                </a>
                <p style="margin: 8px 0 0; font-size: 11px; color: #8C7A72;">
                  Order #${order.orderNumber} &bull; Instant live status tracking
                </p>
              </div>

              <!-- Resin Care Tips (Delivered) -->
              ${careTipsHtml}

              <!-- Order Summary Card -->
              <div style="border: 1px solid #E8E0D5; border-radius: 14px; overflow: hidden; margin-top: 26px;">
                <div style="background-color: #FAF4EC; padding: 12px 16px; border-bottom: 1px solid #E8E0D5; display: flex; justify-content: space-between;">
                  <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #800020;">
                    Order Summary (#${order.orderNumber})
                  </strong>
                </div>

                <div style="padding: 16px;">
                  
                  <!-- Items Table -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                    <thead>
                      <tr style="border-bottom: 2px solid #EAE0D5; color: #8C7A72; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px;">
                        <th align="left" style="padding-bottom: 8px;">Product</th>
                        <th align="center" style="padding-bottom: 8px;">Qty</th>
                        <th align="right" style="padding-bottom: 8px;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2" align="right" style="padding: 10px 10px 4px; font-size: 12.5px; color: #8C7A72;">Items Subtotal:</td>
                        <td align="right" style="padding: 10px 10px 4px; font-size: 13px; font-weight: 600; color: #2C2523;">₹${Number(order.subtotal || 0).toFixed(2)}</td>
                      </tr>
                      ${Number(order.discountAmount || 0) > 0 ? `
                        <tr>
                          <td colspan="2" align="right" style="padding: 4px 10px; font-size: 12.5px; color: #2E7D32;">
                            Discount Applied${order.discountReason ? ` (${order.discountReason})` : ""}:
                          </td>
                          <td align="right" style="padding: 4px 10px; font-size: 13px; font-weight: 600; color: #2E7D32;">
                            -₹${Number(order.discountAmount).toFixed(2)}
                          </td>
                        </tr>
                      ` : ""}
                      <tr>
                        <td colspan="2" align="right" style="padding: 4px 10px; font-size: 12.5px; color: #8C7A72;">Shipping:</td>
                        <td align="right" style="padding: 4px 10px; font-size: 13px; font-weight: 600; color: #2C2523;">
                          ${Number(order.shippingCharge || 0) === 0 ? '<span style="color: #2E7D32;">FREE / Studio Pickup</span>' : `₹${Number(order.shippingCharge).toFixed(2)}`}
                        </td>
                      </tr>
                      <tr style="border-top: 2px solid #EAE0D5;">
                        <td colspan="2" align="right" style="padding: 12px 10px 4px; font-size: 14px; font-weight: 700; color: #2C2523;">Grand Total:</td>
                        <td align="right" style="padding: 12px 10px 4px; font-size: 16px; font-weight: 800; color: #800020;">₹${Number(order.totalAmount || 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <!-- Shipping Destination -->
                  ${addressHtml}

                </div>
              </div>

              <!-- Direct Link Fallback -->
              <p style="margin: 20px 0 0; font-size: 11px; color: #8C7A72; text-align: center; line-height: 1.4;">
                Button not opening? Copy this direct tracking link into your browser:<br>
                <a href="${trackUrl}" style="color: #800020; text-decoration: underline; word-break: break-all;">
                  ${trackUrl}
                </a>
              </p>

            </td>
          </tr>

          <!-- Luxury Footer -->
          <tr>
            <td style="background-color: #1A050F; padding: 24px; text-align: center; border-top: 1px solid #D4AF37; color: #CBB5BD; font-size: 11.5px; line-height: 1.6;">
              <p style="margin: 0 0 8px; font-weight: 600; color: #FAF4EE; font-size: 12.5px;">
                Devangi Resin Studio &bull; Bespoke Botanical Art
              </p>
              <p style="margin: 0 0 12px;">
                Questions about your order? Reach us directly on 
                <a href="https://wa.me/${adminMobile}" target="_blank" style="color: #25D366; text-decoration: underline; font-weight: 600;">WhatsApp (${adminMobileDisplay})</a>
                or Instagram 
                <a href="https://www.instagram.com/devangi_resin_studio" target="_blank" style="color: #F1B6C4; text-decoration: underline;">@devangi_resin_studio</a>
              </p>
              <p style="margin: 0; color: #8C6E79; font-size: 10.5px;">
                &copy; ${new Date().getFullYear()} Devangi Resin Studio. Handcrafted with love in Mumbai, India.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->

      </td>
    </tr>
  </table>

</body>
</html>
  `;

  return sendBrevoEmail({
    to: [{ email: order.customerEmail, name: order.customerName }],
    subject: statusInfo.subject,
    htmlContent: html,
    textContent: `${statusInfo.headline}\n\n${statusInfo.primaryMessage}\n\nTrack your order: ${trackUrl}`,
  });
}

/**
 * Backward-compatible helper: sends order confirmation email.
 */
export async function sendOrderConfirmationEmail(order: any): Promise<EmailResult> {
  return sendOrderStatusEmail(order, "confirmed");
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
