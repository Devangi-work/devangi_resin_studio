// Microsoft Clarity Analytics Client API Utilities
// Safe wrappers that operate only in the browser and handle window.clarity safely

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

export const CLARITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "z9u8cerkjx";

/**
 * Set a custom key-value tag in Microsoft Clarity.
 * Custom tags allow filtering recordings and heatmaps by specific segments (e.g., cart_value, user_type).
 */
export function claritySet(key: string, value: string | number | boolean | string[]) {
  if (typeof window === "undefined" || typeof window.clarity !== "function") return;
  try {
    window.clarity("set", key, Array.isArray(value) ? value.join(",") : String(value));
  } catch (err) {
    // Non-blocking telemetry
    console.debug("[Clarity] set error:", err);
  }
}

/**
 * Identify a user in Microsoft Clarity.
 * Enables tracking recordings by verified customer ID or friendly display name.
 */
export function clarityIdentify(
  customId: string,
  friendlyName?: string,
  customSessionId?: string,
  customPageId?: string
) {
  if (typeof window === "undefined" || typeof window.clarity !== "function") return;
  try {
    window.clarity("identify", customId, customSessionId, customPageId, friendlyName);
  } catch (err) {
    console.debug("[Clarity] identify error:", err);
  }
}

/**
 * Send a custom event trigger to Microsoft Clarity (e.g. "add_to_cart", "checkout_complete").
 */
export function clarityEvent(eventName: string) {
  if (typeof window === "undefined" || typeof window.clarity !== "function") return;
  try {
    window.clarity("event", eventName);
  } catch (err) {
    console.debug("[Clarity] event error:", err);
  }
}

