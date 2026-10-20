import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { productSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    await requireAdminAuth();
    const { searchParams } = new URL(request.url);

    const categoryId = searchParams.get("categoryId") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 50;

    const data = await dbStore.getProducts({
      categoryId,
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const body = await request.json();
    if (!body.sku && body.name) {
      body.sku = `RA-${body.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "ART"}-${Math.floor(100 + Math.random() * 900)}`;
    }
    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    }
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const created = await dbStore.createProduct(result.data);
    
    try {
      revalidatePath("/");
      revalidatePath("/shop");
    } catch {}

    return NextResponse.json({ success: true, product: created }, { status: 201 });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
