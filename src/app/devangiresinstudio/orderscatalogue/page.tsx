import React from "react";
import { Metadata } from "next";
import { dbStore } from "@/lib/db";
import { OrdersCatalogueView } from "@/components/catalogue/OrdersCatalogueView";
import { Sparkles, Heart, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orders Showcase & Custom Creations Catalogue | Devangi Resin Studio",
  description:
    "Browse real client orders, preserved flower keepsakes, customized geode clocks, and bespoke resin art handcrafted by artisan Devangi. Tap to order the same piece directly via WhatsApp.",
};

export default async function OrdersCataloguePage() {
  const settings = await dbStore.getSiteSettings();
  const rawOrders = await dbStore.getOrders();

  // Load detailed items for orders
  const validOrders = rawOrders.filter(
    (o) => !o.isDiscarded && o.orderStatus !== "cancelled"
  );

  const pieces: any[] = [];

  // 1. Process real database orders & order items
  for (const ord of validOrders) {
    const fullOrder = await dbStore.getOrderById(ord.id);
    const orderItems = fullOrder?.items || [];
    const productImages = (fullOrder as any)?.productImages || [];

    if (orderItems.length > 0) {
      for (const item of orderItems) {
        // Tag deduction
        let tag = "Custom Keepsake";
        const lower = item.productName.toLowerCase();
        if (lower.includes("clock")) tag = "Clocks";
        else if (lower.includes("flower") || lower.includes("frame") || lower.includes("varmala")) tag = "Frames & Flowers";
        else if (lower.includes("coaster") || lower.includes("tray")) tag = "Coasters & Trays";
        else if (lower.includes("nameplate") || lower.includes("name")) tag = "Nameplates";
        else if (lower.includes("keychain") || lower.includes("bookmark") || lower.includes("jewellery")) tag = "Jewellery & Accessories";

        pieces.push({
          id: `item_${item.id || ord.id}`,
          orderNumber: ord.orderNumber,
          orderDate: ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString(),
          productName: item.productName,
          variantName: item.variantName || null,
          customName: item.personalizationDetails?.customName || null,
          personalizationDetails: item.personalizationDetails,
          imageUrl:
            item.productImage ||
            item.referenceImageUrl ||
            (productImages.length > 0 ? productImages[0] : null) ||
            "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
          categoryTag: tag,
          orderSource: ord.orderSource,
          isDelivered: ord.orderStatus === "delivered",
        });
      }
    } else if (productImages.length > 0) {
      // Manual order that has photos
      pieces.push({
        id: `order_${ord.id}`,
        orderNumber: ord.orderNumber,
        orderDate: ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString(),
        productName: ord.orderNotes || "Handcrafted Bespoke Resin Creation",
        variantName: "Custom Studio Commission",
        customName: null,
        imageUrl: productImages[0],
        categoryTag: "Custom Commissions",
        orderSource: ord.orderSource,
        isDelivered: ord.orderStatus === "delivered",
      });
    }
  }

  // Only display real client orders from the database
  const finalPieces = pieces;

  const whatsappNumber =
    settings?.whatsappNumber || settings?.contactPhone || "+919967313355";
  const storeName = settings?.storeName || "Devangi Resin Studio";

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24">
      {/* Hero Header */}
      <div className="bg-[#3A1823] text-[#FAF4EE] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-radial from-[#D4AF37]/20 to-transparent pointer-events-none rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-radial from-[#B84A67]/25 to-transparent pointer-events-none rounded-full blur-2xl" />

        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Orders Showcase &amp; Custom Gallery</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Real Handcrafted Creations, <br className="hidden sm:block" />
            Delivered With Love
          </h1>

          <p className="text-xs sm:text-sm text-[#FAF4EE]/80 max-w-2xl mx-auto leading-relaxed">
            Every piece we craft is a unique story in crystal-clear resin. Browse our delivered
            commissions below and tap <strong>&ldquo;Want Same Piece?&rdquo;</strong> to chat directly
            with artisan Devangi on WhatsApp to customize yours.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-[#FAF4EE]/90">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              100% Handcrafted &amp; UV Protected
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              Custom Names, Dried Flowers &amp; Gold Leaf
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-[#D4AF37]" />
              Insured Pan-India Safe Delivery
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <OrdersCatalogueView
          pieces={finalPieces}
          whatsappNumber={whatsappNumber}
          storeName={storeName}
        />
      </main>
    </div>
  );
}

