import { NextResponse } from "next/server";
import { dbStore } from "@/lib/db";
import { z } from "zod";

const validateCouponSchema = z.object({
  code: z.string().min(1, "Please provide a coupon code."),
  cartAmount: z.coerce.number().positive("Cart amount must be greater than 0."),
  customerEmail: z.string().email().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = validateCouponSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { valid: false, message: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { code, cartAmount, customerEmail } = result.data;
    const validation = await dbStore.validateCoupon(code, cartAmount, customerEmail);

    if (!validation.valid) {
      return NextResponse.json(validation, { status: 400 });
    }

    return NextResponse.json(validation);
  } catch (err: any) {
    return NextResponse.json({ valid: false, message: err.message }, { status: 500 });
  }
}
