"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Search, Tag, Loader2, Image as ImageIcon, X, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";
import {
  useListManufacturersQuery,
  useCreateManufacturerMutation,
  useUpdateManufacturerMutation,
  useDeleteManufacturerMutation,
  type Manufacturer,
  type CreateManufacturerDTO,
} from "@/services/manufacturers.api";
import UploadImages, { type UploadItem } from "@/components/UploadImages";

function ConfirmDialog({
  open,
  title,
  subtitle,
  onCancel,
  onConfirm,
  loading,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-pink-200 shadow-2xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onCancel} className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrandsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Manufacturer | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    status: "ACTIVE" as "ACTIVE" | "HIDDEN",
  });
  const [images, setImages] = useState<UploadItem[]>([]);

  const { data: brandsData, isLoading } = useListManufacturersQuery();
  const [createBrand, { isLoading: isCreating }] = useCreateManufacturerMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateManufacturerMutation();
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteManufacturerMutation();

  const brands = (brandsData?.data ?? []) as Manufacturer[];
  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (brand?: Manufacturer) => {
    if (brand) {
      setEditingBrand(brand);
      setForm({
        name: brand.name,
        slug: brand.slug,
        description: brand.description || "",
        status: brand.status,
      });
      setImages(brand.image ? [{ url: brand.image, filePath: "" }] : []);
    } else {
      setEditingBrand(null);
      setForm({ name: "", slug: "", description: "", status: "ACTIVE" });
      setImages([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateManufacturerDTO = {
      name: form.name,
      slug: form.slug,
      image: images[0]?.url,
      description: form.description || undefined,
      status: form.status,
    };

    try {
      if (editingBrand) {
        await updateBrand({ id: editingBrand._id, body: payload }).unwrap();
        toast.success("Brand updated successfully!");
      } else {
        await createBrand(payload).unwrap();
        toast.success("Brand created successfully!");
      }
      closeModal();
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteBrand(confirmDeleteId).unwrap();
      toast.success("Brand deleted!");
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const isValidImageUrl = (url?: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
          <div className="mb-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-teal-800 p-1 text-gray-700 hover:bg-pink-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#167389] to-[#167389] flex items-center gap-3">
              <Tag className="w-8 sm:w-10 h-8 sm:h-10 text-[#167389]" />
              Brands Management
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Manage product manufacturers and brands. Brand Logo: <span className="font-bold text-[#167389]">1:1 — 500×500 px</span> recommended.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-pink-100 p-4 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brands..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
              />
            </div>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#167389] to-[#167389] text-white font-semibold shadow hover:from-cyan-300 hover:to-cyan-700 transition whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> Add Brand
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                  <div className="h-32 bg-pink-100 rounded-xl mb-4" />
                  <div className="h-4 bg-pink-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-pink-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-pink-100 p-12 text-center">
              <Tag className="w-16 h-16 text-pink-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No brands found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? "Try adjusting your search" : "Add your first brand to get started"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => openModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#167389] to-[#167389] text-white font-semibold shadow hover:from-cyan-300 hover:to-cyan-700 transition"
                >
                  <Plus className="w-5 h-5" /> Add First Brand
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((brand) => (
                <div key={brand._id} className="bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-lg transition overflow-hidden">
                  <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-purple-100">
                    {isValidImageUrl(brand.image) ? (
                      <Image src={brand.image!} alt={brand.name} fill className="object-contain p-4" sizes="300px" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <ImageIcon className="w-12 h-12 text-pink-300" />
                        <span className="text-xs text-pink-400 font-medium">1:1 · 500×500</span>
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 bg-white/80 text-[10px] font-bold px-1.5 py-0.5 rounded text-[#167389]">1:1</span>
                    <div className="absolute top-2 right-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${brand.status === "ACTIVE" ? "bg-green-600 text-white" : "bg-gray-500 text-white"}`}>
                        {brand.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{brand.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{brand.slug}</p>
                    {brand.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{brand.description}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(brand)}
                        className="flex-1 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 transition text-sm font-medium inline-flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(brand._id)}
                        className="flex-1 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 transition text-sm font-medium inline-flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete this brand?"
        subtitle="This action cannot be undone."
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl border border-pink-100 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-pink-100">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-[#167389]">{editingBrand ? "Edit Brand" : "Add Brand"}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Brand Logo: <span className="font-semibold text-[#167389]">1:1 — 500×500 px</span></p>
              </div>
              <button onClick={closeModal} className="p-1.5 sm:p-2 hover:bg-pink-50 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                      })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Brand Logo <span className="text-[#167389] font-semibold">(1:1 · 500×500 px)</span>
                </label>
              <UploadImages value={images} onChange={setImages} max={1} folder="logos" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "HIDDEN" })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-3">
                <button type="button" onClick={closeModal} className="px-4 sm:px-5 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-5 sm:px-6 py-2.5 text-sm rounded-xl bg-gradient-to-r from-[#167389] to-[#167389] text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-50"
                >
                  {editingBrand ? (isUpdating ? "Updating..." : "Update") : isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
