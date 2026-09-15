"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Plus, Edit2, Trash2, Pause, Play, BarChart2,
  Search, X, Check, Loader2, AlertCircle, ArrowLeft, Clock,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import {
  useListFlashSalesQuery,
  useCreateFlashSaleMutation,
  useUpdateFlashSaleMutation,
  useTogglePauseFlashSaleMutation,
  useDeleteFlashSaleMutation,
  useGetFlashSaleStatsQuery,
  type FlashSale,
  type CreateFlashSaleDTO,
} from "@/services/flashsale.api";
import { useListProductsQuery } from "@/services/products.api";

// ── helpers ──────────────────────────────────────────────────────────────────

function toLocalDateTimeInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusBadge(status: FlashSale["status"]) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 border-green-200",
    SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
    PAUSED: "bg-yellow-100 text-yellow-700 border-yellow-200",
    ENDED: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] ?? map.ENDED}`}>
      {status}
    </span>
  );
}

// ── Stats modal ───────────────────────────────────────────────────────────────

function StatsModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useGetFlashSaleStatsQuery(id);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#167389]" /> Sale Stats
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#167389]" /></div>
        ) : data ? (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-xl font-bold text-green-700">৳{data.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Units Sold</p>
                <p className="text-xl font-bold text-blue-700">{data.totalSold}</p>
              </div>
            </div>
            <div className="space-y-2">
              {data.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.title} className="w-10 h-10 object-contain rounded-lg bg-white border" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">৳{item.salePrice} · {item.soldQty}/{item.saleQty} sold</p>
                  </div>
                  <p className="text-sm font-bold text-green-700 shrink-0">৳{item.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Product picker row ────────────────────────────────────────────────────────

type SelectedItem = { productId: string; title: string; image: string; regularPrice: number; salePrice: number; saleQty: number };

function ProductPicker({
  selected,
  onChange,
}: {
  selected: SelectedItem[];
  onChange: (items: SelectedItem[]) => void;
}) {
  const [search, setSearch] = useState("");
  const { data: productsData } = useListProductsQuery({ q: search });
  type ProductItem = { _id: string; title: string; price: number; images?: string[]; image?: string };
  const products: ProductItem[] = productsData?.data?.items ?? productsData?.data ?? productsData?.items ?? [];

  const selectedIds = new Set(selected.map((s) => s.productId));

  const toggle = (p: ProductItem) => {
    if (selectedIds.has(p._id)) {
      onChange(selected.filter((s) => s.productId !== p._id));
    } else {
      onChange([...selected, { productId: p._id, title: p.title, image: p.images?.[0] ?? p.image ?? "", regularPrice: p.price, salePrice: p.price, saleQty: 10 }]);
    }
  };

  const updateItem = (productId: string, field: "salePrice" | "saleQty", value: number) => {
    onChange(selected.map((s) => s.productId === productId ? { ...s, [field]: value } : s));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to add..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#167389]/30"
        />
      </div>

      {/* Search results */}
      {search && products.length > 0 && (
        <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100">
          {products.slice(0, 10).map((p: ProductItem) => (
            <button
              key={p._id}
              type="button"
              onClick={() => toggle(p)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition ${selectedIds.has(p._id) ? "bg-cyan-50" : ""}`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selectedIds.has(p._id) ? "bg-[#167389] border-[#167389]" : "border-gray-300"}`}>
                {selectedIds.has(p._id) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-gray-800 flex-1 truncate">{p.title}</span>
              <span className="text-xs text-gray-500 shrink-0">৳{p.price}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected items with price/qty inputs */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selected Products</p>
          {selected.map((item) => (
            <div key={item.productId} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.title} className="w-8 h-8 object-contain rounded-lg bg-white border shrink-0" />
                )}
                <p className="text-sm font-semibold text-gray-800 truncate flex-1 mx-2">{item.title}</p>
                <button type="button" onClick={() => onChange(selected.filter((s) => s.productId !== item.productId))}>
                  <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-gray-500 mb-1">Regular ৳</p>
                  <p className="font-semibold text-gray-700">{item.regularPrice}</p>
                </div>
                <div>
                  <label className="text-gray-500 mb-1 block">Sale Price ৳</label>
                  <input
                    type="number"
                    min={0}
                    value={item.salePrice}
                    onChange={(e) => updateItem(item.productId, "salePrice", Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#167389]/40 text-sm"
                  />
                </div>
                <div>
                  <label className="text-gray-500 mb-1 block">Sale Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={item.saleQty}
                    onChange={(e) => updateItem(item.productId, "saleQty", Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#167389]/40 text-sm"
                  />
                </div>
              </div>
              {item.salePrice < item.regularPrice && (
                <p className="text-xs text-green-600 font-semibold">
                  {Math.round(((item.regularPrice - item.salePrice) / item.regularPrice) * 100)}% OFF
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "", description: "",
  startAt: "", endAt: "",
};

export default function FlashSalesPage() {
  const router = useRouter();
  const { data: sales = [], isLoading, error } = useListFlashSalesQuery();
  const [createFlashSale, { isLoading: isCreating }] = useCreateFlashSaleMutation();
  const [updateFlashSale, { isLoading: isUpdating }] = useUpdateFlashSaleMutation();
  const [togglePause] = useTogglePauseFlashSaleMutation();
  const [deleteFlashSale, { isLoading: isDeleting }] = useDeleteFlashSaleMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statsId, setStatsId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const isSaving = isCreating || isUpdating;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSelectedItems([]);
    setIsModalOpen(true);
  };

  const openEdit = (sale: FlashSale) => {
    setEditingId(sale._id);
    setForm({
      title: sale.title,
      description: sale.description ?? "",
      startAt: toLocalDateTimeInput(sale.startAt),
      endAt: toLocalDateTimeInput(sale.endAt),
    });
    setSelectedItems(
      sale.items.map((i) => ({
        productId: i.productId,
        title: i.title,
        image: i.image,
        regularPrice: i.regularPrice,
        salePrice: i.salePrice,
        saleQty: i.saleQty,
      }))
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    const dto: CreateFlashSaleDTO = {
      title: form.title,
      description: form.description || undefined,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      items: selectedItems.map((i) => ({
        productId: i.productId,
        salePrice: i.salePrice,
        saleQty: i.saleQty,
      })),
    };
    try {
      if (editingId) {
        await updateFlashSale({ id: editingId, ...dto }).unwrap();
        toast.success("Flash sale updated!");
      } else {
        await createFlashSale(dto).unwrap();
        toast.success("Flash sale created!");
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Failed to save flash sale");
    }
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({ ...prev, title }));
  };

  const handlePause = async (id: string) => {
    try {
      await togglePause(id).unwrap();
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteFlashSale(confirmDeleteId).unwrap();
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const sortedSales = useMemo(() =>
    [...sales].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    [sales]
  );

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 mt-16">

          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-[#167389] flex items-center gap-3">
              <Zap className="w-8 h-8 text-orange-500" /> Flash Sales
            </h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage time-limited flash sales</p>
          </div>

          {/* Actions bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 mb-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">{sales.length} total sales</p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#125f73] transition shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" /> Create Flash Sale
            </button>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#167389]" /></div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">Failed to load flash sales.</p>
            </div>
          ) : sortedSales.length === 0 ? (
            <div className="bg-white rounded-2xl border border-orange-100 p-12 text-center">
              <Zap className="w-12 h-12 text-orange-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">No flash sales yet</h3>
              <p className="text-sm text-gray-500 mb-4">Create your first flash sale to boost sales</p>
              <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#167389] text-white font-semibold text-sm">
                <Plus className="w-4 h-4" /> Create Flash Sale
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSales.map((sale) => (
                <div key={sale._id} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{sale.title}</h3>
                      {statusBadge(sale.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(sale.startAt).toLocaleString()} → {new Date(sale.endAt).toLocaleString()}
                      </span>
                      <span>{sale.items.length} products</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setStatsId(sale._id)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                      title="Stats"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePause(sale._id)}
                      className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition"
                      title={sale.status === "PAUSED" ? "Resume" : "Pause"}
                    >
                      {sale.status === "PAUSED" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(sale)}
                      className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(sale._id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex justify-between items-center rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Flash Sale" : "Create Flash Sale"}
              </h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Weekend Gadget Sale"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#167389]/30 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Limited-time deals on selected gadgets..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#167389]/30 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date & Time *</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#167389]/30 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Date & Time *</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#167389]/30 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Products *</label>
                <ProductPicker selected={selectedItems} onChange={setSelectedItems} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#125f73] disabled:opacity-50 inline-flex items-center justify-center gap-2 transition text-sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {statsId && <StatsModal id={statsId} onClose={() => setStatsId(null)} />}

      {/* Delete Confirm */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete flash sale?</h3>
            <p className="text-sm text-gray-500 mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 text-sm"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
