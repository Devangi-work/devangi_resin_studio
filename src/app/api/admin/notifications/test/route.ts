import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { sendAdminWebPush } from "@/lib/notifications/vapid";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await sendAdminWebPush({
      title: "✨ Devangi Resin Studio Notification",
      body: "Mobile notification connected successfully! You will receive alerts here even when the browser is closed.",
      url: "/admin",
      type: "order",
      tag: `test-${Date.now()}`,
    });

    if (result.successful === 0 && result.attempted === 0) {
      return NextResponse.json({
        success: false,
        message: "No registered devices found. Please enable notifications on this device first.",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Test notification dispatched to ${result.successful} device(s). Check your mobile notification bar!`,
      details: result,
    });
  } catch (err: any) {
    console.error("[Test Push Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to send test push" }, { status: 500 });
  }
}

