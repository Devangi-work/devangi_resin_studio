import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/store/cart";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";

export const metadata: Metadata = {
  title: "Aura Resin Art Studio | Luxury Handmade Resin Homeware & Gifts",
  description:
    "Discover handcrafted resin art, personalized geode coasters, real flower jewellery, entrance nameplates, and bespoke keepsakes. Hand-poured with love in India.",
  keywords: [
    "resin art",
    "resin coasters",
    "resin keychains",
    "resin jewellery",
    "resin bookmarks",
    "resin nameplates",
    "personalized gifts",
    "handmade gifts india",
  ],
  openGraph: {
    title: "Aura Resin Art Studio",
    description: "Handcrafted resin homeware, botanical jewellery, and bespoke personalised gifts.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#222523] selection:bg-[#D4AF37]/30">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <CartDrawer />
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
