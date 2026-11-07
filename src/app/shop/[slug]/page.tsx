import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { dbStore } from "@/lib/db";
import { ProductDetailView } from "@/components/product/ProductDetailView";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await dbStore.getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found | Devangi Resin Studio" };
  }

  const price = Number(product.salePrice || product.regularPrice);
  const primaryImage = product.images?.[0]?.imageUrl || "";

  return {
    title: `${product.name} | Devangi Resin Studio`,
    description: product.shortDescription || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description.slice(0, 160),
      images: primaryImage ? [{ url: primaryImage }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await dbStore.getProductBySlug(slug);

  if (!product || product.status === "archived") {
    notFound();
  }

  // Strictly fetch related products only from the same category as the active product
  const targetCategoryId = product.categoryId || product.category?.id || null;
  const targetCategorySlug = product.category?.slug || null;

  let relatedProducts: any[] = [];
  if (targetCategoryId || targetCategorySlug) {
    const relatedRes = await dbStore.getProducts({
      categoryId: targetCategoryId || undefined,
      categorySlug: targetCategorySlug || undefined,
      status: "published",
      limit: 50,
    });

    relatedProducts = (relatedRes.products || [])
      .filter((p: any) => {
        if (p.id === product.id) return false;
        const pCatId = p.categoryId || p.category?.id;
        const pCatSlug = p.category?.slug;
        if (targetCategoryId && pCatId) {
          return pCatId === targetCategoryId;
        }
        if (targetCategorySlug && pCatSlug) {
          return pCatSlug === targetCategorySlug;
        }
        return false;
      })
      .slice(0, 4);
  }
  const settings = await dbStore.getSiteSettings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <ProductDetailView product={product} relatedProducts={relatedProducts} settings={settings} />
    </div>
  );
}
