import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { dbStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 30));

    const notifications = await dbStore.getAdminNotifications(limit);
    const unreadCount = await dbStore.getUnreadAdminNotificationsCount();

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err: any) {
    console.error("[Get Notifications Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, all } = body;

    if (all) {
      await dbStore.markAllAdminNotificationsAsRead();
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (id) {
      await dbStore.markAdminNotificationAsRead(id);
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    return NextResponse.json({ error: "Provide either notification 'id' or 'all: true'" }, { status: 400 });
  } catch (err: any) {
    console.error("[Mark Read Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

