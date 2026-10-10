"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Mail, Phone, ShoppingBag } from "lucide-react";

export default function AdminCustomersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // Aggregate customer records from order database
  const customerMap = new Map<string, any>();

  orders.forEach((o) => {
    const key = o.customerEmail.toLowerCase().trim();
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        email: o.customerEmail,
        name: o.customerName,
        phone: o.customerPhone,
        city: o.shippingCity,
        state: o.shippingState,
        totalOrders: 1,
        totalSpent: Number(o.totalAmount),
        lastOrderDate: new Date(o.createdAt),
      });
    } else {
      const c = customerMap.get(key);
      c.totalOrders += 1;
      c.totalSpent += Number(o.totalAmount);
      if (new Date(o.createdAt) > c.lastOrderDate) {
        c.lastOrderDate = new Date(o.createdAt);
      }
    }
  });

  const customerList = Array.from(customerMap.values()).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
          Customer Directory
        </h1>
        <p className="text-xs text-[#736C66]">
          Customer purchase histories, contact details, and lifetime spending.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-sm flex items-center">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#8C7A72] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#736C66] border-b border-[#E8E0D5]">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Orders</th>
                <th className="py-3 px-4 font-semibold">Total Spent</th>
                <th className="py-3 px-4 font-semibold">Last Purchase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EBE6] text-[#2C332D]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#736C66]">
                    Loading customer profiles...
                  </td>
                </tr>
              ) : customerList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#736C66]">
                    No customer records found.
                  </td>
                </tr>
              ) : (
                customerList.map((c) => (
                  <tr key={c.email} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#2C332D]">{c.name}</p>
                      <p className="text-[10px] text-[#736C66]">{c.email}</p>
                    </td>
                    <td className="py-3 px-4 text-[#736C66]">{c.phone}</td>
                    <td className="py-3 px-4 text-[#736C66]">
                      {c.city}, {c.state}
                    </td>
                    <td className="py-3 px-4 font-bold">{c.totalOrders}</td>
                    <td className="py-3 px-4 font-bold text-[#B8972E]">
                      ₹{c.totalSpent.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-[#736C66]">
                      {c.lastOrderDate.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
