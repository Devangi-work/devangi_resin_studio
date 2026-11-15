import { NextResponse } from "next/server";
import { z } from "zod";
import { dbStore } from "@/lib/db";
import { notifyAdminOnCustomRequest } from "@/lib/notifications/admin-dispatcher";

export const dynamic = "force-dynamic";

const customRequestSchema = z.object({
  customerName: z.string().trim().min(1, "Please provide your name."),
  customerEmail: z.string().trim().email("Please provide a valid email address."),
  customerPhone: z
    .string()
    .trim()
    .refine((val) => val.replace(/[^0-9]/g, "").length >= 7, {
      message: "Please enter a valid phone number (at least 7 digits).",
    }),
  productType: z.string().trim().min(1, "Product type is required."),
  budget: z.string().trim().optional().nullable(),
  description: z.string().trim().min(2, "Please describe your vision in a few words."),
  referenceImageUrl: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
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
      const fieldErrors = result.error.flatten().fieldErrors;
      const errorList = Object.values(fieldErrors).flat();
      const firstErrorMessage = errorList[0] || "Please fill all required fields correctly.";
      return NextResponse.json(
        { error: firstErrorMessage, message: firstErrorMessage, details: fieldErrors },
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

    // Dispatch Admin Notification (Push + Email)
    try {
      await notifyAdminOnCustomRequest(createdRequest);
    } catch (notifErr) {
      console.warn("[Custom Request Admin Notification Error]:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Your custom resin order request has been received! Our artisan will contact you within 24 hours.",
      request: createdRequest,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
