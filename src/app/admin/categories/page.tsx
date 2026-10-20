"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, FolderTree, AlertCircle, Check, Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    displayOrder: 1,
    isPublished: true,
  });

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      displayOrder: categories.length + 1,
      isPublished: true,
    });
    setIsOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
      displayOrder: cat.displayOrder || 1,
      isPublished: cat.isPublished,
    });
    setIsOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : slug,
    }));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (res.ok && json.url) {
        setFormData((prev) => ({ ...prev, imageUrl: json.url }));
      } else {
        setError(json.error || "Failed to upload image file.");
      }
    } catch {
      setError("Image upload network error.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const endpoint = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Category saved successfully!");
        setIsOpen(false);
        loadCategories();
      } else {
        setError(data.error || "Failed to save category.");
      }
    } catch {
      setError("Network error occurred.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage("Category deleted.");
        loadCategories();
      } else {
        alert(data.error || "Cannot delete category containing active products.");
      }
    } catch {
      alert("Delete failed.");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === categories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(categories.map((c) => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (
      !confirm(
        `Are you sure you want to permanently delete these ${count} selected categor${
          count > 1 ? "ies" : "y"
        }? Categories with active products cannot be deleted.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/categories/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Successfully deleted ${count} categor${count > 1 ? "ies" : "y"}!`);
        setSelectedIds([]);
        loadCategories();
      } else {
        alert(data.error || "Failed to delete selected categories.");
      }
    } catch {
      alert("Failed to delete selected categories.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C332D]">
            Category Management
          </h1>
          <p className="text-xs text-[#736C66]">
            Organize handmade resin art collections and storefront navigation.
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2.5 bg-[#2C332D] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 hover:bg-[#3D473E] shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Bulk Action Controls Bar */}
      {categories.length > 0 && (
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E0D5] shadow-xs flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center space-x-2 text-xs font-medium text-[#2C332D] cursor-pointer">
            <input
              type="checkbox"
              checked={categories.length > 0 && selectedIds.length === categories.length}
              onChange={toggleSelectAll}
              className="rounded text-[#2C332D]"
            />
            <span>Select All ({categories.length})</span>
          </label>

          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#736C66] font-medium">
                {selectedIds.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold bg-[#FDF2F2] text-[#DF4C4C] hover:bg-[#fbdada] rounded-lg border border-[#FADBD8] flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {message && (
        <div className="p-3 bg-[#E8EFE8] border border-[#C5D8C5] rounded-xl text-xs text-[#2E7D32] flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage("")} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`bg-white rounded-2xl border ${
              selectedIds.includes(cat.id) ? "border-[#D4AF37] ring-1 ring-[#D4AF37]" : "border-[#E8E0D5]"
            } overflow-hidden shadow-sm flex flex-col justify-between transition-all`}
          >
            <div>
              <div className="aspect-[16/9] bg-[#FAF8F5] overflow-hidden relative">
                <div className="absolute top-2.5 left-2.5 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(cat.id)}
                    onChange={() => toggleSelect(cat.id)}
                    className="w-4 h-4 rounded text-[#2C332D] bg-white/90 shadow-sm cursor-pointer"
                  />
                </div>
                <img
                  src={cat.imageUrl || "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800"}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
                {!cat.isPublished && (
                  <span className="absolute top-2 right-2 bg-[#FAF4EC] text-[#B8972E] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#E8E0D5]">
                    Hidden
                  </span>
                )}
              </div>

              <div className="p-5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base font-bold text-[#2C332D]">{cat.name}</h3>
                  <span className="text-[10px] text-[#8C7A72] font-mono">Order: {cat.displayOrder}</span>
                </div>
                <p className="text-xs font-mono text-[#8C7A72]">/{cat.slug}</p>
                <p className="text-xs text-[#736C66] line-clamp-2 pt-1 font-light">
                  {cat.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#F4EBE6] flex items-center justify-end space-x-2">
              <button
                onClick={() => openEdit(cat)}
                className="px-3 py-1.5 bg-white border border-[#E8E0D5] text-[#2C332D] text-xs font-semibold rounded-lg hover:bg-[#F4EBE6]"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                className="px-3 py-1.5 text-[#DF4C4C] hover:bg-[#FDF2F2] text-xs font-semibold rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-[#E8E0D5] shadow-2xl">
            <h2 className="font-serif text-lg font-bold text-[#2C332D] border-b border-[#F4EBE6] pb-3">
              {editingId ? "Edit Category" : "Create New Category"}
            </h2>

            {error && <p className="text-xs text-[#DF4C4C] bg-[#FDF2F2] p-2.5 rounded-lg">{error}</p>}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Resin Nameplates"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Category Image
                </label>
                
                {formData.imageUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-[#E8E0D5] bg-[#FAF8F5] mb-2 p-2 flex items-center space-x-3">
                    <img
                      src={formData.imageUrl}
                      alt="Category preview"
                      className="w-16 h-16 object-cover rounded-lg border border-[#E8E0D5]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#2C332D] truncate">Image selected</p>
                      <p className="text-[10px] text-[#8C7A72] truncate">{formData.imageUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl border border-[#D4AF37] bg-[#FAF4EC] hover:bg-[#F3EAD9] text-[#7A6117] text-xs font-semibold transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-[#B8972E]" />
                    <span>Media Library</span>
                  </button>

                  <label className={`flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl border border-[#E8E0D5] hover:border-[#D4AF37] bg-white cursor-pointer transition-colors ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#736C66]" />
                    )}
                    <span className="text-xs font-medium text-[#2C332D]">
                      {uploadingImage ? "Uploading..." : "Upload File"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short collection description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#2C332D] block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="ispub"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded text-[#2C332D]"
                  />
                  <label htmlFor="ispub" className="text-xs font-semibold text-[#2C332D] cursor-pointer">
                    Visible on Store
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-[#F4EBE6]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-[#E8E0D5] text-xs font-semibold rounded-xl text-[#736C66]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C332D] text-white text-xs font-semibold rounded-xl hover:bg-[#3D473E]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        multiple={false}
        title="Select Category Cover Image"
        onSelect={(items) => {
          if (items.length > 0) {
            setFormData((prev) => ({ ...prev, imageUrl: items[0].url }));
          }
        }}
      />
    </div>
  );
}
