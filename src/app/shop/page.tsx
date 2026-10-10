import React from "react";
import Link from "next/link";
import { dbStore } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { Filter, Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";


interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: "price_asc" | "price_desc" | "newest" | "popularity";
    min_price?: string;
    max_price?: string;
    in_stock?: string;
    page?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
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
    categorySlug,
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
      <div className="border-b border-[#E8E0D5] pb-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0">
          <div>
            <div className="text-xs text-[#8C7A72] flex items-center space-x-1.5 mb-1">
              <Link href="/" className="hover:text-[#2C332D]">Home</Link>
              <span>/</span>
              <span>Shop Boutique</span>
              {activeCategory && (
                <>
                  <span>/</span>
                  <span className="font-semibold text-[#2C332D]">{activeCategory.name}</span>
                </>
              )}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C332D]">
              {activeCategory ? activeCategory.name : "Handmade Resin Collection"}
            </h1>
            <p className="text-xs text-[#736C66] mt-1 max-w-xl">
              {activeCategory
                ? activeCategory.description
                : "Explore our complete range of handmade crystal geode coasters, floral jewellery, bespoke keychains, and personalized keepsake gifts."}
            </p>
          </div>

          <div className="text-xs text-[#736C66]">
            Showing <strong className="text-[#2C332D]">{products.length}</strong> of <strong>{total}</strong> products
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-6">
          <Link
            href="/shop"
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
              !categorySlug
                ? "bg-[#2C332D] text-white shadow-sm"
                : "bg-white border border-[#E8E0D5] text-[#2C332D] hover:bg-[#F4EBE6]"
            }`}
          >
            All Collections
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
                categorySlug === c.slug
                  ? "bg-[#2C332D] text-white shadow-sm"
                  : "bg-white border border-[#E8E0D5] text-[#2C332D] hover:bg-[#F4EBE6]"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* ---------------- Filters Sidebar ---------------- */}
        <React.Suspense fallback={<div className="h-64 bg-[#FAF8F5] rounded-2xl animate-pulse" />}>
          <ShopFilters
            categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
            activeCategorySlug={categorySlug}
            initialSearch={search}
            initialSort={sort}
            initialInStock={inStockOnly}
          />
        </React.Suspense>

        {/* ---------------- Products Grid ---------------- */}
        <main className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FAF4EC] flex items-center justify-center text-[#B8972E] mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2C332D]">No products found</h3>
              <p className="text-xs text-[#736C66] max-w-sm mx-auto">
                No active products match your selected filters. Try broadening your search or exploring other categories.
              </p>
              <Link
                href="/shop"
                className="inline-block mt-2 px-6 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-full hover:bg-[#3D473E] transition-colors"
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
