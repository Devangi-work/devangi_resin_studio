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

  const featuredProducts = featuredRes.products;
  const bestsellers = bestsellersRes.products;
  const festivalProducts = festivalRes.products;

  return (
    <div className="flex flex-col pb-20">
      {/* ---------------- FESTIVAL NEWS HEADER (Above Hero, Below Navbar) ---------------- */}
      <FestivalNewsHeader settings={settings} />

      <div className="flex flex-col space-y-20 sm:space-y-24">
        {/* ---------------- 1. HERO SECTION (Themed from resin_logo.png) ---------------- */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#FDF2F4] via-[#FCFAF8] to-[#FCFAF8] pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#EFE3E7]">
        {/* Soft Decorative Ambient Petal & Rose Circles */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FDE8EC]/70 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute -bottom-10 right-10 w-[400px] h-[400px] bg-[#FAF0F3]/80 rounded-full blur-2xl pointer-events-none -z-0" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 bg-white/95 border border-[#EFE3E7] px-4 py-1.5 rounded-full text-xs font-semibold text-[#3A1823] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Bespoke Handmade Resin Artistry</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#3A1823] leading-[1.15] tracking-tight">
              Preserving Life's Moments in{" "}
              <span className="italic font-normal text-[#B84A67]">Glass-like</span> Perfection.
            </h1>

            <p className="text-base sm:text-lg text-[#7A5E68] max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
              From shimmering geode coasters and real botanical pendants to bespoke illuminated photo frames, each piece is hand-poured with non-yellowing archival resin in India.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
              <Link
                href="/shop"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#3A1823] text-white rounded-full font-semibold text-xs tracking-wider uppercase hover:bg-[#4E2230] active:scale-98 shadow-md transition-all flex items-center justify-center space-x-2 group"
              >
                <span>Explore Boutique</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/custom-orders"
                className="w-full sm:w-auto px-8 py-3.5 bg-white border border-[#EFE3E7] text-[#3A1823] rounded-full font-semibold text-xs tracking-wider uppercase hover:bg-[#FAF0F3] active:scale-98 shadow-sm transition-all text-center"
              >
                Order Custom Piece
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#EFE3E7] text-center lg:text-left">
              <div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-[#3A1823]">100%</p>
                <p className="text-[11px] text-[#7A5E68] uppercase tracking-wider">Hand-Poured</p>
              </div>
              <div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-[#3A1823]">UV-Stable</p>
                <p className="text-[11px] text-[#7A5E68] uppercase tracking-wider">Non-Yellowing</p>
              </div>
              <div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-[#3A1823] flex items-center justify-center lg:justify-start">
                  4.9 <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37] ml-1 inline" />
                </p>
                <p className="text-[11px] text-[#7A5E68] uppercase tracking-wider">Artisan Rating</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Collage */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-square bg-white">
                <img
                  src="/images/home/Devangi_Resin_Studio_Handmade_Keepsakes.png"
                  alt="Devangi Resin Studio - Handmade Keepsakes & Resin Art"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 2. VALUE PROPOSITIONS ---------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#EFE3E7] shadow-sm flex flex-col items-center text-center space-y-2 hover:border-[#D4AF37] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#B84A67]">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-sm font-bold text-[#3A1823]">Handcrafted In India</h3>
            <p className="text-xs text-[#7A5E68] leading-relaxed">
              Every curve, bubble-free layer, and floral inlay is poured individually by our studio artists.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#EFE3E7] shadow-sm flex flex-col items-center text-center space-y-2 hover:border-[#D4AF37] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#B84A67]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-sm font-bold text-[#3A1823]">Archival UV Formula</h3>
            <p className="text-xs text-[#7A5E68] leading-relaxed">
              High-clarity epoxy resins infused with HALS UV inhibitors to resist yellowing over time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#EFE3E7] shadow-sm flex flex-col items-center text-center space-y-2 hover:border-[#D4AF37] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#B84A67]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-sm font-bold text-[#3A1823]">Personalised For You</h3>
            <p className="text-xs text-[#7A5E68] leading-relaxed">
              Custom initials, names, wedding garland petals, and customer photo encasements.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#EFE3E7] shadow-sm flex flex-col items-center text-center space-y-2 hover:border-[#D4AF37] transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#B84A67]">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-sm font-bold text-[#3A1823]">Insured Safe Transit</h3>
            <p className="text-xs text-[#7A5E68] leading-relaxed">
              Triple-layer impact-resistant packaging ensures your delicate art arrives in mint condition.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- 3. SHOP BY CATEGORY ---------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 space-y-2 sm:space-y-0">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#B84A67]">
              Curated Collections
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A1823]">
              Explore by Art Form
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold text-[#3A1823] hover:text-[#B84A67] flex items-center space-x-1 transition-colors"
          >
            <span>View All Collections</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#FCFAF8] border border-[#EFE3E7] shadow-sm block hover:border-[#D4AF37] transition-all"
            >
              <img
                src={cat.imageUrl || "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800"}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-4 text-white">
                <h3 className="font-serif text-base font-bold leading-tight group-hover:text-[#D4AF37] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- FESTIVAL SPECIAL SHOWCASE ---------------- */}
      {festivalProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-[#FFF9F6] via-[#FFFDF9] to-[#FFF5F8] border-2 border-[#D4AF37]/50 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 space-y-2 sm:space-y-0">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#A83250] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Limited Period Celebrations</span>
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A1823]">
                  {settings.festivalName || "Festival Special Editions"}
                </h2>
              </div>
              <Link
                href="/shop?filter=festival"
                className="text-xs font-bold text-[#6A162B] hover:text-[#D4AF37] flex items-center space-x-1 transition-colors"
              >
                <span>View All Festive Offers</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {festivalProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- 4. FEATURED PRODUCTS ---------------- */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 space-y-2 sm:space-y-0">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#B84A67]">
                Handpicked Favorites
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A1823]">
                Featured Creations
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-semibold text-[#3A1823] hover:text-[#B84A67] flex items-center space-x-1 transition-colors"
            >
              <span>Explore Boutique</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------- 5. CUSTOM GIFT STUDIO SHOWCASE ---------------- */}
      <section className="bg-gradient-to-r from-[#FAF0F3] via-[#FCFAF8] to-[#FAF0F3] py-16 sm:py-20 border-y border-[#EFE3E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs uppercase font-bold tracking-widest text-[#B84A67]">
                Personalised Keepsake Studio
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3A1823] leading-tight">
                Turn Precious Memories into Everlasting Art.
              </h2>
              <p className="text-sm text-[#7A5E68] leading-relaxed">
                Whether you wish to preserve fresh wedding roses into a scalloped ring dish, illuminate family portraits with warm fairy lights, or custom-emboss a wooden house nameplate, our artisans bring your exact vision to life.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3 text-xs text-[#3A1823]">
                  <div className="w-5 h-5 rounded-full bg-[#3A1823] text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</div>
                  <span>Choose custom colors, floral petals, gold/silver foils, or upload photos.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs text-[#3A1823]">
                  <div className="w-5 h-5 rounded-full bg-[#3A1823] text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</div>
                  <span>Our artists hand-pour, de-gas, and UV-cure your piece over 3-5 days.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs text-[#3A1823]">
                  <div className="w-5 h-5 rounded-full bg-[#3A1823] text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</div>
                  <span>Delivered in luxury velvet or matte gift packaging with a handwritten card.</span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/custom-orders"
                  className="inline-flex items-center space-x-2 px-7 py-3 bg-[#3A1823] text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#4E2230] shadow-sm transition-all active:scale-98"
                >
                  <span>Start Bespoke Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-md aspect-square bg-white border border-[#EFE3E7]">
                  <img
                    src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800"
                    alt="Illuminated custom resin photo frame"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-md aspect-[4/3] bg-white border border-[#EFE3E7]">
                  <img
                    src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800"
                    alt="Custom initial resin letter keychain"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-6">
                <div className="rounded-2xl overflow-hidden shadow-md aspect-[4/3] bg-white border border-[#EFE3E7]">
                  <img
                    src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800"
                    alt="Custom resin nameplate entrance plaque"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-md aspect-square bg-white border border-[#EFE3E7]">
                  <img
                    src="https://images.unsplash.com/photo-1513201099705-a9742e15a5b6?w=800"
                    alt="Wedding garland preservation keepsake dish"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 6. BESTSELLERS ---------------- */}
      {bestsellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#B84A67]">
              Customer Loved
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A1823]">
              Studio Bestsellers
            </h2>
            <p className="text-xs text-[#7A5E68]">
              Our most cherished creations, consistently praised for their durability and radiant clarity.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------- 7. BRAND STORY ---------------- */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#EFE3E7] shadow-sm text-center space-y-6 relative overflow-hidden">
          <div className="w-12 h-12 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#B84A67] mx-auto">
            <Gem className="w-6 h-6" />
          </div>

          <span className="text-xs uppercase font-bold tracking-widest text-[#B84A67] block">
            The Studio Philosophy
          </span>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A1823] max-w-2xl mx-auto leading-snug">
            "We don't just pour resin — we encapsulate life's ephemeral beauty into forever keepsakes."
          </h2>

          <p className="text-sm text-[#7A5E68] max-w-2xl mx-auto leading-relaxed">
            Founded with a passion for botanical aesthetics, floral preservation, and crystal geodes, Devangi Resin Studio creates heirloom pieces that celebrate milestones, memories, and modern elegance.
          </p>
        </div>
      </section>
      </div>
    </div>
  );
}
