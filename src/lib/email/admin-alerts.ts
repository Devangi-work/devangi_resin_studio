import { sendBrevoEmail, EmailResult, getProductionSiteUrl } from "@/lib/email/brevo";
import { dbStore } from "@/lib/db";

/**
 * Resolves the primary email address configured to receive administrative alerts.
 */
export async function getAdminNotificationRecipients(): Promise<{ email: string; name: string }[]> {
  try {
    const settings = await dbStore.getSiteSettings();
    const candidateEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      settings.adminNotificationEmail ||
      settings.contactEmail ||
      process.env.BREVO_SENDER_EMAIL ||
      "devangiresinstudioofficial@gmail.com";

    const cleanEmail = candidateEmail.trim();
    if (cleanEmail && cleanEmail.includes("@")) {
      return [{ email: cleanEmail, name: "Studio Administrator" }];
    }
  } catch (err) {
    console.warn("[getAdminNotificationRecipients] Error:", err);
  }

  return [{ email: "devangiresinstudioofficial@gmail.com", name: "Studio Administrator" }];
}

/**
 * Sends a rich, structured alert to admin whenever a new order is received.
 */
export async function sendAdminOrderReceivedEmail(order: any): Promise<EmailResult> {
  const recipients = await getAdminNotificationRecipients();
  const siteUrl = getProductionSiteUrl();
  const orderUrl = `${siteUrl}/admin/orders/${order.id || order.orderNumber}`;

  const formattedDate = new Date(order.createdAt || Date.now()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const addressLines = [
    order.shippingAddressLine1,
    order.shippingAddressLine2,
    order.shippingCity,
    order.shippingState,
    order.shippingPostalCode,
    order.shippingCountry || "India",
  ].filter(Boolean);
  const formattedAddress = addressLines.join(", ");

  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const itemsHtml = items.length > 0
    ? items
        .map(
          (item) => `
        <tr style="border-bottom: 1px solid #F2EBE5;">
          <td style="padding: 12px 10px; color: #2C2523; font-size: 13px;">
            <div style="font-weight: 600; color: #3A1823;">${item.productName || "Handmade Resin Piece"}</div>
            ${item.variantName ? `<div style="font-size: 11px; color: #8A6E78; margin-top: 2px;">Variant: ${item.variantName}</div>` : ""}
            ${item.personalizationDetails?.customName ? `<div style="font-size: 11px; color: #B84A67; font-weight: 600; margin-top: 2px;">Personalized Name: "${item.personalizationDetails.customName}"</div>` : ""}
            ${item.personalizationDetails?.notes ? `<div style="font-size: 11px; color: #7A5E68; margin-top: 2px;">Notes: ${item.personalizationDetails.notes}</div>` : ""}
          </td>
          <td style="padding: 12px 10px; text-align: center; color: #3A1823; font-weight: 600; font-size: 13px;">${item.quantity || 1}</td>
          <td style="padding: 12px 10px; text-align: right; color: #3A1823; font-weight: bold; font-size: 13px;">₹${Number(item.totalPrice || item.unitPrice || 0).toFixed(2)}</td>
        </tr>
      `
        )
        .join("")
    : `<tr><td colspan="3" style="padding: 12px; color: #7A5E68;">Order details logged in admin database.</td></tr>`;

  const totalAmount = Number(order.totalAmount || 0).toFixed(2);
  const subtotal = Number(order.subtotal || order.totalAmount || 0).toFixed(2);
  const shippingCharge = Number(order.shippingCharge || 0).toFixed(2);
  const discountAmount = Number(order.discountAmount || 0).toFixed(2);

  const subject = `🛍️ New Order Received: #${order.orderNumber} (₹${totalAmount}) - Devangi Resin Studio`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2523;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #EFE5DC; box-shadow: 0 10px 25px rgba(58,24,35,0.05);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3A1823 0%, #220B13 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #D4AF37;">
                  <div style="font-size: 11px; letter-spacing: 3px; color: #D4AF37; text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">Studio Administrator Notification</div>
                  <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; color: #FFFFFF; letter-spacing: 0.5px;">New Customer Order</h1>
                  <div style="display: inline-block; margin-top: 12px; padding: 6px 16px; background-color: rgba(212,175,55,0.15); border: 1px solid #D4AF37; border-radius: 50px; color: #FAF0F3; font-size: 13px; font-weight: 600;">
                    Order #${order.orderNumber} &bull; ₹${totalAmount}
                  </div>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 28px 24px;">
                  
                  <!-- Key Meta Grid -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FDF9F6; border: 1px solid #EFE3E7; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 14px 16px; border-bottom: 1px solid #EFE3E7; width: 50%;">
                        <div style="font-size: 11px; color: #8A6E78; text-transform: uppercase; font-weight: 600;">Order Date & Time</div>
                        <div style="font-size: 13px; font-weight: 600; color: #3A1823; margin-top: 2px;">${formattedDate}</div>
                      </td>
                      <td style="padding: 14px 16px; border-bottom: 1px solid #EFE3E7; width: 50%;">
                        <div style="font-size: 11px; color: #8A6E78; text-transform: uppercase; font-weight: 600;">Order Source</div>
                        <div style="font-size: 13px; font-weight: 600; color: #3A1823; margin-top: 2px; text-transform: capitalize;">${order.orderSource || "Online Checkout"}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 14px 16px; width: 50%;">
                        <div style="font-size: 11px; color: #8A6E78; text-transform: uppercase; font-weight: 600;">Payment Status</div>
                        <div style="font-size: 13px; font-weight: 700; color: #166534; margin-top: 2px; text-transform: uppercase;">
                          ${(order.paymentStatus || "PAID").replace(/_/g, " ")}
                        </div>
                      </td>
                      <td style="padding: 14px 16px; width: 50%;">
                        <div style="font-size: 11px; color: #8A6E78; text-transform: uppercase; font-weight: 600;">Payment Reference / UTR</div>
                        <div style="font-size: 13px; font-weight: 600; color: #3A1823; margin-top: 2px;">${order.upiTransactionId || "Verified Online"}</div>
                      </td>
                    </tr>
                  </table>

                  <!-- Customer & Delivery Information -->
                  <h3 style="font-family: Georgia, serif; font-size: 16px; color: #3A1823; margin: 0 0 10px 0;">Customer & Shipping Address</h3>
                  <div style="background-color: #FFFFFF; border: 1px solid #EFE5DC; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
                    <div style="font-weight: 700; font-size: 14px; color: #3A1823;">${order.customerName || "Customer"}</div>
                    <div style="font-size: 13px; color: #5C4A51; margin-top: 4px;"><strong>Contact:</strong> ${order.customerPhone || "Not provided"}</div>
                    ${order.customerEmail ? `<div style="font-size: 13px; color: #5C4A51; margin-top: 2px;"><strong>Email:</strong> ${order.customerEmail}</div>` : ""}
                    <div style="font-size: 13px; color: #5C4A51; margin-top: 4px; line-height: 1.4;"><strong>Address:</strong> ${formattedAddress || "Store Pickup / Not provided"}</div>
                    ${order.orderNotes ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #EFE3E7; font-size: 12px; color: #B84A67;"><strong>Order Note:</strong> ${order.orderNotes}</div>` : ""}
                  </div>

                  <!-- Itemized Table -->
                  <h3 style="font-family: Georgia, serif; font-size: 16px; color: #3A1823; margin: 0 0 10px 0;">Ordered Creations</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                      <tr style="background-color: #FAF0F3; border-bottom: 2px solid #EFE3E7;">
                        <th style="padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #7A5E68;">Artwork / Details</th>
                        <th style="padding: 10px; text-align: center; font-size: 11px; text-transform: uppercase; color: #7A5E68; width: 60px;">Qty</th>
                        <th style="padding: 10px; text-align: right; font-size: 11px; text-transform: uppercase; color: #7A5E68; width: 90px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <!-- Totals Breakdown -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                    <tr>
                      <td align="right" style="padding: 4px 10px; font-size: 13px; color: #7A5E68;">Subtotal:</td>
                      <td width="100" align="right" style="padding: 4px 10px; font-size: 13px; font-weight: 600; color: #3A1823;">₹${subtotal}</td>
                    </tr>
                    ${Number(discountAmount) > 0 ? `
                    <tr>
                      <td align="right" style="padding: 4px 10px; font-size: 13px; color: #166534;">Discount (${order.discountReason || "Coupon"}):</td>
                      <td width="100" align="right" style="padding: 4px 10px; font-size: 13px; font-weight: 600; color: #166534;">-₹${discountAmount}</td>
                    </tr>` : ""}
                    <tr>
                      <td align="right" style="padding: 4px 10px; font-size: 13px; color: #7A5E68;">Shipping:</td>
                      <td width="100" align="right" style="padding: 4px 10px; font-size: 13px; font-weight: 600; color: #3A1823;">₹${shippingCharge}</td>
                    </tr>
                    <tr style="border-top: 2px solid #3A1823;">
                      <td align="right" style="padding: 10px; font-size: 15px; font-weight: bold; color: #3A1823;">Grand Total:</td>
                      <td width="100" align="right" style="padding: 10px; font-size: 17px; font-weight: 800; color: #B84A67;">₹${totalAmount}</td>
                    </tr>
                  </table>

                  ${order.paymentScreenshotUrl ? `
                  <div style="background-color: #FAF4EC; border: 1px solid #EFE3E7; border-radius: 12px; padding: 14px; margin-bottom: 24px; text-align: center;">
                    <div style="font-size: 12px; font-weight: 700; color: #3A1823; margin-bottom: 6px;">Customer Uploaded UPI Payment Receipt:</div>
                    <a href="${order.paymentScreenshotUrl}" target="_blank" style="color: #B84A67; font-weight: 600; font-size: 13px; text-decoration: underline;">View Uploaded Receipt Image &rarr;</a>
                  </div>
                  ` : ""}

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0 10px;">
                    <a href="${orderUrl}" target="_blank" style="display: inline-block; background-color: #3A1823; color: #FFFFFF; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 700; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(58,24,35,0.25);">
                      Manage Order in Admin Dashboard &rarr;
                    </a>
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #FAF0F3; padding: 18px 24px; text-align: center; border-top: 1px solid #EFE3E7; font-size: 11px; color: #8A6E78;">
                  Devangi Resin Studio &bull; Automated Admin Notification System<br>
                  This alert was dispatched automatically upon order receipt.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    to: recipients,
    subject,
    htmlContent,
  });
}

