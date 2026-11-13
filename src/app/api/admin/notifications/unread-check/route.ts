import { NextResponse } from "next/server";
import { dbStore } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * 2-Hour Periodic Background Check Endpoint.
 * Strictly designed for periodic 2-hour service worker & background checks.
 * Prevents aggressive or continuous polling.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get("since");

    // Look back 2 hours by default, or since the provided timestamp (clamped to max 24 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const sinceDate = sinceParam ? new Date(Math.max(new Date(sinceParam).getTime(), Date.now() - 24 * 60 * 60 * 1000)) : twoHoursAgo;

    const unread = await dbStore.getUnreadAdminNotificationsSince(sinceDate);

    return NextResponse.json(
      {
        success: true,
        checkedAt: new Date().toISOString(),
        intervalHours: 2,
        hasUnread: unread.length > 0,
        unreadCount: unread.length,
        notifications: unread.slice(0, 10),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    console.error("[Unread Check Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

