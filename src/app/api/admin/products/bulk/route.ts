import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { z } from "zod";

const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1, "Please select at least one item"),
  status: z.enum(["draft", "published", "archived"]).optional(),
  action: z.enum(["status", "delete"]).optional(),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "Please select at least one item"),
});

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const body = await request.json();

    // Check if delete action requested via POST
    if (body.action === "delete") {
      const deleteResult = bulkDeleteSchema.safeParse(body);
      if (!deleteResult.success) {
        return NextResponse.json(
          { error: "Invalid payload", details: deleteResult.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      const res = await dbStore.bulkDeleteProducts(deleteResult.data.ids);
      return NextResponse.json({ success: true, count: res.count, deleted: true });
    }

    // Status update
    const result = bulkActionSchema.safeParse(body);
    if (!result.success || !result.data.status) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error?.flatten().fieldErrors },
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
    const res = await dbStore.bulkDeleteProducts(ids);

    return NextResponse.json({ success: true, count: res.count, deleted: true });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
