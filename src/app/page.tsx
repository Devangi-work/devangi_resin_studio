import React from "react";
import Link from "next/link";
import { dbStore } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import { FestivalNewsHeader } from "@/components/home/FestivalNewsHeader";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  Gem,
  Clock,
  Star,
  Layers,
  ChevronRight,
  Sparkle,
  Gift,
  Award,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const settings = await dbStore.getSiteSettings();
  const categories = await dbStore.getCategories(true);
  const featuredRes = await dbStore.getProducts({
    isFeatured: true,
    status: "published",
    limit: 12,
  });
  const bestsellersRes = await dbStore.getProducts({
    isBestseller: true,
    status: "published",
    limit: 4,
  });
  const festivalRes = await dbStore.getProducts({
    isFestivalSpecial: true,
    status: "published",
    limit: 8,
  });
  const keepsakeProductsRes = await dbStore.getProducts({
    status: "published",
    limit: 4,
  });

  const featuredProducts = featuredRes.products;
  const bestsellers = bestsellersRes.products;
  const festivalProducts = festivalRes.products;
  const realKeepsakeProducts = keepsakeProductsRes.products;

  // Resolve dynamic admin-selected keepsake images or fall back to real store products
  const adminKeepsakeImages = Array.isArray(settings?.keepsakeStudioImages)
    ? settings.keepsakeStudioImages
    : [];

  const keepsakeSlots = [0, 1, 2, 3].map((slotIdx) => {
    const adminImg = adminKeepsakeImages[slotIdx];
    if (adminImg && typeof adminImg === "string" && adminImg.trim().length > 0) {
      return {
        imageUrl: adminImg,
        title: `Keepsake #${slotIdx + 1}`,
        link: "/custom-orders",
      };
    }
    const realProd = realKeepsakeProducts[slotIdx];
    return {
      imageUrl:
        realProd?.images?.[0]?.imageUrl ||
        "/images/home/Devangi_Resin_Studio_Handmade_Keepsakes.png",
      title: realProd?.name || "Bespoke Resin Art",
      link: realProd?.slug ? `/shop/${realProd.slug}` : "/custom-orders",
    };
  });

  return (
    <div className="flex flex-col pb-24 bg-[#FCFAF8]">
      {/* ---------------- FESTIVAL NEWS HEADER (Above Hero, Below Navbar) ---------------- */}
      <FestivalNewsHeader settings={settings} />

      {/* ---------------- 1. SINGLE HERO SECTION (Preserving Life's Moments in Glass-like Perfection) ---------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FDF2F4] via-[#FCFAF8] to-[#FCFAF8] pt-8 sm:pt-16 lg:pt-20 pb-12 sm:pb-20 lg:pb-24 px-3 sm:px-6 lg:px-8 border-b border-[#EFE3E7]">
        {/* Soft Ambient Glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FDE8EC]/70 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute -bottom-10 right-10 w-[400px] h-[400px] bg-[#FAF0F3]/80 rounded-full blur-2xl pointer-events-none -z-0" />

        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-x-3 sm:gap-x-8 lg:gap-x-12 gap-y-3.5 sm:gap-y-6 lg:gap-y-6 items-center relative z-10">
          {/* Hero Header: Badge + Headline (Full Width on Mobile, Left Column Row 1 on Desktop) */}
          <div className="col-span-12 lg:col-span-7 lg:col-start-1 lg:row-start-1 space-y-2 sm:space-y-4 text-left">
            <div className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-white/95 border border-[#EFE3E7] px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold text-[#3A1823] shadow-xs">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37] shrink-0" />
              <span>Bespoke Handmade Resin Artistry</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#3A1823] leading-[1.18] sm:leading-[1.15] tracking-tight">
              Preserving Life&apos;s Moments in{" "}
              <span className="italic font-normal text-[#B84A67]">Glass-like</span> Perfection.
            </h1>
          </div>

          {/* Hero Details: Description, CTAs, Highlights (Left Column Row 2 on Mobile & Desktop) */}
          <div className="col-span-7 col-start-1 row-start-2 lg:col-span-7 lg:col-start-1 lg:row-start-2 space-y-3 sm:space-y-6 text-left">
            <p className="text-[11px] sm:text-sm md:text-base lg:text-lg text-[#7A5E68] max-w-xl leading-snug sm:leading-relaxed font-light">
              From shimmering geode coasters and real botanical pendants to bespoke illuminated photo frames, each piece is hand-poured with non-yellowing archival resin in India.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 pt-0.5 sm:pt-2">
              <Link
                href="/shop"
                className="w-full sm:w-auto px-3 sm:px-8 py-2 sm:py-3.5 bg-[#3A1823] text-white rounded-full font-semibold text-[10px] sm:text-xs tracking-wider uppercase hover:bg-[#4E2230] active:scale-98 shadow-md transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 group text-center"
              >
                <span>Explore Boutique</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/custom-orders"
                className="w-full sm:w-auto px-3 sm:px-8 py-2 sm:py-3.5 bg-white border border-[#EFE3E7] text-[#3A1823] rounded-full font-semibold text-[10px] sm:text-xs tracking-wider uppercase hover:bg-[#FAF0F3] active:scale-98 shadow-sm transition-all text-center hover:border-[#D4AF37]"
              >
                Order Custom Piece
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-2 sm:pt-6 grid grid-cols-3 gap-1.5 sm:gap-4 border-t border-[#EFE3E7] text-left">
              <div>
                <p className="font-serif text-[11px] sm:text-xl lg:text-2xl font-bold text-[#3A1823]">100%</p>
                <p className="text-[7.5px] sm:text-[11px] text-[#7A5E68] uppercase tracking-wider font-medium">Hand-Poured</p>
              </div>
              <div>
                <p className="font-serif text-[11px] sm:text-xl lg:text-2xl font-bold text-[#3A1823]">UV-Stable</p>
                <p className="text-[7.5px] sm:text-[11px] text-[#7A5E68] uppercase tracking-wider font-medium">Non-Yellowing</p>
              </div>
              <div>
                <p className="font-serif text-[11px] sm:text-xl lg:text-2xl font-bold text-[#3A1823] flex items-center">
                  4.9 <Star className="w-2.5 h-2.5 sm:w-4 sm:h-4 fill-[#D4AF37] text-[#D4AF37] ml-0.5 sm:ml-1 inline" />
                </p>
                <p className="text-[7.5px] sm:text-[11px] text-[#7A5E68] uppercase tracking-wider font-medium">Artisan Rating</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Display (Right Column Row 2 on Mobile, Right Column Rows 1-2 on Desktop) */}
          <div className="col-span-5 col-start-8 row-start-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 relative flex items-center justify-center self-center">
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-lg w-full flex items-center justify-center">
              <img
                src="/images/home/devangi_artist_hero.png"
                alt="Devangi Resin Studio - Handmade Keepsakes & Resin Art"
                className="w-full h-auto max-h-[300px] sm:max-h-[440px] lg:max-h-[560px] object-contain drop-shadow-xl transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col space-y-20 sm:space-y-28 mt-12 sm:mt-16">
        {/* ---------------- 2. VALUE PROPOSITIONS ---------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#EFE3E7] shadow-xs flex flex-col items-center text-center space-y-2.5 hover:border-[#D4AF37] hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#B84A67] group-hover:bg-[#B84A67] group-hover:text-white transition-colors">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#3A1823]">
                100% Hand-Poured in India
              </h3>
              <p className="text-xs text-[#7A5E68] leading-relaxed">
                Every curve, gold-leaf vein, and crystal petal is cured and hand-finished by studio artisans.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#EFE3E7] shadow-xs flex flex-col items-center text-center space-y-2.5 hover:border-[#D4AF37] hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#B84A67] group-hover:bg-[#B84A67] group-hover:text-white transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#3A1823]">
                Archival Non-Yellowing
              </h3>
              <p className="text-xs text-[#7A5E68] leading-relaxed">
                Formulated with advanced HALS UV absorbers ensuring glass-like brilliance and heirloom clarity.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#EFE3E7] shadow-xs flex flex-col items-center text-center space-y-2.5 hover:border-[#D4AF37] hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#B84A67] group-hover:bg-[#B84A67] group-hover:text-white transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#3A1823]">
                Bespoke Keepsake Studio
              </h3>
              <p className="text-xs text-[#7A5E68] leading-relaxed">
                Custom initials, wedding flower garland preservation, names, and customer photographs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#EFE3E7] shadow-xs flex flex-col items-center text-center space-y-2.5 hover:border-[#D4AF37] hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#B84A67] group-hover:bg-[#B84A67] group-hover:text-white transition-colors">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#3A1823]">
                Insured Express Delivery
              </h3>
              <p className="text-xs text-[#7A5E68] leading-relaxed">
                Triple-cushioned drop-safe packaging across all Indian pincodes with live real-time tracking.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------- 3. SHOP BY ART FORM / CURATED COLLECTIONS ---------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 space-y-2 sm:space-y-0">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#B84A67] flex items-center space-x-1">
                <Sparkle className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Curated Collections</span>
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#3A1823] tracking-tight mt-1">
                Explore by Art Form
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] flex items-center space-x-1.5 transition-colors group"
            >
              <span>View All Collections</span>
              <ChevronRight className="w-4 h-4 text-[#B84A67] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#FAF8F5] border border-[#EFE3E7] shadow-sm block hover:border-[#D4AF37] hover:shadow-xl transition-all"
              >
                <img
                  src={cat.imageUrl || "/images/logo/resin_logo.png"}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-1">
                    Atelier Series
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-bold leading-tight group-hover:text-[#D4AF37] transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-[11px] text-white/80 line-clamp-1 mt-1 font-light">
                      {cat.description}
                    </p>
                  )}
                  <span className="mt-2 text-[11px] font-semibold text-white/90 group-hover:text-[#D4AF37] flex items-center space-x-1">
                    <span>Discover Pieces</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ---------------- FESTIVAL SPECIAL SHOWCASE (If Festival Products Exist) ---------------- */}
        {festivalProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-2.5 xs:px-4 sm:px-6 lg:px-8 w-full">
            <div className="p-3.5 xs:p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FFF9F6] via-[#FFFDF9] to-[#FFF5F8] border-2 border-[#D4AF37]/60 shadow-lg relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-8 space-y-2 sm:space-y-0 relative z-10">
                <div>
                  <span className="text-[10px] xs:text-xs uppercase font-extrabold tracking-widest text-[#A83250] flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Limited Period Celebrations</span>
                  </span>
                  <h2 className="font-serif text-xl xs:text-2xl sm:text-4xl font-bold text-[#3A1823] tracking-tight mt-1">
                    {settings.festivalName || "Festival Special Editions"}
                  </h2>
                  <p className="text-[11px] xs:text-xs sm:text-sm text-[#7A5E68] mt-1 max-w-xl">
                    Exclusive handcrafted geode pieces, personalized gift hampers, and illuminated art frames on special festival discount.
                  </p>
                </div>
                <Link
                  href="/shop?festival=true"
                  className="text-[11px] xs:text-xs font-bold uppercase tracking-wider text-[#6A162B] hover:text-[#D4AF37] flex items-center space-x-1.5 transition-colors group pt-1 sm:pt-0"
                >
                  <span>View All Festive Offers</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 xs:gap-3.5 sm:gap-6 relative z-10">
                {festivalProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- 4. FEATURED PRODUCTS ---------------- */}
        {featuredProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 space-y-2 sm:space-y-0">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#B84A67] flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Handpicked Favorites</span>
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#3A1823] tracking-tight mt-1">
                  Featured Creations
                </h2>
                <p className="text-xs sm:text-sm text-[#7A5E68] mt-1">
                  Signature handcrafted resin artwork, ready to ship or custom made to your order.
                </p>
              </div>
              <Link
                href="/shop"
                className="text-xs font-bold uppercase tracking-wider text-[#3A1823] hover:text-[#B84A67] flex items-center space-x-1.5 transition-colors group"
              >
                <span>Explore Boutique</span>
                <ChevronRight className="w-4 h-4 text-[#B84A67] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ---------------- 5. CUSTOM GIFT STUDIO SHOWCASE (Real Products / Admin Configured) ---------------- */}
        <section className="bg-gradient-to-r from-[#FAF0F3] via-[#FCFAF8] to-[#FAF0F3] py-16 sm:py-24 border-y border-[#EFE3E7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

              {/* Left Column: Bespoke Atelier Copy */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center space-x-2 bg-white border border-[#EFE3E7] px-3.5 py-1 rounded-full text-xs font-semibold text-[#B84A67]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Personalised Keepsake Studio</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3A1823] leading-tight tracking-tight">
                  Turn Precious Memories into{" "}
                  <span className="italic font-normal text-[#B84A67]">Everlasting</span> Art.
                </h2>

                <p className="text-sm sm:text-base text-[#7A5E68] leading-relaxed font-light">
                  Whether you wish to preserve fresh wedding roses into a scalloped ring dish, illuminate family portraits with warm embedded fairy lights, or custom-emboss a wooden house nameplate, our artisans bring your exact vision to life.
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start space-x-3.5 text-xs sm:text-sm text-[#3A1823]">
                    <div className="w-6 h-6 rounded-full bg-[#3A1823] text-white flex items-center justify-center flex-shrink-0 text-[11px] font-bold">
                      1
                    </div>
                    <span>
                      Choose your preferred colours, decorative elements, and personalised designs to make your resin piece unique.
                    </span>
                  </div>

                  <div className="flex items-start space-x-3.5 text-xs sm:text-sm text-[#3A1823]">
                    <div className="w-6 h-6 rounded-full bg-[#3A1823] text-white flex items-center justify-center flex-shrink-0 text-[11px] font-bold">
                      2
                    </div>
                    <span>
                      Each piece is carefully handcrafted by our artists, with attention to every detail and a smooth, beautiful finish.
                    </span>
                  </div>

                  <div className="flex items-start space-x-3.5 text-xs sm:text-sm text-[#3A1823]">
                    <div className="w-6 h-6 rounded-full bg-[#3A1823] text-white flex items-center justify-center flex-shrink-0 text-[11px] font-bold">
                      3
                    </div>
                    <span>
                      Your finished creation is carefully packed in our premium Display &amp; Window Boxes, ready to be gifted or cherished.
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <Link
                    href="/custom-orders"
                    className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#3A1823] text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#4E2230] shadow-md hover:shadow-lg transition-all active:scale-98"
                  >
                    <span>Start Bespoke Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Real Store / Admin Showcase Images Mosaic */}
              <div className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-4 sm:space-y-5">
                  {/* Slot 0: Main Square */}
                  <Link
                    href={keepsakeSlots[0].link}
                    className="rounded-2xl overflow-hidden shadow-md aspect-square bg-white border border-[#EFE3E7] hover:border-[#D4AF37] hover:shadow-xl transition-all group relative block"
                  >
                    <img
                      src={keepsakeSlots[0].imageUrl}
                      alt={keepsakeSlots[0].title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {keepsakeSlots[0].title}
                    </div>
                  </Link>

                  {/* Slot 1: Secondary */}
                  <Link
                    href={keepsakeSlots[1].link}
                    className="rounded-2xl overflow-hidden shadow-md aspect-[4/3] bg-white border border-[#EFE3E7] hover:border-[#D4AF37] hover:shadow-xl transition-all group relative block"
                  >
                    <img
                      src={keepsakeSlots[1].imageUrl}
                      alt={keepsakeSlots[1].title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {keepsakeSlots[1].title}
                    </div>
                  </Link>
                </div>

                <div className="space-y-4 sm:space-y-5 pt-6 sm:pt-8">
                  {/* Slot 2: Upper Right */}
                  <Link
                    href={keepsakeSlots[2].link}
                    className="rounded-2xl overflow-hidden shadow-md aspect-[4/3] bg-white border border-[#EFE3E7] hover:border-[#D4AF37] hover:shadow-xl transition-all group relative block"
                  >
                    <img
                      src={keepsakeSlots[2].imageUrl}
                      alt={keepsakeSlots[2].title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {keepsakeSlots[2].title}
                    </div>
                  </Link>

                  {/* Slot 3: Lower Right Square */}
                  <Link
                    href={keepsakeSlots[3].link}
                    className="rounded-2xl overflow-hidden shadow-md aspect-square bg-white border border-[#EFE3E7] hover:border-[#D4AF37] hover:shadow-xl transition-all group relative block"
                  >
                    <img
                      src={keepsakeSlots[3].imageUrl}
                      alt={keepsakeSlots[3].title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {keepsakeSlots[3].title}
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- 6. BESTSELLERS ---------------- */}
        {bestsellers.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#B84A67] flex items-center justify-center space-x-1">
                <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                <span>Customer Loved</span>
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#3A1823] tracking-tight">
                Studio Bestsellers
              </h2>
              <p className="text-xs sm:text-sm text-[#7A5E68]">
                Our most cherished creations, consistently praised for their durability, bubble-free glass clarity, and radiant shine.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ---------------- 7. BRAND STORY & PHILOSOPHY ---------------- */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="bg-white p-8 sm:p-14 rounded-3xl border border-[#EFE3E7] shadow-sm text-center space-y-6 relative overflow-hidden">
            <div className="w-14 h-14 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#B84A67] mx-auto shadow-xs">
              <Gem className="w-7 h-7" />
            </div>

            <span className="text-xs uppercase font-bold tracking-widest text-[#B84A67] block">
              The Studio Philosophy
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3A1823] max-w-2xl mx-auto leading-snug">
              &quot;We don&apos;t just pour resin — we encapsulate life&apos;s ephemeral beauty into forever keepsakes.&quot;
            </h2>

            <p className="text-sm sm:text-base text-[#7A5E68] max-w-2xl mx-auto leading-relaxed font-light">
              Founded with a deep passion for botanical preservation, raw crystal geodes, and bespoke luxury gifting, Devangi Resin Studio creates heirloom pieces that celebrate milestones, memories, and modern elegance.
            </p>

            <div className="pt-2 flex items-center justify-center space-x-6 text-xs text-[#7A5E68]">
              <span className="flex items-center space-x-1.5">
                <Sparkle className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Handmade in India</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>Insured Delivery</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1.5">
                <Gift className="w-3.5 h-3.5 text-[#B84A67]" />
                <span>Premium Display &amp; Window Boxes</span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
