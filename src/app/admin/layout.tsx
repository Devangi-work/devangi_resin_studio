"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Sun,
  Moon,
  Camera,
  Loader2,
  Check,
  Trash2,
  Upload,
} from "lucide-react";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { getStoredAdminTheme, applyAdminTheme, AdminTheme } from "@/lib/admin-theme";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Theme state: "light" | "dark"
  const [theme, setTheme] = useState<AdminTheme>("light");

  // Profile modal and avatar upload state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If on login or setup page, render plain container
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/setup";

  // Sync theme with shared utility and listen to changes from settings or other tabs
  useEffect(() => {
    if (isAuthPage) return;
    const initial = getStoredAdminTheme();
    setTheme(initial);
    applyAdminTheme(initial);

    const onThemeChange = (e: any) => {
      const next = (e.detail || getStoredAdminTheme()) as AdminTheme;
      setTheme(next);
    };

    window.addEventListener("admin_theme_change", onThemeChange);
    window.addEventListener("storage", onThemeChange);

    return () => {
      window.removeEventListener("admin_theme_change", onThemeChange);
      window.removeEventListener("storage", onThemeChange);
    };
  }, [isAuthPage]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    applyAdminTheme(next);
  };

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

  const handleDirectAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileMsg("");
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/admin/profile", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (res.ok && json.avatarUrl) {
        setAdminUser((prev: any) => ({ ...prev, avatarUrl: json.avatarUrl }));
        setProfileMsg("Profile image updated successfully!");
      } else {
        alert(json.error || "Failed to upload avatar.");
      }
    } catch (err) {
      alert("Avatar upload error.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelectFromLibrary = async (selected: { url: string }[]) => {
    if (!selected || selected.length === 0) return;
    const url = selected[0].url;

    setUploadingAvatar(true);
    setProfileMsg("");
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      const json = await res.json();
      if (res.ok) {
        setAdminUser((prev: any) => ({ ...prev, avatarUrl: url }));
        setProfileMsg("Profile image updated from Media Library!");
      } else {
        alert(json.error || "Failed to update avatar.");
      }
    } catch {
      alert("Failed to update avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;

    setUploadingAvatar(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: " " }),
      });
      if (res.ok) {
        setAdminUser((prev: any) => ({ ...prev, avatarUrl: null }));
        setProfileMsg("Profile photo removed.");
      }
    } catch {
      alert("Failed to remove avatar.");
    } finally {
      setUploadingAvatar(false);
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
    <div className={`min-h-screen ${theme === "dark" ? "bg-[#0E120F] text-[#EDE8E1]" : "bg-[#F7F5F0] text-[#2C332D]"} flex flex-col lg:flex-row transition-colors duration-200 ${theme === "dark" ? "admin-dark" : ""}`}>
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden admin-mobile-header bg-[#1F2421] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-[#333A35]">
        <div className="flex items-center space-x-2.5">
          <img
            src="/images/logo/resin_logo.png"
            alt="Devangi Resin Studio Logo"
            className="w-8 h-8 object-contain drop-shadow"
          />
          <span className="font-serif font-bold text-base sm:text-lg text-[#D4AF37]">Devangi Resin Studio</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#D4AF37] hover:bg-white/10 transition-colors"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-300" />}
          </button>

          {/* Mobile Avatar Click */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-8 h-8 rounded-full overflow-hidden border border-[#D4AF37] relative flex items-center justify-center bg-[#2C332D] text-[#D4AF37] font-bold text-xs"
          >
            {adminUser?.avatarUrl ? (
              <img src={adminUser.avatarUrl} alt="Admin" className="w-full h-full object-cover" />
            ) : (
              <span>{adminUser?.fullName?.[0] || "A"}</span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg text-white hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-[#1F2421] text-white flex-shrink-0 flex flex-col justify-between border-r border-[#333A35] fixed lg:sticky top-0 h-screen z-30 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="overflow-y-auto">
          {/* Logo & Store Link */}
          <div className="p-5 border-b border-[#333A35]">
            <a href="/" target="_blank" className="flex items-center space-x-3 group">
              <img
                src="/images/logo/resin_logo.png"
                alt="Devangi Resin Studio Logo"
                className="w-11 h-11 object-contain drop-shadow flex-shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0">
                <span className="font-serif text-sm font-bold tracking-wider text-white group-hover:text-[#D4AF37] transition-colors block leading-tight">
                  DEVANGI RESIN STUDIO
                </span>
                <span className="flex items-center text-[10px] text-[#A69E96] mt-0.5 space-x-1">
                  <span>View Live Store</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
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

        {/* Footer Area: Theme Toggle + User Profile + Logout */}
        <div className="p-4 border-t border-[#333A35] space-y-3 bg-[#191D1A]/60 backdrop-blur-sm">
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#252C27] hover:bg-[#2D3630] border border-[#3A453E] text-xs transition-colors"
          >
            <div className="flex items-center space-x-2">
              {theme === "light" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#D4AF37]" />
              )}
              <span className="text-[#C4BCB3]">Theme:</span>
              <span className="font-bold text-white capitalize">{theme} Mode</span>
            </div>
            <span className="text-[10px] font-semibold text-[#D4AF37] px-1.5 py-0.5 rounded bg-[#1F2421] border border-[#3A453E]">
              Switch
            </span>
          </button>

          {/* User Card with clickable Profile Image */}
          <div
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center space-x-3 px-2 py-1.5 rounded-xl hover:bg-[#2C332D] cursor-pointer transition-colors group"
            title="Click to manage admin profile & avatar"
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#2C332D] text-[#D4AF37] flex items-center justify-center font-bold text-sm border-2 border-[#D4AF37] overflow-hidden shadow-sm">
                {adminUser?.avatarUrl ? (
                  <img
                    src={adminUser.avatarUrl}
                    alt={adminUser.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{adminUser?.fullName?.[0] || "A"}</span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#D4AF37] text-[#1F2421] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="flex-1 overflow-hidden min-w-0">
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-bold text-white truncate">
                  {adminUser?.fullName || "Administrator"}
                </p>
              </div>
              <p className="text-[10.5px] text-[#A69E96] truncate">
                {adminUser?.email || "admin"}
              </p>
              <p className="text-[9.5px] text-[#D4AF37] flex items-center space-x-1 mt-0.5">
                <span>Change Photo</span>
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
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 admin-main-wrapper">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>

      {/* Admin Profile & Avatar Management Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8E0D5] shadow-2xl space-y-6 admin-modal-box">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D5]">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="font-serif text-lg font-bold text-[#2C332D]">
                  Admin Profile
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setProfileMsg("");
                }}
                className="p-1.5 rounded-lg text-[#736C66] hover:text-[#2C332D] hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileMsg && (
              <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32] flex items-center justify-between">
                <span>{profileMsg}</span>
                <button onClick={() => setProfileMsg("")} className="underline text-[11px]">
                  Dismiss
                </button>
              </div>
            )}

            {/* Profile Avatar Centerpiece */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-[#D4AF37] overflow-hidden bg-[#FAF8F5] shadow-md flex items-center justify-center">
                  {adminUser?.avatarUrl ? (
                    <img
                      src={adminUser.avatarUrl}
                      alt={adminUser.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-serif text-3xl font-bold text-[#2C332D]">
                      {adminUser?.fullName?.[0] || "A"}
                    </span>
                  )}
                </div>

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-[#2C332D]">
                  {adminUser?.fullName || "Administrator"}
                </h3>
                <p className="text-xs text-[#736C66] font-mono">{adminUser?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-[#B8972E] bg-[#FAF4EC] px-2.5 py-0.5 rounded-full border border-[#E8E0D5]">
                  Role: {adminUser?.role || "Owner"}
                </span>
              </div>
            </div>

            {/* Avatar Actions */}
            <div className="space-y-2 pt-2 border-t border-[#E8E0D5]">
              <p className="text-xs font-semibold text-[#2C332D]">Profile Photo Options</p>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Upload from device */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-white border border-[#E8E0D5] hover:border-[#D4AF37] text-[#2C332D] text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-[#B8972E]" />
                  <span>Upload File</span>
                </button>

                {/* Pick from Media Library */}
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  disabled={uploadingAvatar}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-[#FAF4EC] border border-[#D4AF37] hover:bg-[#F3EAD9] text-[#7A6117] text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#B8972E]" />
                  <span>Media Library</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDirectAvatarUpload}
                className="hidden"
              />

              {adminUser?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="w-full py-2 text-xs text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center space-x-1.5 border border-red-200 mt-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Current Photo</span>
                </button>
              )}
            </div>

            {/* Quick Theme Toggle Inside Modal */}
            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E0D5] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {theme === "light" ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-[#D4AF37]" />
                )}
                <div>
                  <p className="text-xs font-semibold text-[#2C332D]">Interface Theme</p>
                  <p className="text-[10px] text-[#736C66]">Currently in {theme} mode</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 bg-white border border-[#E8E0D5] rounded-xl text-xs font-semibold text-[#2C332D] hover:bg-[#FAF8F5]"
              >
                Switch to {theme === "light" ? "Dark" : "Light"}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setProfileMsg("");
                }}
                className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E] shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal for Admin Avatar */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        multiple={false}
        title="Choose Admin Profile Image"
        onSelect={handleSelectFromLibrary}
      />
    </div>
  );
}
