import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dbStore } from "@/lib/db";
import { OrderCancellationCard } from "@/components/orders/OrderCancellationCard";
import {
  CheckCircle2,
  Package,
  Truck,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  ShieldCheck,
  Printer,
  ChevronRight,
} from "lucide-react";

interface OrderPageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string; verified?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: OrderPageProps) {
  const { orderNumber } = await params;
  const { token, verified } = await searchParams;

  const order = await dbStore.getOrderByNumber(orderNumber, token);

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-[#FAF4EC] rounded-full flex items-center justify-center text-[#B8972E] mx-auto border border-[#E8E0D5]">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#2C332D]">Order Not Found</h1>
        <p className="text-xs text-[#736C66]">
          We could not locate this order with the provided credentials.
        </p>
        <Link
          href="/track-order"
          className="inline-block mt-2 px-6 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-full hover:bg-[#3D473E]"
        >
          Look Up Order
        </Link>
      </div>
    );
  }

  // Visual status timeline steps
  const steps = [
    { key: "confirmed", label: "Confirmed", desc: "Payment received & order verified" },
    { key: "processing", label: "Crafting & Curing", desc: "Resin pouring and 3-5 day curing" },
    { key: "ready_to_ship", label: "Quality Check", desc: "Inspection & boutique gift packaging" },
    { key: "shipped", label: "Dispatched", desc: "In transit with courier tracking" },
    { key: "delivered", label: "Delivered", desc: "Safely arrived at destination" },
  ];

  const statusOrder = ["pending_payment", "confirmed", "processing", "ready_to_ship", "shipped", "delivered"];
  const currentStepIdx = statusOrder.indexOf(order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      
      {/* Success Banner */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E0D5] shadow-sm text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-[#E8EFE8] text-[#2E7D32] flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="text-xs uppercase font-bold tracking-widest text-[#B8972E] block">
          Order Placed Successfully
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C332D]">
          Thank you for shopping!
        </h1>
        <div className="p-4 bg-[#FAF4EC] border border-[#E8E0D5] rounded-2xl max-w-lg mx-auto">
          <p className="text-xs sm:text-sm font-medium text-[#2C332D] leading-relaxed">
            Your payment is getting validated. After confirmation, your order will start processing.
          </p>
        </div>
        <p className="text-xs text-[#736C66] max-w-md mx-auto leading-relaxed">
          An itemized receipt and tracking updates will be dispatched to <strong>{order.customerEmail}</strong>.
        </p>
        <div className="inline-block bg-[#FAF8F5] px-4 py-2 rounded-xl border border-[#E8E0D5] text-xs">
          <span className="text-[#8C7A72]">Order Number:</span>{" "}
          <strong className="text-[#2C332D] font-mono text-sm">{order.orderNumber}</strong>
        </div>
      </div>

      {/* Order Status Timeline */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#F4EBE6] pb-3">
          <h2 className="font-serif text-lg font-bold text-[#2C332D] flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#B8972E]" />
            <span>Fulfillment Timeline</span>
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-[#FAF4EC] text-[#B8972E] rounded-full">
            {order.orderStatus.replace(/_/g, " ")}
          </span>
        </div>

        {/* Steps display */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {steps.map((st, idx) => {
            const stepNum = idx + 1; // 1 to 5
            const isCompleted = currentStepIdx >= stepNum;
            const isCurrent = currentStepIdx === stepNum;

            return (
              <div key={st.key} className="flex sm:flex-col items-center sm:text-center space-x-3 sm:space-x-0 space-y-0 sm:space-y-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-[#2E7D32] text-white shadow-sm"
                      : isCurrent
                      ? "bg-[#D4AF37] text-white ring-4 ring-[#FAF4EC]"
                      : "bg-[#F4EBE6] text-[#A69E96]"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2C332D]">{st.label}</p>
                  <p className="text-[10px] text-[#736C66] hidden sm:block mt-0.5 leading-tight">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Courier tracking alert if shipped */}
        {order.trackingNumber && (
          <div className="bg-[#FAF4EC] p-4 rounded-xl border border-[#E8E0D5] flex items-start space-x-3 text-xs text-[#2C332D]">
            <Truck className="w-5 h-5 text-[#B8972E] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Shipment Dispatched!</p>
              <p className="text-[#736C66] mt-0.5">
                Courier: <strong>{order.courierName || "Standard Express"}</strong> | Tracking AWB:{" "}
                <strong className="font-mono text-[#2C332D]">{order.trackingNumber}</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 1-Hour Cancellation Action Card */}
      <OrderCancellationCard
        orderNumber={order.orderNumber}
        createdAt={order.createdAt}
        currentStatus={order.orderStatus}
        cancellationReason={order.cancellationReason}
      />

      {/* Order Details & Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Shipping Address */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-3">
          <h3 className="font-serif text-sm font-bold text-[#2C332D] flex items-center space-x-1.5 border-b border-[#F4EBE6] pb-2">
            <MapPin className="w-4 h-4 text-[#B8972E]" />
            <span>Shipping Address</span>
          </h3>
          <p className="text-xs text-[#2C332D] font-bold">{order.customerName}</p>
          <p className="text-xs text-[#736C66] leading-relaxed">
            {order.shippingAddressLine1}
            {order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ""}
            <br />
            {order.shippingCity}, {order.shippingState} - {order.shippingPostalCode}
            <br />
            {order.shippingCountry}
          </p>
          <p className="text-xs text-[#736C66] pt-1">
            <strong>Phone:</strong> {order.customerPhone}
          </p>
        </div>

        {/* Payment Summary */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E0D5] shadow-sm space-y-3">
          <h3 className="font-serif text-sm font-bold text-[#2C332D] flex items-center space-x-1.5 border-b border-[#F4EBE6] pb-2">
            <ShieldCheck className="w-4 h-4 text-[#B8972E]" />
            <span>Payment Breakdown</span>
          </h3>
          <div className="space-y-1.5 text-xs text-[#736C66]">
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="font-bold uppercase text-[#2C332D]">UPI (Instant QR)</span>
            </div>
            {order.upiTransactionId && (
              <div className="flex justify-between">
                <span>UPI Ref / UTR:</span>
                <span className="font-mono text-xs text-[#2C332D]">{order.upiTransactionId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Payment Status:</span>
              <span className="font-bold uppercase text-[#2E7D32]">{order.paymentStatus}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-[#2C332D]">₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-[#2E7D32]">
                <span>Discount Applied:</span>
                <span>-₹{Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping Charge:</span>
              <span className="font-semibold text-[#2C332D]">
                {Number(order.shippingCharge) === 0 ? "FREE" : `₹${Number(order.shippingCharge).toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#2C332D] border-t border-[#E8E0D5] pt-2">
              <span>Grand Total:</span>
              <span className="text-[#B8972E] text-base">₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Snapshot Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D5] shadow-sm space-y-4">
        <h3 className="font-serif text-base font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
          Purchased Items ({order.items?.length || 0})
        </h3>
        <div className="divide-y divide-[#F4EBE6]">
          {order.items?.map((item: any) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-[#2C332D]">{item.productName}</p>
                {item.variantName && <p className="text-[#736C66]">{item.variantName}</p>}
                {item.personalizationDetails?.customName && (
                  <span className="text-[10px] bg-[#FAF4EC] text-[#B8972E] px-2 py-0.5 rounded font-medium inline-block mt-0.5">
                    Custom Name: "{item.personalizationDetails.customName}"
                  </span>
                )}
                {item.giftWrapped && (
                  <span className="text-[10px] text-[#2E7D32] ml-2 font-medium">
                    • Gift Wrapped
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-[#2C332D]">₹{Number(item.totalPrice).toFixed(2)}</p>
                <p className="text-[11px] text-[#8C7A72]">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href="/shop"
          className="w-full sm:w-auto px-6 py-3 bg-[#2C332D] text-white text-xs font-semibold rounded-full hover:bg-[#3D473E] text-center"
        >
          Continue Shopping
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-[#736C66] hover:text-[#2C332D]"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
