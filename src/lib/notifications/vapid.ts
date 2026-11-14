import { setVapidDetails, sendNotification } from "web-push";
import { dbStore } from "@/lib/db";

export const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BDIW3L5Ch8TQ-4mxuUEaibYQtPO882KLeXqpbREzpWeI9YY2fYZyM1o2CpcWcWQIl7yyn8mxa0VzyhR8UNKmZ80";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "k4dOFOOnCTuZ2aJaT4o8b1EBtR1Sa0qN7fOmnI3nRFI";

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:devangiresinstudioofficial@gmail.com";

let vapidConfigured = false;

/**
 * Initializes web-push with VAPID credentials for Web Push RFC 8292.
 */
export function ensureWebPushConfigured(): void {
  if (!vapidConfigured) {
    try {
      setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      vapidConfigured = true;
    } catch (err: unknown) {
      console.error("[WebPush Setup Error]:", err);
    }
  }
}

export interface AdminPushPayload {
  title: string;
  body: string;
  url: string;
  type: "order" | "custom_request" | "review";
  tag?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Dispatches Web Push notification to all active admin devices.
 * Wakes up the mobile / desktop browser service worker even when the browser is closed.
 */
export async function sendAdminWebPush(payload: AdminPushPayload): Promise<{
  attempted: number;
  successful: number;
  failed: number;
}> {
  ensureWebPushConfigured();

  const subscriptions = await dbStore.getActivePushSubscriptions();
  if (!subscriptions || subscriptions.length === 0) {
    return { attempted: 0, successful: 0, failed: 0 };
  }

  let successful = 0;
  let failed = 0;

  const pushData = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    type: payload.type,
    tag: payload.tag || `drs-${payload.type}-${Date.now()}`,
    icon: "/images/logo/resin_logo.png",
    badge: "/images/logo/resin_logo.png",
    metadata: payload.metadata || {},
  });

  for (const sub of subscriptions) {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      await sendNotification(pushSubscription, pushData, {
        TTL: 86400, // 24 hours delivery window
        urgency: "high",
      });
      successful++;
    } catch (err: unknown) {
      failed++;
      const pushError = err as { statusCode?: number; message?: string };
      console.warn(
        `[WebPush Send Error for ${sub.endpoint.slice(0, 30)}...]:`,
        pushError.statusCode || pushError.message
      );

      // If the push service (Google FCM, Apple APNs, Mozilla) responds with 404 (Not Found)
      // or 410 (Gone), the user has revoked permission or the subscription expired.
      // We automatically mark it inactive so we don't send to a dead endpoint again.
      if (pushError.statusCode === 404 || pushError.statusCode === 410) {
        await dbStore.deactivatePushSubscription(sub.endpoint);
      }
    }
  }

  return { attempted: subscriptions.length, successful, failed };
}
