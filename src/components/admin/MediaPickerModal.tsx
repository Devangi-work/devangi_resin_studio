"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Check,
  Upload,
  Image as ImageIcon,
  Loader2,
  FolderOpen,
} from "lucide-react";

interface MediaItem {
  id: string;
  fileName: string;
  url: string;
  altText?: string;
  fileSize?: number;
  createdAt: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selected: { url: string; altText?: string; fileName?: string }[]) => void;
  multiple?: boolean;
  title?: string;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  title = "Select from Media Library",
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
      setSelectedUrls([]);
    }
  }, [isOpen]);

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
      console.error("Failed to load media items:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (url: string) => {
    if (multiple) {
      if (selectedUrls.includes(url)) {
        setSelectedUrls((prev) => prev.filter((u) => u !== url));
      } else {
        setSelectedUrls((prev) => [...prev, url]);
      }
    } else {
      setSelectedUrls([url]);
    }
  };

  const handleUploadNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newlyUploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          newlyUploadedUrls.push(data.url);
        }
      }

      await loadMedia();

      if (multiple) {
        setSelectedUrls((prev) => [...prev, ...newlyUploadedUrls]);
      } else if (newlyUploadedUrls.length > 0) {
        setSelectedUrls([newlyUploadedUrls[0]]);
      }
    } catch {
      alert("Failed to upload new media.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleConfirm = () => {
    const selectedItems = selectedUrls.map((url) => {
      const found = media.find((m) => m.url === url);
      return {
        url,
        altText: found?.altText || found?.fileName || "Resin Art",
        fileName: found?.fileName || "media_asset.png",
      };
    });
    onSelect(selectedItems);
    onClose();
  };

  if (!isOpen) return null;

  const filteredMedia = media.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.fileName?.toLowerCase().includes(q) || item.altText?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col border border-[#E8E0D5] shadow-2xl overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="p-5 border-b border-[#E8E0D5] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF4EC] border border-[#E8E0D5] flex items-center justify-center text-[#B8972E]">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#2C332D]">{title}</h2>
              <p className="text-[11px] text-[#736C66]">
                {multiple
                  ? "Select one or more images from your studio media library."
                  : "Select an image to apply."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#736C66] hover:text-[#2C332D] hover:bg-[#FAF8F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search + Upload Button */}
        <div className="p-4 bg-[#FAF8F5] border-b border-[#E8E0D5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8C7A72] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search library assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <label className="px-3.5 py-2 bg-white border border-[#E8E0D5] hover:border-[#D4AF37] text-[#2C332D] text-xs font-semibold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 text-[#B8972E] animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-[#B8972E]" />
              )}
              <span>{uploading ? "Uploading..." : "Upload New"}</span>
              <input
                type="file"
                accept="image/*"
                multiple={multiple}
                className="hidden"
                onChange={handleUploadNew}
                disabled={uploading}
              />
            </label>
            {multiple && media.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedUrls(selectedUrls.length === filteredMedia.length ? [] : filteredMedia.map((m) => m.url))
                }
                className="px-3 py-2 text-xs text-[#736C66] hover:text-[#2C332D] font-medium"
              >
                {selectedUrls.length === filteredMedia.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>
        </div>

        {/* Media Grid View */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-[320px]">
          {loading ? (
            <div className="py-20 text-center space-y-2">
              <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
              <p className="text-xs text-[#736C66]">Loading media assets...</p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-[#8C7A72] mx-auto" />
              <p className="text-xs text-[#736C66]">No media assets found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
              {filteredMedia.map((item) => {
                const isSelected = selectedUrls.includes(item.url);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleSelect(item.url)}
                    className={`relative rounded-2xl overflow-hidden aspect-square border-2 cursor-pointer transition-all bg-[#FAF8F5] group ${
                      isSelected
                        ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/40 shadow-md scale-[0.98]"
                        : "border-[#E8E0D5] hover:border-[#B8972E]/60 shadow-xs"
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.altText || item.fileName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Selection Indicator Badge */}
                    <div
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#D4AF37] text-[#1F2421] shadow-md scale-100"
                          : "bg-white/80 border border-[#E8E0D5] text-transparent opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>

                    {/* Clean caption on hover / bottom */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                      <p className="text-[10.5px] font-semibold truncate leading-tight">
                        {item.fileName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-[#E8E0D5] bg-[#FAF8F5] flex items-center justify-between">
          <div className="text-xs text-[#736C66]">
            {selectedUrls.length > 0 ? (
              <span className="font-semibold text-[#2C332D]">
                {selectedUrls.length} image{selectedUrls.length > 1 ? "s" : ""} selected
              </span>
            ) : (
              <span>Click on images to select</span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#E8E0D5] text-[#736C66] text-xs font-semibold rounded-xl hover:text-[#2C332D]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedUrls.length === 0}
              onClick={handleConfirm}
              className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E] shadow-sm disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {multiple
                  ? `Insert ${selectedUrls.length} Image${selectedUrls.length > 1 ? "s" : ""}`
                  : "Use Selected Image"}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
