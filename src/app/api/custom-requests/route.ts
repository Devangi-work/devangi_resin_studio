import { NextResponse } from "next/server";
import { z } from "zod";
import { dbStore } from "@/lib/db";

export const dynamic = "force-dynamic";

const customRequestSchema = z.object({
  customerName: z.string().min(2, "Name is required."),
  customerEmail: z.string().email("Valid email required."),
  customerPhone: z.string().min(10, "Phone number is required."),
  productType: z.string().min(2, "Product type is required."),
  budget: z.string().optional(),
  description: z.string().min(10, "Please describe your vision in a few sentences."),
  referenceImageUrl: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const requests = await dbStore.getCustomRequests({ status, search });
    return NextResponse.json({ success: true, requests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = customRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const createdRequest = await dbStore.createCustomRequest({
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      productType: data.productType,
      budget: data.budget || "Not Specified",
      description: data.description,
      referenceImageUrl: data.referenceImageUrl || null,
    });

    return NextResponse.json({
      success: true,
      message: "Your custom resin order request has been received! Our artisan will contact you within 24 hours.",
      request: createdRequest,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
