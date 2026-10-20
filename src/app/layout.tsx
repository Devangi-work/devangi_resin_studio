import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/store/cart";
import { StorefrontShell } from "@/components/layout/StorefrontShell";

export const metadata: Metadata = {
  title: "Devangi Resin Studio | Handcrafted Resin Creations by Devangi",
  description:
    "Discover handcrafted resin art, personalized geode coasters, real flower jewellery, entrance nameplates, and bespoke keepsakes by Devangi. Hand-poured with love in India.",
  keywords: [
    "resin art",
    "resin coasters",
    "resin keychains",
    "resin jewellery",
    "resin phone charms",
    "resin nameplates",
    "personalized gifts",
    "handmade gifts india",
    "devangi resin studio",
  ],
  icons: {
    icon: "/images/logo/resin_logo.png",
    apple: "/images/logo/resin_logo.png",
  },
  openGraph: {
    title: "Devangi Resin Studio",
    description: "Handcrafted resin homeware, botanical jewellery, and bespoke personalised gifts by Devangi.",
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
          <StorefrontShell>{children}</StorefrontShell>
        </CartProvider>
      </body>
    </html>
  );
}
