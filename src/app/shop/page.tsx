import React from "react";
import Link from "next/link";
import { dbStore } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { Filter, Search, X, SlidersHorizontal, ArrowUpDown, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: "price_asc" | "price_desc" | "newest" | "popularity";
    min_price?: string;
    max_price?: string;
    in_stock?: string;
    page?: string;
    festival?: string;
    filter?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const isFestivalOnly = params.festival === "true" || params.filter === "festival";
  const categorySlug = params.category || undefined;
  const search = params.search || undefined;
  const sort = params.sort || "popularity";
  const minPrice = params.min_price ? Number(params.min_price) : undefined;
  const maxPrice = params.max_price ? Number(params.max_price) : undefined;
  const inStockOnly = params.in_stock === "true";
  const page = params.page ? Number(params.page) : 1;

  const categories = await dbStore.getCategories(true);

  const { products, total, totalPages } = await dbStore.getProducts({
    status: "published",
    categorySlug: isFestivalOnly ? undefined : categorySlug,
    isFestivalSpecial: isFestivalOnly ? true : undefined,
    search,
    sort,
    minPrice,
    maxPrice,
    inStockOnly,
    page,
    limit: 24,
  });

  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Header */}
      <div className="border-b border-[#EFE3E7] pb-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
          <div>
            <div className="text-xs text-[#8C6E79] flex items-center space-x-1.5 mb-1">
              <Link href="/" className="hover:text-[#3A1823]">Home</Link>
              <span>/</span>
              <span>Shop Boutique</span>
              {isFestivalOnly ? (
                <>
                  <span>/</span>
                  <span className="font-bold text-[#8C1D38] flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    <span>Festive Specials</span>
                  </span>
                </>
              ) : activeCategory ? (
                <>
                  <span>/</span>
                  <span className="font-semibold text-[#3A1823]">{activeCategory.name}</span>
                </>
              ) : null}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#3A1823] flex items-center space-x-3">
              {isFestivalOnly ? (
                <>
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#6A162B] to-[#3A1823] text-[#FFDF78] flex items-center justify-center shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <span>Festive Special Editions</span>
                </>
              ) : activeCategory ? (
                activeCategory.name
              ) : (
                "Handmade Resin Collection"
              )}
            </h1>

            <p className="text-xs text-[#7A5E68] mt-1.5 max-w-xl leading-relaxed">
              {isFestivalOnly
                ? "Discover our limited-edition celebratory keepsakes, floral frames, and geode clocks featuring exclusive festive discounts."
                : activeCategory
                ? activeCategory.description
                : "Explore our complete range of handmade crystal geode coasters, floral jewellery, bespoke keychains, and personalized keepsake gifts."}
            </p>
          </div>

          <div className="text-xs text-[#7A5E68]">
            Showing <strong className="text-[#3A1823]">{products.length}</strong> of <strong>{total}</strong> products
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-6">
          <Link
            href="/shop"
            className={`text-xs px-4 py-2 rounded-full font-semibold transition-all ${
              !categorySlug && !isFestivalOnly
                ? "bg-[#3A1823] text-white shadow-sm"
                : "bg-white border border-[#EFE3E7] text-[#3A1823] hover:bg-[#FAF0F3]"
            }`}
          >
            All Collections
          </Link>

          {/* Dedicated Festive Specials Boutique Pill */}
          <Link
            href="/shop?festival=true"
            className={`text-xs px-4 py-2 rounded-full font-bold transition-all flex items-center space-x-1.5 shadow-xs ${
              isFestivalOnly
                ? "bg-gradient-to-r from-[#6A162B] via-[#851E39] to-[#6A162B] text-[#FFDF78] ring-2 ring-[#D4AF37] shadow-md scale-105"
                : "bg-gradient-to-r from-[#FAF0F3] to-[#FFF5F8] border-2 border-[#D4AF37]/70 text-[#6A162B] hover:border-[#D4AF37] hover:scale-102"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>✨ Festive Specials</span>
            <span className="text-[9px] bg-[#D4AF37] text-[#2D121C] px-1.5 py-0.2 rounded-full font-black">
              DEALS
            </span>
          </Link>

          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className={`text-xs px-3.5 py-2 rounded-full font-medium transition-all ${
                categorySlug === c.slug && !isFestivalOnly
                  ? "bg-[#3A1823] text-white shadow-sm"
                  : "bg-white border border-[#EFE3E7] text-[#3A1823] hover:bg-[#FAF0F3]"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* ---------------- Filters Sidebar ---------------- */}
        <React.Suspense fallback={<div className="h-64 bg-[#FCFAF8] rounded-2xl animate-pulse" />}>
          <ShopFilters
            categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
            activeCategorySlug={categorySlug}
            initialSearch={search}
            initialSort={sort}
            initialInStock={inStockOnly}
            initialFestival={isFestivalOnly}
          />
        </React.Suspense>

        {/* ---------------- Products Grid ---------------- */}
        <main className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EFE3E7] p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#B84A67] mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#3A1823]">No products found</h3>
              <p className="text-xs text-[#7A5E68] max-w-sm mx-auto">
                No active products match your selected filters. Try broadening your search or exploring other categories.
              </p>
              <Link
                href="/shop"
                className="inline-block mt-2 px-6 py-2.5 bg-[#3A1823] text-white text-xs font-semibold rounded-full hover:bg-[#4E2230] transition-colors"
              >
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