/**
 * Sends a rich alert to admin whenever a custom studio form (custom bespoke request) is submitted.
 */
export async function sendAdminCustomRequestReceivedEmail(request: any): Promise<EmailResult> {
  const recipients = await getAdminNotificationRecipients();
  const siteUrl = getProductionSiteUrl();
  const customUrl = `${siteUrl}/admin/custom-requests`;

  const formattedDate = new Date(request.createdAt || Date.now()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subject = `🎨 New Custom Studio Inquiry: ${request.customerName} (${request.productType}) - Devangi Resin Studio`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2523;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #EFE5DC; box-shadow: 0 10px 25px rgba(58,24,35,0.05);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3A1823 0%, #220B13 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #D4AF37;">
                  <div style="font-size: 11px; letter-spacing: 3px; color: #D4AF37; text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">Personalised Keepsake Studio</div>
                  <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; color: #FFFFFF; letter-spacing: 0.5px;">New Custom Bespoke Inquiry</h1>
                  <div style="display: inline-block; margin-top: 12px; padding: 6px 16px; background-color: rgba(212,175,55,0.15); border: 1px solid #D4AF37; border-radius: 50px; color: #FAF0F3; font-size: 13px; font-weight: 600;">
                    ${request.productType} &bull; Budget: ${request.budget || "Flexible"}
                  </div>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 28px 24px;">
                  
                  <div style="background-color: #FDF9F6; border: 1px solid #EFE3E7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <div style="font-size: 11px; color: #8A6E78; text-transform: uppercase; font-weight: 700;">Client Contact Details</div>
                    <div style="font-size: 16px; font-weight: bold; color: #3A1823; margin-top: 4px;">${request.customerName}</div>
                    <div style="font-size: 13px; color: #5C4A51; margin-top: 6px;"><strong>Phone / WhatsApp:</strong> ${request.customerPhone}</div>
                    <div style="font-size: 13px; color: #5C4A51; margin-top: 2px;"><strong>Email:</strong> ${request.customerEmail}</div>
                    <div style="font-size: 12px; color: #8A6E78; margin-top: 6px;">Submitted on ${formattedDate}</div>
                  </div>

                  <h3 style="font-family: Georgia, serif; font-size: 16px; color: #3A1823; margin: 0 0 10px 0;">Artwork Vision & Description</h3>
                  <div style="background-color: #FFFFFF; border-left: 4px solid #B84A67; padding: 14px 18px; background-color: #FAF5F7; border-radius: 0 12px 12px 0; margin-bottom: 24px; font-size: 14px; line-height: 1.6; color: #3A1823; font-style: italic;">
                    &ldquo;${request.description}&rdquo;
                  </div>

                  ${request.referenceImageUrl ? `
                  <h3 style="font-family: Georgia, serif; font-size: 16px; color: #3A1823; margin: 0 0 10px 0;">Client Reference Image</h3>
                  <div style="text-align: center; background-color: #FAF0F3; border: 1px solid #EFE3E7; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <img src="${request.referenceImageUrl}" alt="Client Reference" style="max-width: 100%; max-height: 280px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 10px; display: inline-block;">
                    <div>
                      <a href="${request.referenceImageUrl}" target="_blank" style="color: #B84A67; font-weight: 600; font-size: 13px; text-decoration: underline;">View Full-Resolution Image &rarr;</a>
                    </div>
                  </div>
                  ` : ""}

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0 10px;">
                    <a href="${customUrl}" target="_blank" style="display: inline-block; background-color: #3A1823; color: #FFFFFF; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 700; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(58,24,35,0.25);">
                      Review Inquiry & Quote in Studio &rarr;
                    </a>
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #FAF0F3; padding: 18px 24px; text-align: center; border-top: 1px solid #EFE3E7; font-size: 11px; color: #8A6E78;">
                  Devangi Resin Studio &bull; Custom Keepsake Studio Alerts
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    to: recipients,
    subject,
    htmlContent,
  });
}

