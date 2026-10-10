import { NextResponse } from "next/server";
import { z } from "zod";
import { dbStore } from "@/lib/db";
import { verifyCustomerPassword, signCustomerSession, setCustomerSessionCookie } from "@/lib/auth/customer";

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
    }

    const { email, password } = result.data;
    const customer = await dbStore.getCustomerByEmail(email);

    if (!customer || !customer.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await verifyCustomerPassword(password, customer.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await signCustomerSession({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
    });

    await setCustomerSessionCookie(token);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err: any) {
    console.error("[Customer Login Error]", err);
    return NextResponse.json({ error: "An unexpected error occurred during login." }, { status: 500 });
  }
}
