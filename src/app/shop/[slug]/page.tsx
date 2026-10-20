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

  // Related products from the same category
  const relatedRes = await dbStore.getProducts({
    categoryId: product.categoryId,
    status: "published",
    limit: 5,
  });

  const relatedProducts = relatedRes.products.filter((p: any) => p.id !== product.id).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </div>
  );
}
