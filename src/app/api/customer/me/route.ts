import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { dbStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, customer: null });
  }

  const customer = await dbStore.getCustomerById(session.customerId);

  return NextResponse.json({
    authenticated: true,
    customer: {
      id: session.customerId,
      name: customer?.name || session.name,
      email: session.email,
      phone: customer?.phone || "",
      avatarUrl: customer?.avatarUrl || null,
      addressLine1: customer?.addressLine1 || "",
      addressLine2: customer?.addressLine2 || "",
      city: customer?.city || "",
      state: customer?.state || "",
      postalCode: customer?.postalCode || "",
      country: customer?.country || "India",
    },
  });
}
