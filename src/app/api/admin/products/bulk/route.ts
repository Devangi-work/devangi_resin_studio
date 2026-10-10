import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { z } from "zod";

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(["draft", "published", "archived"]),
});

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const body = await request.json();
    const result = bulkSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { ids, status } = result.data;
    await dbStore.bulkUpdateProductStatus(ids, status);

    return NextResponse.json({ success: true, count: ids.length, newStatus: status });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
