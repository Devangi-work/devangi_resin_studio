import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { dbStore } from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const session = await getCustomerSession();

    let userIdentifier = session?.customerId || session?.email;
    if (!userIdentifier) {
      const cookieStore = await cookies();
      let anonId = cookieStore.get("resin_anon_user_id")?.value;
      if (!anonId) {
        anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        cookieStore.set("resin_anon_user_id", anonId, {
          path: "/",
          maxAge: 365 * 24 * 60 * 60,
          sameSite: "lax",
        });
      }
      userIdentifier = anonId;
    }

    const result = await dbStore.toggleReviewLike(reviewId, userIdentifier);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Review Like Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

