import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { dbStore } from "@/lib/db";

export async function GET() {
  try {
    await requireAdminAuth();
    const orders = await dbStore.getOrders();

    // CSV Header
    const headers = [
      "Order Number",
      "Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Shipping Address",
      "City",
      "State",
      "Pincode",
      "Order Status",
      "Payment Status",
      "Subtotal",
      "Discount",
      "Shipping",
      "Total Amount",
      "Tracking Number",
      "Courier Name",
      "Items Count",
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toISOString()}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerEmail}"`,
      `"${o.customerPhone}"`,
      `"${(o.shippingAddressLine1 + (o.shippingAddressLine2 ? ", " + o.shippingAddressLine2 : "")).replace(/"/g, '""')}"`,
      `"${o.shippingCity}"`,
      `"${o.shippingState}"`,
      `"${o.shippingPostalCode}"`,
      `"${o.orderStatus}"`,
      `"${o.paymentStatus}"`,
      o.subtotal,
      o.discountAmount,
      o.shippingCharge,
      o.totalAmount,
      `"${o.trackingNumber || ""}"`,
      `"${o.courierName || ""}"`,
      o.items?.length || 0,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="resinart-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
