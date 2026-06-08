/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  FolderTree,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  ArrowLeft,
  X,
} from "lucide-react";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";
import {
  useListSubcategoriesQuery,
  useCreateSubcategoryMutation,
  useUpdateSubcategoryMutation,
  useDeleteSubcategoryMutation,
} from "@/services/subcategories.api";
import { useListCategoriesQuery } from "@/services/categories.api";
import type {
  Subcategory,
  CreateSubcategoryDTO,
  Category,
} from "@/types/category";
import { isActive } from "@/types/category";
import UploadBannerImages, { BannerImage } from "@/components/UploadBannerImages";

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
        <div className="flex gap-3 p-6 pt-0 flex-col sm:flex-row">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-5 py-2.5 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubcategoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    categoryId: "",
    description: "",
    isActive: true,
  });
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);

  const { data: categoriesData } = useListCategoriesQuery();
  const { data, isLoading, isFetching, error } = useListSubcategoriesQuery(
    categoryFilter ? { categoryId: categoryFilter } : undefined
  );
  const [createSubcategory, { isLoading: creating }] = useCreateSubcategoryMutation();
  const [updateSubcategory, { isLoading: updating }] = useUpdateSubcategoryMutation();
  const [deleteSubcategory, { isLoading: deleting }] = useDeleteSubcategoryMutation();

  const categories = useMemo<Category[]>(
    () => ((categoriesData as any)?.data ?? []) as Category[],
    [categoriesData]
  );

  const subcategories = useMemo<Subcategory[]>(
    () => {
      const subs = ((data as any)?.data ?? []) as Subcategory[];
      console.log('Subcategories data:', subs);
      return subs;
    },
    [data]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return subcategories.filter((s) => {
      const nameLower = (s.name || "").toLowerCase();
      const slugLower = (s.slug || "").toLowerCase();
      return nameLower.includes(q) || slugLower.includes(q);
    });
  }, [subcategories, searchQuery]);

  const getCategoryName = (categoryId: string | { _id: string; name: string; slug: string }) => {
    if (typeof categoryId === 'object' && categoryId?.name) {
      return categoryId.name;
    }
    const cat = categories.find((c) => c._id === categoryId);
    return cat?.name || cat?.title || "Unknown Category";
  };

  const openModal = (sub?: Subcategory) => {
    if (sub) {
      setEditing(sub);
      setFormData({
        name: sub.name,
        slug: sub.slug,
        categoryId: sub.categoryId,
        description: sub.description || "",
        isActive: isActive(sub),
      });
      setBannerImages((sub.images || []).map((url) => ({ url, filePath: "" })));
    } else {
      setEditing(null);
      setFormData({
        name: "",
        slug: "",
        categoryId: "",
        description: "",
        isActive: true,
      });
      setBannerImages([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleNameChange = (name: string) => {
    setFormData((s) => ({
      ...s,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateSubcategoryDTO = {
      name: formData.name,
      slug: formData.slug,
      categoryId: formData.categoryId,
      images: bannerImages.map((img) => img.url),
      description: formData.description || undefined,
      status: formData.isActive ? "ACTIVE" : "HIDDEN",
    };

    try {
      if (editing) {
        await updateSubcategory({
          id: editing._id,
          body: payload,
        }).unwrap();
        toast.success("Subcategory updated successfully");
      } else {
        await createSubcategory(payload).unwrap();
        toast.success("Subcategory created successfully");
      }
      closeModal();
    } catch {
      toast.error("Operation failed");
    }
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteSubcategory(confirmId).unwrap();
      toast.success("Subcategory deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmId(null);
    }
  };

  const isValidImageUrl = (url?: string) => {
    if (!url) return false;
    try {
      const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      return ["http:", "https:"].includes(u.protocol) || url.startsWith("/");
    } catch {
      return false;
    }
  };

  const Skeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-40 bg-pink-100/60" />
      <div className="p-5 space-y-2">
        <div className="h-4 bg-pink-100 rounded w-3/4" />
        <div className="h-3 bg-pink-100 rounded w-1/3" />
      </div>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
          <div className="mb-8 sm:text-left">
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-teal-800 p-1 text-gray-700 hover:bg-pink-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-600 flex sm:justify-start items-center gap-3">
              <FolderTree className="w-8 sm:w-10 h-8 sm:h-10 text-pink-500" />
              Subcategory Management
            </h1>
            <p className="text-pink-700/70 font-medium mt-2 text-sm sm:text-base">
              Manage subcategories under parent categories. Image 1: <span className="font-bold text-pink-600">1:1 — 500×500 px</span> · Image 2: <span className="font-bold text-cyan-600">3:1 — 1200×400 px</span> recommended.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-pink-100 p-4 sm:p-6 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subcategories..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition lg:w-64"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name || cat.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold shadow hover:from-cyan-300 hover:to-cyan-700 transition"
              >
                <Plus className="w-5 h-5" /> Add Subcategory
              </button>
            </div>
          </div>

          {isLoading || isFetching ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">Failed to load subcategories.</p>
            </div>
          ) : filtered.length ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((sub) => {
                const firstImage = sub.images?.[0];
                return (
                  <div
                    key={sub._id}
                    className="bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-md transition overflow-hidden group flex flex-col"
                  >
                    <div className="relative h-40 bg-gradient-to-br from-pink-100 to-rose-100">
                      {isValidImageUrl(firstImage) ? (
                        <Image
                          src={firstImage!}
                          alt={sub.name}
                          width={600}
                          height={400}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-pink-200" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            sub.status === "ACTIVE"
                              ? "bg-pink-600 text-white"
                              : "bg-gray-400 text-white"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-pink-600 font-medium mb-2">
                        Parent Category: {getCategoryName(sub.categoryId)}
                      </p>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {sub.description}
                      </p>
                      <div className="mt-auto flex gap-2 flex-wrap">
                        <button
                          onClick={() => openModal(sub)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-50 text-pink-700 border border-pink-100 hover:from-cyan-300 hover:to-cyan-700 transition text-sm"
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => setConfirmId(sub._id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition text-sm"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-pink-100 p-12 text-center shadow-sm">
              <FolderTree className="w-16 h-16 text-pink-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No subcategories yet
              </h3>
              <p className="text-gray-600 mb-6">Create your first subcategory</p>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-semibold shadow hover:from-cyan-300 hover:to-cyan-700 transition"
              >
                <Plus className="w-5 h-5" /> Add Subcategory
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmId}
        title="Delete this subcategory?"
        subtitle="This action cannot be undone."
        onCancel={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl border border-pink-100 shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg sm:text-xl font-semibold text-pink-600">
                  {editing ? "Edit Subcategory" : "Add New Subcategory"}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </button>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Parent Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, categoryId: e.target.value }))
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name || cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, slug: e.target.value }))
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition font-mono"
                    required
                  />
                </div>
              </div>

              <UploadBannerImages
                label="Max 3 Subcategory Images -(16:9 ratio) 1280px*720px"
                value={bannerImages}
                onChange={setBannerImages}
                disabled={creating || updating}
              />

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, description: e.target.value }))
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition resize-none"
                  rows={3}
                  placeholder="Short description..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="active"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, isActive: e.target.checked }))
                  }
                  className="w-4 h-4 text-pink-600 border-pink-200 rounded"
                />
                <label
                  htmlFor="active"
                  className="text-xs sm:text-sm font-medium text-gray-700"
                >
                  Active
                </label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 sm:px-5 py-2.5 text-sm sm:text-base rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="px-5 sm:px-6 py-2.5 text-sm sm:text-base rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white hover:from-cyan-300 hover:to-cyan-700 font-semibold shadow hover:shadow-lg transition disabled:opacity-50"
                >
                  {editing
                    ? updating
                      ? "Updating..."
                      : "Update"
                    : creating
                    ? "Creating..."
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
