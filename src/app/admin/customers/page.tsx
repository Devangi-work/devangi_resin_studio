"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Mail, Phone, ShoppingBag, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadCustomers = () => {
    setLoading(true);
    fetch("/api/admin/customers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomers(data);
        } else {
          setCustomers([]);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredList = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.state && c.state.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Customer Directory
          </h1>
          <p className="text-xs text-[#736C66]">
            All registered users (Email & Google sign-in), verified contact profiles, and verified paid spending.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-[#E8E0D5] text-xs font-semibold text-[#2C332D] shadow-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-[#B8972E]" />
          <span>Total Registered: <strong>{customers.length}</strong></span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#8C7A72] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
        <button
          onClick={loadCustomers}
          className="text-xs font-semibold text-[#736C66] hover:text-[#2C332D] px-3 py-2 rounded-xl hover:bg-[#FAF8F5] transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#736C66] border-b border-[#E8E0D5]">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Auth Type</th>
                <th className="py-3 px-4 font-semibold">Contact & Phone</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Total Orders</th>
                <th className="py-3 px-4 font-semibold">Paid Spent</th>
                <th className="py-3 px-4 font-semibold">Registered / Last Purchase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EBE6] text-[#2C332D]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#736C66]">
                    Loading customer profiles...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#736C66]">
                    No customer records found matching search.
                  </td>
                </tr>
              ) : (
                filteredList.map((c) => {
                  const hasLocation = c.city || c.state;
                  const dateToDisplay = c.lastOrderDate || c.createdAt;
                  return (
                    <tr key={c.id || c.email} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {c.avatarUrl ? (
                            <img
                              src={c.avatarUrl}
                              alt={c.name}
                              className="w-8 h-8 rounded-full border border-[#E8E0D5] object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#F4EBE6] text-[#2C332D] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-[#E8E0D5]">
                              {c.name ? c.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-[#2C332D] truncate">{c.name || "Customer"}</p>
                            <p className="text-[10px] text-[#736C66] truncate">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {c.googleId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Google
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-[#736C66] border border-stone-200">
                            Email
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#736C66]">
                        {c.phone ? (
                          <span className="font-mono">{c.phone}</span>
                        ) : (
                          <span className="text-gray-400 italic">No phone set</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#736C66]">
                        {hasLocation ? (
                          <span>
                            {c.city ? c.city : ""}
                            {c.city && c.state ? ", " : ""}
                            {c.state ? c.state : ""}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E0D5]">
                          {c.totalOrders || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#B8972E]">
                        ₹{Number(c.totalSpent || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-[#736C66]">
                        {dateToDisplay ? (
                          <div>
                            <p>
                              {new Date(dateToDisplay).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            {c.lastOrderDate && (
                              <p className="text-[9.5px] text-[#8C7A72]">
                                (Last order)
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
