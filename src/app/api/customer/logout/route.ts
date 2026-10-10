import { NextResponse } from "next/server";
import { removeCustomerSessionCookie } from "@/lib/auth/customer";

export async function POST() {
  await removeCustomerSessionCookie();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
