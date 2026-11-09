"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { UnpaidOrderModal } from "@/components/customer/UnpaidOrderModal";
import { DeliveredOrderModal } from "@/components/orders/DeliveredOrderModal";
import { ProfileCompletionModal } from "@/components/customer/ProfileCompletionModal";
import { PromotionalPopupModal } from "@/components/home/PromotionalPopupModal";
import { EarlyAccessLaunchPage } from "@/components/launch/EarlyAccessLaunchPage";
import { EyeOff } from "lucide-react";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [isPreviewUnlocked, setIsPreviewUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const unlocked = sessionStorage.getItem("devangi_preview_unlocked") === "true";
      const hasPreviewQuery = new URLSearchParams(window.location.search).get("preview") === "Deepa@04";
      if (unlocked || hasPreviewQuery) {
        setIsPreviewUnlocked(true);
      }
    }
  }, []);

  if (isAdmin) {
    return <>{children}</>;
  }

  // Pre-launch gate: Whenever any section is opened on the website, show the Early Access Launch Page
  if (!isPreviewUnlocked) {
    return <EarlyAccessLaunchPage onUnlockPreview={() => setIsPreviewUnlocked(true)} currentPath={pathname} />;
  }

  // When owner unlocks preview mode, show preview banner at top
  return (
    <>
      <div className="bg-[#3A1823] text-[#FAF4EE] px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-[100] border-b border-[#D4AF37]/30">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          <span className="font-semibold">Studio Owner Preview Mode Active</span>
          <span className="hidden sm:inline text-white/70">| Public visitors see the Early Access page</span>
        </div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem("devangi_preview_unlocked");
            setIsPreviewUnlocked(false);
          }}
          className="underline hover:text-[#D4AF37] transition-colors flex items-center space-x-1"
        >
          <EyeOff className="w-3.5 h-3.5 inline" />
          <span>Exit Preview</span>
        </button>
      </div>
      <Navbar />
      <main className="flex-1">{children}</main>
      <CartDrawer />
      <UnpaidOrderModal />
      <DeliveredOrderModal />
      <ProfileCompletionModal />
      <PromotionalPopupModal />
      <Footer />
    </>
  );
}
