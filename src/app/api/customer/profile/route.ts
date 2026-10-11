import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { dbStore } from "@/lib/db";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10, "10-digit phone number is required").optional(),
  avatarUrl: z.string().url().nullable().optional(),
  addressLine1: z.string().min(3, "Address is required").optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().min(2, "City is required").optional(),
  state: z.string().min(2, "State is required").optional(),
  postalCode: z.string().regex(/^\d{6}$/, "6-digit postal code required").optional(),
  country: z.string().default("India").optional(),
});

export async function PUT(request: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await dbStore.updateCustomerProfile(session.customerId, result.data);

    return NextResponse.json({
      success: true,
      customer: {
        id: session.customerId,
        name: updated?.name || session.name,
        email: updated?.email || session.email,
        phone: updated?.phone || "",
        avatarUrl: updated?.avatarUrl || null,
        addressLine1: updated?.addressLine1 || "",
        addressLine2: updated?.addressLine2 || "",
        city: updated?.city || "",
        state: updated?.state || "",
        postalCode: updated?.postalCode || "",
        country: updated?.country || "India",
      },
    });
  } catch (err: any) {
    console.error("[Update Customer Profile Error]", err);
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
