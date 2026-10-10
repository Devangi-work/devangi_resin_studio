import React from "react";
import { notFound } from "next/navigation";
import { dbStore } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await dbStore.getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductForm initialData={product} isEditing={true} />;
}
