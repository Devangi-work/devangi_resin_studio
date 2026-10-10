import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { dbStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  try {
    const orders = await dbStore.getCustomerOrders(session.customerId || session.email);
    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
