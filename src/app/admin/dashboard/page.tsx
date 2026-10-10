"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  PackageCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Boxes,
  Plus,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#736C66]">
        Loading studio analytics & database records...
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Verified Sales",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
      desc: "From verified paid orders",
      icon: DollarSign,
      color: "text-[#B8972E] bg-[#FAF4EC]",
    },
    {
      label: "Paid Orders",
      value: stats?.paidOrdersCount || 0,
      desc: `${stats?.totalOrders || 0} total lifetime orders`,
      icon: ShoppingBag,
      color: "text-[#2E7D32] bg-[#E8EFE8]",
    },
    {
      label: "Awaiting Fulfilment",
      value: stats?.awaitingFulfilment || 0,
      desc: "Confirmed / In crafting",
      icon: Clock,
      color: "text-[#D97706] bg-[#FEF3C7]",
    },
    {
      label: "Low / Out of Stock",
      value: (stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0),
      desc: `${stats?.outOfStockCount || 0} completely out of stock`,
      icon: AlertTriangle,
      color: "text-[#DF4C4C] bg-[#FDF2F2]",
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C332D]">
            Studio Operations Dashboard
          </h1>
          <p className="text-xs text-[#736C66] mt-0.5">
            Real-time sales, order fulfillment, and inventory indicators from Neon PostgreSQL.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-[#2C332D] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 hover:bg-[#3D473E] shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm flex items-start justify-between"
            >
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#736C66]">{card.label}</p>
                <p className="font-serif text-2xl font-bold text-[#2C332D]">{card.value}</p>
                <p className="text-[11px] text-[#A69E96]">{card.desc}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#F4EBE6] flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-[#2C332D]">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#B8972E] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#736C66] border-b border-[#E8E0D5]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EBE6] text-[#2C332D]">
                {(stats?.recentOrders || []).map((o: any) => (
                  <tr key={o.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold">
                      <Link href={`/admin/orders`} className="hover:text-[#B8972E]">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold">{o.customerName}</p>
                      <p className="text-[10px] text-[#736C66]">{o.customerEmail}</p>
                    </td>
                    <td className="py-3 px-4 font-bold">₹{o.totalAmount}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF4EC] text-[#B8972E]">
                        {o.orderStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          o.paymentStatus === "paid"
                            ? "bg-[#E8EFE8] text-[#2E7D32]"
                            : "bg-[#FDF2F2] text-[#DF4C4C]"
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-[#F4EBE6] flex items-center justify-between">
              <h2 className="font-serif text-base font-bold text-[#2C332D] flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-[#DF4C4C]" />
                <span>Low Stock Watchlist</span>
              </h2>
              <Link
                href="/admin/inventory"
                className="text-xs font-semibold text-[#B8972E] hover:underline"
              >
                Inventory
              </Link>
            </div>

            <div className="p-4 space-y-3">
              {(stats?.lowStockProducts || []).length === 0 ? (
                <p className="text-xs text-[#736C66] text-center py-6">
                  All active items are healthy and adequately stocked.
                </p>
              ) : (
                stats?.lowStockProducts?.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E0D5] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#2C332D] line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-[#736C66]">SKU: {p.sku}</p>
                    </div>
                    <span className="text-xs font-bold text-[#DF4C4C] bg-[#FDF2F2] px-2.5 py-1 rounded-lg">
                      {p.stockQuantity} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D5] text-center">
            <Link
              href="/admin/inventory"
              className="text-xs font-bold text-[#2C332D] hover:text-[#B8972E]"
            >
              Adjust & Audit Stock Movements →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
