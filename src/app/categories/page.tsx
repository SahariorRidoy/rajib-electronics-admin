/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  FolderHeart,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Layers,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/services/categories.api";
import {
  useListSubcategoriesQuery,
  useCreateSubcategoryMutation,
  useUpdateSubcategoryMutation,
  useDeleteSubcategoryMutation,
} from "@/services/subcategories.api";
import type {
  Category,
  CreateCategoryDTO,
  Subcategory,
  CreateSubcategoryDTO,
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
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onCancel} className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-5 py-2.5 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [modalType, setModalType] = useState<"category" | "subcategory" | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "category" | "subcategory"; id: string } | null>(null);
  
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    title: "",
    description: "",
    isActive: true,
  });
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    slug: "",
    categoryId: "",
    description: "",
    isActive: true,
  });
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);

  const { data: categoriesData, isLoading: loadingCats } = useListCategoriesQuery();
  const { data: subcategoriesData, isLoading: loadingSubs } = useListSubcategoriesQuery();
  const [createCategory, { isLoading: creatingCat }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updatingCat }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: deletingCat }] = useDeleteCategoryMutation();
  const [createSubcategory, { isLoading: creatingSub }] = useCreateSubcategoryMutation();
  const [updateSubcategory, { isLoading: updatingSub }] = useUpdateSubcategoryMutation();
  const [deleteSubcategory, { isLoading: deletingSub }] = useDeleteSubcategoryMutation();

  const categories = useMemo<Category[]>(() => ((categoriesData as any)?.data ?? []), [categoriesData]);
  const subcategories = useMemo<Subcategory[]>(() => ((subcategoriesData as any)?.data ?? []), [subcategoriesData]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return categories.filter((c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.slug || "").toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter((s) => {
      const subCatId = typeof s.categoryId === 'string' 
        ? s.categoryId 
        : (s.categoryId as any)?._id;
      return subCatId === categoryId;
    });
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        name: cat.name,
        slug: cat.slug,
        title: cat.title || "",
        description: cat.description || "",
        isActive: isActive(cat),
      });
      setBannerImages((cat.images || []).map((url) => ({ url, filePath: "" })));
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", slug: "", title: "", description: "", isActive: true });
      setBannerImages([]);
    }
    setModalType("category");
  };

  const openSubcategoryModal = (categoryId: string, sub?: Subcategory) => {
    if (sub) {
      setEditingSubcategory(sub);
      const subCatId = typeof sub.categoryId === 'string' 
        ? sub.categoryId 
        : (sub.categoryId as any)?._id;
      setSubcategoryForm({
        name: sub.name,
        slug: sub.slug,
        categoryId: subCatId,
        description: sub.description || "",
        isActive: isActive(sub),
      });
      setBannerImages((sub.images || []).map((url) => ({ url, filePath: "" })));
    } else {
      setEditingSubcategory(null);
      setSubcategoryForm({ name: "", slug: "", categoryId, description: "", isActive: true });
      setBannerImages([]);
    }
    setModalType("subcategory");
  };


  const closeModal = () => {
    setModalType(null);
    setEditingCategory(null);
    setEditingSubcategory(null);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateCategoryDTO = {
      name: categoryForm.name,
      slug: categoryForm.slug,
      title: categoryForm.title || undefined,
      images: bannerImages.map((img) => img.url),
      description: categoryForm.description || undefined,
      status: categoryForm.isActive ? "ACTIVE" : "HIDDEN",
    };

    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory._id, body: payload }).unwrap();
        toast.success("Category updated");
      } else {
        await createCategory(payload).unwrap();
        toast.success("Category created");
      }
      closeModal();
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateSubcategoryDTO = {
      name: subcategoryForm.name,
      slug: subcategoryForm.slug,
      categoryId: subcategoryForm.categoryId,
      images: bannerImages.map((img) => img.url),
      description: subcategoryForm.description || undefined,
      status: subcategoryForm.isActive ? "ACTIVE" : "HIDDEN",
    };

    try {
      if (editingSubcategory) {
        await updateSubcategory({ id: editingSubcategory._id, body: payload }).unwrap();
        toast.success("Subcategory updated");
      } else {
        await createSubcategory(payload).unwrap();
        toast.success("Subcategory created");
      }
      closeModal();
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === "category") {
        await deleteCategory(confirmDelete.id).unwrap();
        toast.success("Category deleted");
      } else {
        await deleteSubcategory(confirmDelete.id).unwrap();
        toast.success("Subcategory deleted");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-pink-200 text-gray-700 hover:bg-pink-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-600 flex items-center gap-3">
              <FolderHeart className="w-10 h-10 text-pink-500" />
              Categories & Subcategories
            </h1>
            <p className="text-pink-700/70 font-medium mt-2">Manage nested category structure</p>
          </div>

          <div className="bg-white rounded-2xl border border-pink-100 p-4 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
              />
            </div>
            <button
              onClick={() => openCategoryModal()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold shadow hover:from-cyan-300 hover:to-cyan-700 transition whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Add Category</span><span className="sm:hidden">Add</span>
            </button>
          </div>

          {loadingCats || loadingSubs ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-pink-100 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-pink-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((cat) => {
                const subs = getSubcategoriesForCategory(cat._id);
                const isExpanded = expandedCategories.has(cat._id);
                return (
                  <div key={cat._id} className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                    <div className="p-4 sm:p-6 flex flex-col flex-1">
                      <div className="flex flex-col gap-4 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-base sm:text-xl font-bold text-gray-900">{cat.name}</h3>
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${cat.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                {cat.status}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 font-mono break-all">{cat.slug}</p>
                            {cat.description && <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{cat.description}</p>}
                          </div>
                          {cat.images && cat.images.length > 0 && (
                            <div className="flex flex-col gap-1.5 flex-shrink-0">
                              {cat.images.map((img, idx) => (
                                <div
                                  key={idx}
                                  title={idx === 0 ? "1:1 · 500×500" : "3:1 · 1200×400"}
                                  className={`relative rounded-lg overflow-hidden border-2 border-pink-200 ${
                                    idx === 0 ? "w-14 h-14" : "w-[168px] h-14"
                                  }`}
                                >
                                  {img && img.trim() !== "" ? (
                                    <Image
                                      src={img}
                                      alt={`${cat.name} ${idx === 0 ? "1:1" : "3:1"}`}
                                      fill
                                      className="object-cover"
                                      sizes={idx === 0 ? "56px" : "168px"}
                                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-pink-50">
                                      <ImageIcon className="w-4 h-4 text-pink-300" />
                                    </div>
                                  )}
                                  <span className="absolute bottom-0.5 left-0.5 bg-white/80 text-[9px] font-bold px-1 rounded">
                                    {idx === 0 ? "1:1" : "3:1"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          <button 
                            onClick={() => openCategoryModal(cat)} 
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition font-medium text-xs sm:text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => setConfirmDelete({ type: "category", id: cat._id })} 
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition font-medium text-xs sm:text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete </span>
                          </button>
                          <button
                            onClick={() => toggleCategory(cat._id)}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition shadow-md font-medium text-xs sm:text-sm"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span>Subcategories ({subs.length})</span>
                          </button>
                          <button
                            onClick={() => openSubcategoryModal(cat._id)}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 transition text-xs sm:text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Subcategory</span>
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-6 ml-0 sm:ml-12 space-y-3 border-t border-pink-100 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Layers className="w-4 h-4 text-cyan-600" />
                              Subcategories
                            </h4>
                          </div>

                          {subs.length === 0 ? (
                            <p className="text-sm text-gray-400 italic py-4 text-center">No subcategories yet. Click &quot;Add Subcategory&quot; to create one.</p>
                          ) : (
                            <div className="space-y-3">
                              {subs.map((sub) => (
                                <div key={sub._id} className="flex flex-col gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-cyan-200 hover:bg-cyan-50/30 transition">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h5 className="font-semibold text-gray-900 text-sm sm:text-base">{sub.name}</h5>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${sub.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                          {sub.status}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500 font-mono break-all">{sub.slug}</p>
                                      {sub.description && <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{sub.description}</p>}
                                    </div>
                                    {sub.images && sub.images.length > 0 && (
                                      <div className="flex flex-col gap-1 flex-shrink-0">
                                        {sub.images.map((img, idx) => (
                                          <div
                                            key={idx}
                                            title={idx === 0 ? "1:1 · 500×500" : "3:1 · 1200×400"}
                                            className={`relative rounded-lg overflow-hidden border-2 border-cyan-200 ${
                                              idx === 0 ? "w-12 h-12" : "w-[144px] h-12"
                                            }`}
                                          >
                                            {img && img.trim() !== "" ? (
                                              <Image
                                                src={img}
                                                alt={`${sub.name} ${idx === 0 ? "1:1" : "3:1"}`}
                                                fill
                                                className="object-cover"
                                                sizes={idx === 0 ? "48px" : "144px"}
                                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center bg-cyan-50">
                                                <ImageIcon className="w-3 h-3 text-cyan-300" />
                                              </div>
                                            )}
                                            <span className="absolute bottom-0.5 left-0.5 bg-white/80 text-[9px] font-bold px-1 rounded">
                                              {idx === 0 ? "1:1" : "3:1"}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button 
                                      onClick={() => openSubcategoryModal(cat._id, sub)} 
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition text-xs sm:text-sm font-medium"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      <span>Edit</span>
                                    </button>
                                    <button 
                                      onClick={() => setConfirmDelete({ type: "subcategory", id: sub._id })} 
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition text-xs sm:text-sm font-medium"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete this ${confirmDelete?.type}?`}
        subtitle="This action cannot be undone."
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        loading={deletingCat || deletingSub}
      />

      {modalType === "category" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl border border-pink-100 shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCategorySubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-pink-600">{editingCategory ? "Edit Category" : "Add Category"}</h2>
                <button type="button" onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={categoryForm.title}
                  onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                />
              </div>
              <UploadBannerImages value={bannerImages} onChange={setBannerImages} disabled={creatingCat || updatingCat} />
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="catActive"
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-pink-600 border-pink-200 rounded"
                />
                <label htmlFor="catActive" className="text-xs sm:text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-3">
                <button type="button" onClick={closeModal} className="px-4 sm:px-5 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={creatingCat || updatingCat} className="px-5 sm:px-6 py-2.5 text-sm rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-50">
                  {editingCategory ? (updatingCat ? "Updating..." : "Update") : (creatingCat ? "Creating..." : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === "subcategory" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl border border-pink-100 shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubcategorySubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-cyan-600">{editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}</h2>
                <button type="button" onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={subcategoryForm.name}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border-2 border-cyan-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={subcategoryForm.slug}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, slug: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border-2 border-cyan-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition font-mono"
                    required
                  />
                </div>
              </div>
              <UploadBannerImages value={bannerImages} onChange={setBannerImages} disabled={creatingSub || updatingSub} />
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={subcategoryForm.description}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg border-2 border-cyan-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="subActive"
                  type="checkbox"
                  checked={subcategoryForm.isActive}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 border-cyan-200 rounded"
                />
                <label htmlFor="subActive" className="text-xs sm:text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-3">
                <button type="button" onClick={closeModal} className="px-4 sm:px-5 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={creatingSub || updatingSub} className="px-5 sm:px-6 py-2.5 text-sm rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-50">
                  {editingSubcategory ? (updatingSub ? "Updating..." : "Update") : (creatingSub ? "Creating..." : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
