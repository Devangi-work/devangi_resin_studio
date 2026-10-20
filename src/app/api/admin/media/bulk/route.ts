import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { z } from "zod";

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "Please select at least one media asset"),
});

export async function DELETE(request: Request) {
  try {
    await requireAdminAuth();
    const body = await request.json();
    const result = bulkDeleteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { ids } = result.data;
    const res = await dbStore.bulkDeleteMedia(ids);

    return NextResponse.json({ success: true, count: res.count, deleted: true });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return DELETE(request);
}
