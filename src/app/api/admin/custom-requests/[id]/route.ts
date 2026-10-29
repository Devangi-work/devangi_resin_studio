import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateCustomRequestSchema = z.object({
  status: z.enum(["new", "in_review", "quoted", "accepted", "declined", "converted", "converted_to_order"]).optional(),
  adminNotes: z.string().optional(),
  quoteAmount: z.number().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    const reqItem = await dbStore.getCustomRequestById(id);
    if (!reqItem) {
      return NextResponse.json({ error: "Custom request not found" }, { status: 404 });
    }
    return NextResponse.json(reqItem);
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    const body = await request.json();
    const result = updateCustomRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, adminNotes, quoteAmount } = result.data;
    const updated = await dbStore.updateCustomRequestStatus(
      id,
      status,
      adminNotes,
      quoteAmount
    );

    return NextResponse.json({ success: true, request: updated });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await params;
    await dbStore.deleteCustomRequest(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

