import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { stockAdjustmentSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireAdminAuth();
    const inventory = await dbStore.getInventoryOverview();
    return NextResponse.json(inventory);
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminAuth();
    const body = await request.json();
    const result = stockAdjustmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, variantId, changeAmount, reason } = result.data;
    const adjustment = await dbStore.adjustStock(
      productId,
      variantId || null,
      changeAmount,
      reason,
      admin.fullName || admin.email
    );

    return NextResponse.json({ success: true, adjustment });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
