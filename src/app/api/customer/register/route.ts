import { NextResponse } from "next/server";
import { z } from "zod";
import { dbStore } from "@/lib/db";
import { hashCustomerPassword, signCustomerSession, setCustomerSessionCookie } from "@/lib/auth/customer";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please provide a valid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  addressLine1: z.string().min(3, "Address is required."),
  addressLine2: z.string().optional().default(""),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required."),
  postalCode: z.string().min(4, "PIN / Postal code is required."),
  country: z.string().optional().default("India"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, password, addressLine1, addressLine2, city, state, postalCode, country } = result.data;

    // Check if customer email already exists
    const existing = await dbStore.getCustomerByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 400 }
      );
    }

    const passwordHash = await hashCustomerPassword(password);
    const newCustomer = await dbStore.createCustomer({
      name,
      email,
      phone,
      passwordHash,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    });

    const token = await signCustomerSession({
      customerId: newCustomer.id,
      email: newCustomer.email,
      name: newCustomer.name,
    });

    await setCustomerSessionCookie(token);

    return NextResponse.json({
      success: true,
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        addressLine1: newCustomer.addressLine1,
        addressLine2: newCustomer.addressLine2,
        city: newCustomer.city,
        state: newCustomer.state,
        postalCode: newCustomer.postalCode,
        country: newCustomer.country,
      },
    });
  } catch (err: any) {
    console.error("[Customer Register Error]", err);
    return NextResponse.json({ error: err.message || "Registration failed." }, { status: 500 });
  }
}
