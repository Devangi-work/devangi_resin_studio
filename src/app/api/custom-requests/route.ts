import { NextResponse } from "next/server";
import { z } from "zod";

const customRequestSchema = z.object({
  customerName: z.string().min(2, "Name is required."),
  customerEmail: z.string().email("Valid email required."),
  customerPhone: z.string().min(10, "Phone number is required."),
  productType: z.string().min(2, "Product type is required."),
  budget: z.string().optional(),
  description: z.string().min(10, "Please describe your vision in a few sentences."),
  referenceImageUrl: z.string().optional().nullable(),
});

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
    const requestItem = {
      id: `req_${Date.now()}`,
      ...data,
      status: "new",
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      message: "Your custom resin order request has been received! Our artisan will contact you within 24 hours.",
      request: requestItem,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
