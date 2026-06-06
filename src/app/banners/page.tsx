"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Search, Image as ImageIcon, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";
import { useGetBannersQuery, useDeleteBannerMutation, useUpdateBannerMutation, useCreateBannerMutation } from "@/services/banners.api";
import { useListCategoriesQuery } from "@/services/categories.api";

import UploadImage, { UploadValue } from "@/components/UploadImage";
import type { Banner } from "@/types/banner";

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

type FormData = {
  title: string;
  subtitle: string;
  discount: string;
  image: string;
  status: "ACTIVE" | "HIDDEN";
  position: "hero" | "side";
  sort: number;
  link: string;
  categorySlug: string;
};

export default function BannersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lockedPosition, setLockedPosition] = useState<"hero" | "side" | null>(null);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    subtitle: "",
    discount: "",
    image: "",
    status: "ACTIVE",
    position: "hero",
    sort: 0,
    link: "",
    categorySlug: "",
  });

  const { data: banners = [], isLoading, isFetching, error } = useGetBannersQuery();
  const { data: categoriesRes } = useListCategoriesQuery();
  const categories = categoriesRes?.data ?? [];
  const [createBanner, { isLoading: creating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: updating }] = useUpdateBannerMutation();
  const [deleteBanner, { isLoading: deleting }] = useDeleteBannerMutation();

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return banners.filter((banner: Banner) => {
      const title = (banner.title || "").toLowerCase();
      const subtitle = (banner.subtitle || "").toLowerCase();
      return title.includes(q) || subtitle.includes(q);
    });
  }, [banners, searchQuery]);

  const openModal = (banner?: Banner, lockPosition?: "hero" | "side") => {
    setLockedPosition(banner ? null : lockPosition ?? null);
    if (banner) {
      setEditing(banner);
      setFormData({
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        discount: banner.discount || "",
        image: banner.image || "",
        status: banner.status || "ACTIVE",
        position: banner.position || "hero",
        sort: banner.sort ?? 100,
        link: banner.link || "",
        categorySlug: banner.categorySlug || "",
      });
    } else {
      setEditing(null);
      setFormData({
        title: "",
        subtitle: "",
        discount: "",
        image: "",
        status: "ACTIVE",
        position: lockPosition ?? "hero",
        sort: 0,
        link: "",
        categorySlug: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateBanner({
          id: editing._id,
          ...formData,
        }).unwrap();
        toast.success("Banner updated successfully");
      } else {
        await createBanner(formData).unwrap();
        toast.success("Banner created successfully");
      }
      closeModal();
    } catch {
      toast.error("Operation failed");
    }
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteBanner(confirmId).unwrap();
      toast.success("Banner deleted");
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
          {/* Header */}
          <div className="mb-8 sm:text-left">
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-pink-200 text-gray-700 hover:bg-pink-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-600 flex justify-center sm:justify-start items-center gap-3">
              <ImageIcon className="w-8 sm:w-10 h-8 sm:h-10 text-pink-500" />
              Homepage Banner Slider
            </h1>
            <p className="text-pink-700/70 font-medium mt-2 text-sm sm:text-base">
              Manage Homepage Banner slider. Hero banners: <span className="font-bold text-pink-600">3:1 ratio — 1800×600 px</span> recommended. Side banners: <span className="font-bold text-purple-600">4:5 ratio — 400×500 px</span> recommended.
            </p>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl border border-pink-100 p-4 sm:p-6 mb-6 shadow-sm">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search banners..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Banner Layout */}
          {isLoading || isFetching ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}</div>
              <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} />)}</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">Failed to load banners.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
              {/* LEFT — Hero Carousel Banners */}
              <div className="bg-white rounded-2xl border border-cyan-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">🖼 Hero Banners</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Left carousel — 3:1 · 1800×600 px</p>
                  </div>
                  <button
                    onClick={() => { openModal(undefined, "hero"); }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Hero
                  </button>
                </div>
                {filtered.filter((b: Banner) => b.position === "hero").length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No hero banners yet</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered
                      .filter((b: Banner) => b.position === "hero")
                      .sort((a: Banner, b: Banner) => a.sort - b.sort)
                      .map((banner: Banner) => (
                        <div key={banner._id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex flex-col group">
                          <div className="relative w-full aspect-[3/1] bg-pink-100">
                            {isValidImageUrl(banner.image) ? (
                              <Image src={banner.image} alt={banner.title || "Hero"} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="400px" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                <ImageIcon className="w-10 h-10 text-pink-200" />
                                <span className="text-xs text-pink-300">1800×600 px</span>
                              </div>
                            )}
                            <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded-full ${banner.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                              {banner.status}
                            </span>
                            <span className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded text-xs font-semibold text-gray-600">#{banner.sort}</span>
                            <span className="absolute bottom-2 left-2 bg-white/80 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600">3:1 · 1800×600</span>
                          </div>
                          <div className="p-3 flex flex-col flex-grow">
                            <p className="font-semibold text-sm text-gray-800 truncate">{banner.title || "Untitled"}</p>
                            <div className="mt-auto pt-2 flex gap-2">
                              <button onClick={() => openModal(banner)} className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-xs font-medium hover:bg-pink-100 transition"><Edit2 className="w-3 h-3" /> Edit</button>
                              <button onClick={() => setConfirmId(banner._id)} className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition"><Trash2 className="w-3 h-3" /> Delete</button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* RIGHT — Side Banners */}
              <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">📌 Side Banners</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Right column — upper &amp; lower</p>
                  </div>
                  <button
                    onClick={() => { openModal(undefined, "side"); }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Side
                  </button>
                </div>
                {filtered.filter((b: Banner) => b.position === "side").length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No side banners yet</div>
                ) : (
                  <div className="space-y-3">
                    {filtered
                      .filter((b: Banner) => b.position === "side")
                      .sort((a: Banner, b: Banner) => a.sort - b.sort)
                      .map((banner: Banner, idx: number) => (
                        <div key={banner._id} className="relative rounded-xl overflow-hidden border border-purple-100 group">
                          <div className="relative w-full h-36 bg-purple-50">
                            {isValidImageUrl(banner.image) ? (
                              <Image src={banner.image} alt={banner.title || "Side"} fill className="object-cover" sizes="300px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-purple-200" /></div>
                            )}
                            <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded text-xs font-bold text-purple-700">
                              {idx === 0 ? "Upper" : "Lower"} (sort: {banner.sort})
                            </div>
                            <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded-full ${banner.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                              {banner.status}
                            </span>
                          </div>
                          <div className="flex gap-2 p-2 bg-white">
                            <button onClick={() => openModal(banner)} className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-xs font-medium hover:bg-pink-100 transition"><Edit2 className="w-3 h-3" /> Edit</button>
                            <button onClick={() => setConfirmId(banner._id)} className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition"><Trash2 className="w-3 h-3" /> Delete</button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmId}
        title="Delete this banner?"
        subtitle="This action cannot be undone."
        onCancel={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-pink-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h2 className="text-xl font-semibold text-pink-600">
                {editing ? "Edit Banner" : "Add New Banner"}
              </h2>
              <button type="button" onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4 overflow-y-auto flex-1">
              <UploadImage
                label={formData.position === "hero" ? "Hero Banner Image" : "Side Banner Image"}
                hint={formData.position === "hero" ? "3:1 · 1800×600 px" : "4:5 · 400×500 px"}
                value={formData.image ? { url: formData.image, publicId: "" } : null}
                onChange={(v: UploadValue) =>
                  setFormData((s) => ({ ...s, image: v?.url || "" }))
                }
                disabled={creating || updating}
              />

              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(s => ({ ...s, title: e.target.value }))}
                  placeholder="Enter title"
                  className="w-full px-4 py-2 rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(s => ({ ...s, status: e.target.value as "ACTIVE" | "HIDDEN" }))}
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>
                {!lockedPosition && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Position</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData(s => ({ ...s, position: e.target.value as "hero" | "side" }))}
                      className="w-full px-4 py-2 rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                    >
                      <option value="hero">Hero</option>
                      <option value="side">Side</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Sort Order
                    <span className="ml-1 text-xs text-gray-400 font-normal">({formData.position === "side" ? "0=upper, 1=lower" : "0, 1, 2…"})</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.sort}
                    onChange={(e) => setFormData(s => ({ ...s, sort: Number(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                  />
                </div>
              </div>

              {formData.position === "side" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Link to Category <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={formData.categorySlug}
                    onChange={(e) => setFormData(s => ({ ...s, categorySlug: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-100 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                  >
                    <option value="">— Select a category —</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white hover:from-cyan-300 hover:to-cyan-700 font-semibold shadow hover:shadow-lg transition disabled:opacity-50"
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