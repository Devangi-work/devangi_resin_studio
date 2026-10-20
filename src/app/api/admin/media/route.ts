import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireAdminAuth();
    const media = await dbStore.getMediaItems();
    return NextResponse.json({ success: true, media });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const body = await request.json();
    if (!body.url) {
      return NextResponse.json({ error: "Media URL is required" }, { status: 400 });
    }
    const item = await dbStore.addMediaItem(body);
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
