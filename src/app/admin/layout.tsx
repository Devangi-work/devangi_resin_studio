"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Boxes,
  Tag,
  Users,
  Image as ImageIcon,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // If on login or setup page, render plain container
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/setup";

  useEffect(() => {
    if (!isAuthPage) {
      fetch("/api/auth/me")
        .then((res) => {
          if (!res.ok) {
            router.push("/admin/login");
          }
          return res.json();
        })
        .then((data) => {
          if (data?.user) {
            setAdminUser(data.user);
          }
        })
        .catch(() => {
          router.push("/admin/login");
        });
    }
  }, [pathname, isAuthPage, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (e) {
      console.error(e);
    }
  };

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {children}
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Inventory", href: "/admin/inventory", icon: Boxes },
    { name: "Coupons", href: "/admin/coupons", icon: Tag },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Media Library", href: "/admin/media", icon: ImageIcon },
    { name: "Store Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col lg:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-[#1F2421] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <span className="font-serif font-bold text-lg text-[#D4AF37]">Aura Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg text-white hover:bg-white/10"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-[#1F2421] text-white flex-shrink-0 flex flex-col justify-between border-r border-[#333A35] fixed lg:sticky top-0 h-screen z-30 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo & Store Link */}
          <div className="p-6 border-b border-[#333A35]">
            <a href="/" target="_blank" className="block group">
              <span className="font-serif text-xl font-bold tracking-wider text-white group-hover:text-[#D4AF37] transition-colors">
                AURA RESIN
              </span>
              <span className="flex items-center text-[10px] text-[#A69E96] mt-0.5 space-x-1">
                <span>View Live Store</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#D4AF37] text-[#1F2421] font-bold shadow-sm"
                      : "text-[#A69E96] hover:text-white hover:bg-[#2C332D]"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-[#333A35] space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#2C332D] text-[#D4AF37] flex items-center justify-center font-bold text-xs border border-[#444E46]">
              {adminUser?.fullName?.[0] || "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {adminUser?.fullName || "Administrator"}
              </p>
              <p className="text-[10px] text-[#A69E96] truncate">
                {adminUser?.email || "admin"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 text-xs text-[#DF4C4C] hover:bg-[#DF4C4C]/10 rounded-xl transition-colors flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
