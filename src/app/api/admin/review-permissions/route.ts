import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const grantSchema = z.object({
  customerId: z.string().min(1, "Customer selection is required"),
  productId: z.string().min(1, "Product selection is required"),
});

export async function GET() {
  try {
    await requireAdminAuth();
    const permissions = await dbStore.getReviewPermissions();
    const customers = await dbStore.getAllCustomersWithStats();
    const productsRes = await dbStore.getProducts({ limit: 100 });

    return NextResponse.json({
      success: true,
      permissions,
      customers: customers.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        avatarUrl: c.avatarUrl,
      })),
      products: (productsRes.products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        slug: p.slug,
        imageUrl: p.images?.[0]?.imageUrl || "",
      })),
    });
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
    const parsed = grantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || "Invalid input" },
        { status: 400 }
      );
    }

    const { customerId, productId } = parsed.data;
    const permission = await dbStore.grantReviewPermission(customerId, productId, admin.userId || "admin");

    return NextResponse.json({
      success: true,
      message: "Review permission granted successfully!",
      permission,
    });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

