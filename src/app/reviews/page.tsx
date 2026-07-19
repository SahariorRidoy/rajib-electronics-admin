"use client";

import { useState, useRef, useEffect } from "react";
import {
  Star,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MessageSquare,
  X,
  Search,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  useListReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  type Review,
} from "@/services/reviews.api";
import { useListProductsQuery } from "@/services/products.api";
import UploadImage, { type UploadValue } from "@/components/UploadImage";

const STARS = [1, 2, 3, 4, 5];

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {STARS.map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {STARS.map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              s <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ProductSearchPicker({
  value,
  onChange,
}: {
  value: { slug: string; title: string; image?: string } | null;
  onChange: (v: { slug: string; title: string; image?: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useListProductsQuery(
    { q: debouncedQ, page: 1 },
    { skip: !open }
  );

  const products: { _id: string; slug: string; title: string; image?: string }[] =
    data?.data?.items ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm bg-white text-left"
      >
        {value ? (
          <div className="flex items-center gap-2 min-w-0">
            {value.image && (
              <div className="relative w-6 h-6 rounded flex-shrink-0 overflow-hidden">
                <Image src={value.image} alt={value.title} fill sizes="24px" className="object-cover" />
              </div>
            )}
            <span className="truncate font-medium text-gray-900">{value.title}</span>
            <span className="text-xs text-gray-400 font-mono flex-shrink-0">{value.slug}</span>
          </div>
        ) : (
          <span className="text-gray-400">Search and select a product...</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-pink-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-pink-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type product name..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {isFetching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-[#167389]" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No products found</p>
            ) : (
              products.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => { onChange({ slug: p.slug, title: p.title, image: p.image }); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50 transition text-left"
                >
                  {p.image ? (
                    <div className="relative w-8 h-8 rounded flex-shrink-0 overflow-hidden">
                      <Image src={p.image} alt={p.title} fill sizes="32px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{p.slug}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_CONFIG = {
  active: { label: "Active", icon: CheckCircle, cls: "bg-green-50 text-green-700 border-green-200" },
  pending: { label: "Pending", icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200" },
  inactive: { label: "Inactive", icon: XCircle, cls: "bg-red-50 text-red-700 border-red-200" },
};

export default function ReviewsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const [slugFilter, setSlugFilter] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [form, setForm] = useState({ productSlug: "", name: "", message: "", rating: 5 });
  const [selectedProduct, setSelectedProduct] = useState<{ slug: string; title: string; image?: string } | null>(null);
  const [reviewImage, setReviewImage] = useState<UploadValue>(null);

  const { data, isLoading, isFetching } = useListReviewsQuery({
    status: statusFilter || undefined,
    productSlug: slugFilter || undefined,
    page,
  });

  const [createReview, { isLoading: isCreating }] = useCreateReviewMutation();
  const [updateReview] = useUpdateReviewMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  const reviews: Review[] = data?.data?.reviews ?? [];
  const pagination = data?.data;

  const handleStatusChange = async (id: string, status: Review["status"]) => {
    try {
      await updateReview({ id, status }).unwrap();
      toast.success(`Review marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteReview(confirmId).unwrap();
      toast.success("Review deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setConfirmId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productSlug.trim() || !form.name.trim() || !form.message.trim()) {
      toast.error("Product slug, name and message are required");
      return;
    }
    try {
      await createReview({ ...form, image: reviewImage?.url || "" }).unwrap();
      toast.success("Review created successfully!");
      setShowModal(false);
      setForm({ productSlug: "", name: "", message: "", rating: 5 });
      setSelectedProduct(null);
      setReviewImage(null);
    } catch {
      toast.error("Failed to create review");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 mt-16">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-teal-800 text-gray-700 hover:bg-pink-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#167389] flex items-center gap-2">
            <MessageSquare className="w-7 h-7" />
            Reviews Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">Approve, manage and add product reviews</p>
        </div>

        {/* Filters + Add */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-pink-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
              <input
                placeholder="Filter by product slug..."
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setSlugFilter(slugInput); setPage(1); } }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
              />
            </div>
            <button
              onClick={() => { setSlugFilter(slugInput); setPage(1); }}
              className="px-4 py-2.5 rounded-xl bg-[#167389] text-white text-sm font-medium hover:bg-[#125f73] transition"
            >
              Search
            </button>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#167389] text-white font-semibold text-sm hover:bg-[#125f73] transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Review
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#167389]" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No reviews found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Reviewer</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Rating</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Message</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reviews.map((r) => {
                    const sc = STATUS_CONFIG[r.status];
                    const Icon = sc.icon;
                    return (
                      <tr key={r._id} className="hover:bg-gray-50/50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {r.image ? (
                              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                <Image src={r.image} alt={r.name} fill sizes="32px" className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#167389]/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-[#167389] font-bold text-xs">{r.name[0]?.toUpperCase()}</span>
                              </div>
                            )}
                            <span className="font-medium text-gray-900 whitespace-nowrap">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{r.productSlug}</span>
                        </td>
                        <td className="px-4 py-3">
                          <StarDisplay rating={r.rating} />
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-gray-600 line-clamp-2 text-xs">{r.message}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.cls}`}>
                            <Icon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {r.status !== "active" && (
                              <button
                                onClick={() => handleStatusChange(r._id, "active")}
                                title="Approve"
                                className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {r.status !== "inactive" && (
                              <button
                                onClick={() => handleStatusChange(r._id, "inactive")}
                                title="Deactivate"
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmId(r._id)}
                              title="Delete"
                              className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-pink-200 text-gray-700 hover:bg-pink-50 disabled:opacity-50 transition"
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">Page {page} of {pagination.pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1.5 text-sm rounded-lg border border-pink-200 text-gray-700 hover:bg-pink-50 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-pink-100 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-pink-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">Add Review</h2>
              <button onClick={() => { setShowModal(false); setSelectedProduct(null); setForm({ productSlug: "", name: "", message: "", rating: 5 }); setReviewImage(null); }} className="p-1.5 hover:bg-pink-50 rounded-lg transition">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product *</label>
                <ProductSearchPicker
                  value={selectedProduct}
                  onChange={(p) => { setSelectedProduct(p); setForm((f) => ({ ...f, productSlug: p.slug })); }}
                />
                {selectedProduct && (
                  <p className="text-xs text-gray-400 font-mono mt-1">slug: {selectedProduct.slug}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reviewer Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Customer name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reviewer Photo (Optional)</label>
                <UploadImage
                  label=""
                  value={reviewImage}
                  onChange={setReviewImage}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rating *</label>
                <StarPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Review Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  placeholder="Write the review message..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setSelectedProduct(null); setForm({ productSlug: "", name: "", message: "", rating: 5 }); setReviewImage(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#125f73] disabled:opacity-50 inline-flex items-center justify-center gap-2 transition"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmId && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-pink-100 p-5">
            <h3 className="text-lg font-semibold text-gray-900">Delete this review?</h3>
            <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
