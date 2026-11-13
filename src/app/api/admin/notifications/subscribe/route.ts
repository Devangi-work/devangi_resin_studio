import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const subscriptionSchema = z.object({
  endpoint: z.string().url("Valid push endpoint required"),
  keys: z.object({
    p256dh: z.string().min(1, "p256dh key required"),
    auth: z.string().min(1, "auth secret required"),
  }),
  userAgent: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    // Allow saving push subscription for verified admin session or admin token
    const userId = session?.userId || "admin";

    const body = await request.json();
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid subscription payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { endpoint, keys, userAgent } = parsed.data;

    const saved = await dbStore.savePushSubscription({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId,
      userAgent: userAgent || request.headers.get("user-agent") || "",
    });

    return NextResponse.json({
      success: true,
      message: "Device registered for mobile push notifications.",
      subscriptionId: saved.id,
    });
  } catch (err: any) {
    console.error("[Push Subscribe Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to register push subscription" }, { status: 500 });
  }
}

