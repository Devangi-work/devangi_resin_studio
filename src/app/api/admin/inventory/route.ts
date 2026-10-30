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

    // Direct quantity or settings update
    if (body.action === "set_stock" || body.action === "update_settings") {
      const { productId, stockQuantity, trackInventory, lowStockThreshold, allowBackorders, reason } = body;
      if (!productId) {
        return NextResponse.json({ error: "Product ID required" }, { status: 400 });
      }
      await dbStore.updateProductInventorySettings(
        productId,
        {
          stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
          trackInventory: trackInventory !== undefined ? Boolean(trackInventory) : undefined,
          lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : undefined,
          allowBackorders: allowBackorders !== undefined ? Boolean(allowBackorders) : undefined,
          reason,
        },
        admin.fullName || admin.email
      );
      return NextResponse.json({ success: true });
    }

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

export async function PUT(request: Request) {
  try {
    const admin = await requireAdminAuth();
    const body = await request.json();
    const { productId, stockQuantity, trackInventory, lowStockThreshold, allowBackorders, reason } = body;
    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }
    await dbStore.updateProductInventorySettings(
      productId,
      {
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
        trackInventory: trackInventory !== undefined ? Boolean(trackInventory) : undefined,
        lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : undefined,
        allowBackorders: allowBackorders !== undefined ? Boolean(allowBackorders) : undefined,
        reason,
      },
      admin.fullName || admin.email
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
