import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireAdminAuth();
    const stats = await dbStore.getDashboardStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
