"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  ExternalLink,
  Search,
  Check,
  Eye,
  X,
  FileImage,
  Calendar,
  Layers,
} from "lucide-react";

interface MediaItem {
  id: string;
  fileName: string;
  url: string;
  fileSize?: number;
  mimeType?: string;
  altText?: string;
  createdAt: string;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [notification, setNotification] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (data?.media) {
        const unique = Array.from(new Map(data.media.map((m: MediaItem) => [m.url, m])).values()) as MediaItem[];
        setMedia(unique);
      }
    } catch (e) {
      console.error("Failed to load media:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setNotification("");

    try {
      let uploadedCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          uploadedCount++;
        }
      }

      setNotification(`Successfully added ${uploadedCount} image${uploadedCount > 1 ? "s" : ""} to your Media Library.`);
      await loadMedia();
    } catch {
      alert("Error uploading media assets.");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}" from the Media Library?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== id));
        if (previewItem?.id === id) setPreviewItem(null);
      }
    } catch {
      alert("Failed to delete media asset.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMedia = media.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.fileName?.toLowerCase().includes(query) ||
      item.altText?.toLowerCase().includes(query)
    );
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
              Studio Media Library
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF4EC] text-[#B8972E] border border-[#E8E0D5]">
              {media.length} {media.length === 1 ? "Asset" : "Assets"}
            </span>
          </div>
          <p className="text-xs text-[#736C66] mt-0.5">
            Central repository for all product photos, custom creation inlays, and studio branding assets.
          </p>
        </div>

        <label className="px-4 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center space-x-2 cursor-pointer hover:bg-[#3D473E] shadow-sm transition-all flex-shrink-0">
          <Upload className="w-4 h-4" />
          <span>{uploading ? "Uploading to Library..." : "Upload Images"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {notification && (
        <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification("")} className="text-[#2E7D32] hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E8E0D5] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8C7A72] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by file name or label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>
        <p className="text-[11px] text-[#736C66]">
          Showing {filteredMedia.length} of {media.length} media items
        </p>
      </div>

      {/* Grid of Media Assets */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#736C66]">Loading studio media library...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-[#E8E0D5] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF4EC] flex items-center justify-center text-[#B8972E] mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-base font-bold text-[#2C332D]">No Media Assets Found</h3>
          <p className="text-xs text-[#736C66] max-w-sm mx-auto">
            {searchQuery
              ? `No media items matching "${searchQuery}". Clear your search to view all assets.`
              : "Upload your first product photography, textures, or resin art snapshots to populate the library."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-1.5 text-xs font-semibold text-[#2C332D] bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl hover:bg-white"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl overflow-hidden border border-[#E8E0D5] shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="aspect-square bg-[#FAF8F5] overflow-hidden relative">
                <img
                  src={item.url}
                  alt={item.altText || item.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Hover overlay with action buttons */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="p-2 bg-white text-[#2C332D] rounded-xl shadow-sm hover:bg-[#FAF8F5] transition-colors"
                    title="View Full Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id, item.fileName)}
                    className="p-2 bg-[#DF4C4C] text-white rounded-xl shadow-sm hover:bg-[#C93B3B] transition-colors disabled:opacity-50"
                    title="Delete Media"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Clean Human-Friendly Card Details (no raw blob URL shown) */}
              <div className="p-3 space-y-1">
                <p className="font-semibold text-xs text-[#2C332D] truncate" title={item.fileName}>
                  {item.fileName}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#8C7A72]">
                  <span>{new Date(item.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                  {item.fileSize ? <span>{formatFileSize(item.fileSize)}</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden border border-[#E8E0D5] shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[#E8E0D5] pb-3">
              <div className="min-w-0 pr-4">
                <h3 className="font-serif text-base font-bold text-[#2C332D] truncate">
                  {previewItem.fileName}
                </h3>
                <p className="text-[11px] text-[#8C7A72]">
                  Uploaded on {new Date(previewItem.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-xl hover:bg-[#FAF8F5] text-[#736C66] hover:text-[#2C332D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] bg-[#FAF8F5] rounded-2xl overflow-hidden flex items-center justify-center p-2 border border-[#E8E0D5]">
              <img
                src={previewItem.url}
                alt={previewItem.altText || previewItem.fileName}
                className="max-h-[56vh] max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-[#736C66] space-y-0.5">
                {previewItem.fileSize ? <p>Size: {formatFileSize(previewItem.fileSize)}</p> : null}
                {previewItem.altText ? <p>Label: {previewItem.altText}</p> : null}
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={previewItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#FAF8F5] text-[#2C332D] border border-[#E8E0D5] text-xs font-semibold rounded-xl flex items-center space-x-1.5 hover:bg-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Size</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