/**
 * Sends an alert to admin whenever a customer submits a new review for a product.
 */
export async function sendAdminReviewReceivedEmail(review: any, product?: any): Promise<EmailResult> {
  const recipients = await getAdminNotificationRecipients();
  const siteUrl = getProductionSiteUrl();
  const reviewsUrl = `${siteUrl}/admin/reviews`;

  const productName = product?.name || review.productName || "Handmade Resin Creation";
  const ratingStars = "★".repeat(Math.max(1, Math.min(5, Number(review.rating) || 5))) +
                      "☆".repeat(Math.max(0, 5 - Math.min(5, Number(review.rating) || 5)));

  const subject = `⭐ New Review: ${review.rating}/5 Stars for "${productName}" - Devangi Resin Studio`;

  const imagesHtml = Array.isArray(review.images) && review.images.length > 0
    ? `
      <div style="margin-top: 14px;">
        <div style="font-size: 12px; font-weight: 600; color: #7A5E68; margin-bottom: 6px;">Customer Attached Photos:</div>
        <div style="display: flex; gap: 8px;">
          ${review.images.map((img: string) => `<img src="${img}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; border: 1px solid #EFE3E7;">`).join("")}
        </div>
      </div>
    `
    : "";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2523;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #EFE5DC; box-shadow: 0 10px 25px rgba(58,24,35,0.05);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3A1823 0%, #220B13 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #D4AF37;">
                  <div style="font-size: 11px; letter-spacing: 3px; color: #D4AF37; text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">Customer Feedback & Ratings</div>
                  <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; color: #FFFFFF; letter-spacing: 0.5px;">New Review Received</h1>
                  <div style="display: inline-block; margin-top: 12px; padding: 6px 16px; background-color: rgba(212,175,55,0.15); border: 1px solid #D4AF37; border-radius: 50px; color: #D4AF37; font-size: 18px; font-weight: 700; letter-spacing: 2px;">
                    ${ratingStars} (${review.rating}/5)
                  </div>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 28px 24px;">
                  
                  <div style="background-color: #FDF9F6; border: 1px solid #EFE3E7; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                    <div style="font-size: 11px; color: #8A6E78; text-transform: uppercase; font-weight: 600;">Product Reviewed</div>
                    <div style="font-size: 16px; font-weight: bold; color: #3A1823; margin-top: 3px;">${productName}</div>
                  </div>

                  <div style="background-color: #FFFFFF; border: 1px solid #EFE5DC; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <span style="font-weight: 700; font-size: 14px; color: #3A1823;">${review.customerName || "Customer"}</span>
                      ${review.isVerifiedPurchase ? `<span style="font-size: 11px; background-color: #E8F5E9; color: #2E7D32; font-weight: 600; padding: 3px 8px; border-radius: 12px;">Verified Purchase</span>` : ""}
                    </div>
                    <div style="font-size: 12px; color: #8A6E78; margin-bottom: 12px;">Email: ${review.customerEmail || "Not provided"}</div>
                    
                    <div style="font-size: 14px; color: #3A1823; line-height: 1.6; font-style: italic; background-color: #FAF5F7; padding: 12px 14px; border-radius: 8px;">
                      &ldquo;${review.reviewText || "(No written text)"}&rdquo;
                    </div>

                    ${imagesHtml}
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0 10px;">
                    <a href="${reviewsUrl}" target="_blank" style="display: inline-block; background-color: #3A1823; color: #FFFFFF; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 700; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(58,24,35,0.25);">
                      Open Reviews Manager &rarr;
                    </a>
                  </div>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #FAF0F3; padding: 18px 24px; text-align: center; border-top: 1px solid #EFE3E7; font-size: 11px; color: #8A6E78;">
                  Devangi Resin Studio &bull; Automated Review Alerts
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendBrevoEmail({
    to: recipients,
    subject,
    htmlContent,
  });
}
