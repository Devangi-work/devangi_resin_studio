import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    await dbStore.deleteMediaItem(id);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
