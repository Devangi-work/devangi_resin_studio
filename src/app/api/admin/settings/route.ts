import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await dbStore.getSiteSettings();
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminAuth();
    const body = await request.json();
    const updated = await dbStore.updateSiteSettings(body);

    try {
      revalidatePath("/", "layout");
      revalidatePath("/checkout");
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const POST = PUT;
