"use client";

import React, { useState, useEffect } from "react";
import { Image as ImageIcon, Upload, Copy, Check, Trash2, ExternalLink } from "lucide-react";

export default function AdminMediaPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  // Collect all product images
  const allImages: Array<{ url: string; alt?: string; productName?: string }> = [];
  products.forEach((p) => {
    (p.images || []).forEach((img: any) => {
      allImages.push({
        url: img.imageUrl,
        alt: img.altText,
        productName: p.name,
      });
    });
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setUploadMessage("Image uploaded to Vercel Blob! URL copied to clipboard.");
        navigator.clipboard.writeText(data.url);
      } else {
        alert(data.error || "Upload failed.");
      }
    } catch {
      alert("Error uploading media.");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Studio Media Library
          </h1>
          <p className="text-xs text-[#736C66]">
            Upload and manage assets stored via Vercel Blob storage.
          </p>
        </div>

        <label className="px-4 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center space-x-2 cursor-pointer hover:bg-[#3D473E] shadow-sm">
          <Upload className="w-4 h-4" />
          <span>{uploading ? "Uploading..." : "Upload New Asset"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {uploadMessage && (
        <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32]">
          {uploadMessage}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-[#736C66] py-12 text-center">Loading media library...</p>
      ) : allImages.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#E8E0D5] text-center space-y-2">
          <ImageIcon className="w-8 h-8 text-[#8C7A72] mx-auto" />
          <p className="text-xs text-[#736C66]">No media assets uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {allImages.map((img, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl overflow-hidden border border-[#E8E0D5] shadow-sm flex flex-col justify-between"
            >
              <div className="aspect-square bg-[#FAF8F5] overflow-hidden relative">
                <img src={img.url} alt={img.alt || "Resin Art"} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(img.url)}
                    className="p-2 bg-white text-[#2C332D] rounded-lg shadow-sm hover:bg-[#FAF8F5]"
                    title="Copy URL"
                  >
                    {copiedUrl === img.url ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white text-[#2C332D] rounded-lg shadow-sm hover:bg-[#FAF8F5]"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-3 text-[11px] text-[#736C66]">
                <p className="font-semibold text-[#2C332D] line-clamp-1">{img.productName || "Studio Asset"}</p>
                <p className="truncate text-[#8C7A72] mt-0.5">{img.url}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
