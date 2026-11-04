"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { UnpaidOrderModal } from "@/components/customer/UnpaidOrderModal";
import { DeliveredOrderModal } from "@/components/orders/DeliveredOrderModal";
import { ProfileCompletionModal } from "@/components/customer/ProfileCompletionModal";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <CartDrawer />
      <UnpaidOrderModal />
      <DeliveredOrderModal />
      <ProfileCompletionModal />
      <Footer />
    </>
  );
}
