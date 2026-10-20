"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ShopFiltersProps {
  categories: Category[];
  activeCategorySlug?: string;
  initialSearch?: string;
  initialSort?: string;
  initialInStock?: boolean;
}

export function ShopFilters({
  categories,
  activeCategorySlug,
  initialSearch = "",
  initialSort = "popularity",
  initialInStock = false,
}: ShopFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchVal = formData.get("search")?.toString() || "";
    const params = new URLSearchParams(searchParams.toString());
    if (searchVal.trim()) {
      params.set("search", searchVal.trim());
    } else {
      params.delete("search");
    }
    router.push(`/shop?${params.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.push(`/shop?${params.toString()}`);
  };

  const handleInStockToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("in_stock", "true");
    } else {
      params.delete("in_stock");
    }
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <aside className="lg:col-span-1 space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-[#EFE3E7] shadow-xs space-y-6">
        {/* Search Input */}
        <div>
          <label className="text-xs font-bold text-[#3A1823] uppercase tracking-wider block mb-2">
            Search Catalog
          </label>
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              name="search"
              defaultValue={initialSearch}
              placeholder="e.g. Geode, Forget-me-not..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FCFAF8] border border-[#EFE3E7] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-[#2E161F]"
            />
            <Search className="w-3.5 h-3.5 text-[#8C6E79] absolute left-3 top-3" />
          </form>
        </div>

        {/* Sort Dropdown */}
        <div>
          <label className="text-xs font-bold text-[#3A1823] uppercase tracking-wider block mb-2">
            Sort By
          </label>
          <select
            name="sort"
            value={initialSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-[#FCFAF8] border border-[#EFE3E7] rounded-xl text-[#3A1823] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          >
            <option value="popularity">Most Popular & Bestsellers</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Availability Filter */}
        <div className="pt-2 border-t border-[#FAF0F3]">
          <label className="text-xs font-bold text-[#3A1823] uppercase tracking-wider block mb-2">
            Availability
          </label>
          <label className="flex items-center space-x-2 text-xs text-[#3A1823] cursor-pointer">
            <input
              type="checkbox"
              name="in_stock"
              checked={initialInStock}
              onChange={(e) => handleInStockToggle(e.target.checked)}
              className="rounded border-[#EFE3E7] text-[#3A1823] focus:ring-[#D4AF37]"
            />
            <span>In Stock Only</span>
          </label>
        </div>

        {/* Clear All Filters */}
        {(activeCategorySlug || initialSearch || initialInStock) && (
          <div className="pt-2 border-t border-[#FAF0F3]">
            <Link
              href="/shop"
              className="w-full py-2 text-xs font-semibold text-[#DF4C4C] hover:bg-[#FDF2F4] rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
