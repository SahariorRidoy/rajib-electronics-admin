"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Search,
  Eye,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Package,
  User,
  Phone,
  Calendar,
  Trash2,
  FileText,
  Printer,
  ArrowLeft,
  Ban,
} from "lucide-react";
import Image from "@/lib/image";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";
import PrintSettings, { PrintSize } from "@/components/PrintSettings";

import {
  useListOrdersQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
} from "@/services/orders.api";
import { useGetProductByIdQuery } from "@/services/products.api";
import { useProcessReturnMutation } from "@/services/returns.api";
import type { Order, OrderStatus } from "@/types/order";

/** date → bn-BD */
const bnDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";


const STATUS_UI: Record<
  OrderStatus,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { label: string; bg: string; text: string; Icon: React.ComponentType<any> }
> = {
  PENDING: {
    label: "Pending",
    bg: "bg-amber-100",
    text: "text-amber-700",
    Icon: Clock,
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-100",
    text: "text-blue-700",
    Icon: AlertCircle,
  },
  IN_SHIPPING: {
    label: "In Shipping",
    bg: "bg-purple-100",
    text: "text-purple-700",
    Icon: AlertCircle,
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    Icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-100",
    text: "text-red-700",
    Icon: XCircle,
  },
  RETURNED: {
    label: "Returned",
    bg: "bg-orange-100",
    text: "text-orange-700",
    Icon: Package,
  },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_UI[status];
  if (!s) return <span className="text-xs text-gray-500">{status}</span>;
  const I = s.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <I className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      <span className="hidden xs:inline">{s.label}</span>
    </span>
  );
}

function OrderLineItem({ line }: { line: { productId: string; qty: number; title: string; price: number; image?: string; color?: string } }) {
  const { data: productData } = useGetProductByIdQuery(line.productId);
  const product = productData?.data;
  
  const title = product?.title || line.title || "Product";
  const price = product?.price || line.price || 0;
  const image = product?.images?.[0] || product?.image || line.image;

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
      {image ? (
        <Image
          src={image}
          alt={title}
          width={320}
          height={240}
          sizes="(max-width: 768px) 64px, 80px"
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
      ) : (
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-pink-100 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-800 line-clamp-1 text-xs sm:text-sm">
          {title}
        </h4>
        {line.color && (
          <p className="text-xs text-gray-500">Color: <span className="font-medium text-gray-700">{line.color}</span></p>
        )}
        <p className="text-xs text-gray-600">
          ৳{price} × {line.qty}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm sm:text-base lg:text-lg font-bold text-pink-600">
          ৳{price * line.qty}
        </p>
      </div>
    </div>
  );
}

function ReturnLineItem({ line, onAdd, disabled }: { line: { productId: string; qty: number; title: string; price: number; image?: string }; onAdd: (title: string, image?: string) => void; disabled: boolean }) {
  const { data: productData } = useGetProductByIdQuery(line.productId);
  const product = productData?.data;
  
  const title = product?.title || line.title || "Product";
  const image = product?.images?.[0] || product?.image || line.image;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
      {image ? (
        <Image src={image} alt={title} width={48} height={48} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-pink-100 flex-shrink-0" />
      )}
      <span className="flex-1 text-sm text-gray-700">{title} (Qty: {line.qty})</span>
      <button
        onClick={() => onAdd(title, image)}
        disabled={disabled}
        className="px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-semibold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Add
      </button>
    </div>
  );
}

function ReturnItemDisplay({ item, index, onUpdate, onRemove }: { item: { productId: string; title: string; maxQty: number; qty: number; image?: string }; index: number; onUpdate: (index: number, value: string | number) => void; onRemove: (index: number) => void }) {
  const { data: productData } = useGetProductByIdQuery(item.productId);
  const product = productData?.data;
  
  const title = product?.title || item.title || "Product";
  const image = product?.images?.[0] || product?.image || item.image;

  return (
    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
      <div className="flex items-center gap-3 mb-2">
        {image ? (
          <Image src={image} alt={title} width={48} height={48} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-pink-100 flex-shrink-0" />
        )}
        <span className="flex-1 text-sm font-semibold text-gray-800">{title}</span>
        <button onClick={() => onRemove(index)} className="text-red-600 hover:text-red-700">
          <X className="w-4 h-4" />
        </button>
      </div>
      <input
        type="number"
        min="1"
        max={item.maxQty}
        value={item.qty}
        onChange={(e) => onUpdate(index, e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        placeholder="Quantity"
      />
    </div>
  );
}


function Confirm({
  open,
  title,
  subtitle,
  confirmLabel = "Confirm",
  tone = "primary",
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  const btnClass =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : "bg-pink-600 hover:bg-pink-700 focus:ring-pink-500";
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-pink-100">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex gap-3 p-4 sm:p-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-pink-200 text-gray-700 font-medium hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-white font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition text-sm ${btnClass}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  /** local UI state */
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selected, setSelected] = useState<Order | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);

  /** destructive confirms */
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState<Array<{ productId: string; title: string; maxQty: number; qty: number; image?: string }>>([]);
  const [returnReason, setReturnReason] = useState("");
  const [returnNotes, setReturnNotes] = useState("");

  /** RTK Query calls */
  const { data, isLoading, isFetching, error } = useListOrdersQuery({
    page,
    limit,
    status: (statusFilter as Order["status"]) || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const [doUpdate, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [doDelete, { isLoading: isDeleting }] = useDeleteOrderMutation();
  const [processReturn, { isLoading: isProcessingReturn }] = useProcessReturnMutation();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items: Order[] = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  /** client-side search */
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return items;
    return items.filter(
      (o) =>
        o._id.toLowerCase().includes(ql) ||
        o.customer?.name?.toLowerCase().includes(ql)
    );
  }, [items, q]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const askStatusChange = (s: OrderStatus) => {
    if (s === "DELIVERED" || s === "CANCELLED") setPendingStatus(s);
    else doStatusChange(s);
  };

  const doStatusChange = async (s: OrderStatus) => {
    if (!selected) return;
    try {
      await doUpdate({ id: selected._id, body: { status: s } }).unwrap();
      toast.success(`Status updated to "${STATUS_UI[s].label}"`);
      setSelected({ ...selected, status: s });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(String(e?.data?.message || e?.data?.code || "Update failed"));
      console.error(e);
    } finally {
      setPendingStatus(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await doDelete(pendingDelete).unwrap();
      toast.success("Order deleted");
      setPendingDelete(null);
      setOpenDetails(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(String(e?.data?.message || e?.data?.code || "Delete failed"));
      
      console.error(e);
    }
  };

  const openReturnModal = () => {
    if (!selected) return;
    setReturnItems([]);
    setReturnReason("");
    setReturnNotes("");
    setShowReturnModal(true);
  };

  const addReturnItem = (productId: string, title: string, qty: number, image?: string) => {
    setReturnItems([...returnItems, { productId, title, maxQty: qty, qty: 1, image }]);
  };

  const addAllItems = () => {
    if (!selected) return;
    const allItems = selected.lines.map(line => ({ 
      productId: line.productId, 
      title: line.title, 
      maxQty: line.qty, 
      qty: line.qty, 
      image: line.image 
    }));
    setReturnItems(allItems);
  };

  const updateReturnItem = (index: number, value: string | number) => {
    const updated = [...returnItems];
    updated[index].qty = Number(value);
    setReturnItems(updated);
  };

  const removeReturnItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const submitReturn = async () => {
    if (!selected || returnItems.length === 0 || !returnReason.trim()) return;
    try {
      await processReturn({
        orderId: selected._id,
        reason: returnReason,
        items: returnItems.map(item => ({ productId: item.productId, quantity: item.qty })),
        notes: returnNotes || undefined,
      }).unwrap();
      toast.success("Return processed successfully!");
      setShowReturnModal(false);
      setOpenDetails(false);
      setReturnItems([]);
      setReturnReason("");
      setReturnNotes("");
      window.location.reload();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(String(e?.data?.message || e?.data?.code || "Return failed"));
      console.error(e);
    }
  };

  const handlePrintClick = (orderId: string) => {
    setPrintOrderId(orderId);
    setShowPrintSettings(true);
  };

  const handlePrint = (size: PrintSize) => {
    if (printOrderId) {
      router.push(`/orders/${printOrderId}/invoice?print=true&size=${size}`);
    }
  };

  /** skeleton */
  const Skeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 animate-pulse">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="h-5 bg-pink-100 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="h-4 bg-pink-100 rounded" />
          <div className="h-4 bg-pink-100 rounded" />
          <div className="h-4 bg-pink-100 rounded" />
        </div>
        <div className="h-4 bg-pink-100 rounded w-1/2" />
      </div>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" />
      
      <PrintSettings
        open={showPrintSettings}
        onClose={() => {
          setShowPrintSettings(false);
          setPrintOrderId(null);
        }}
        onPrint={handlePrint}
      />

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-16">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-pink-200 text-gray-700 hover:bg-pink-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#167389] to-[#167389] mb-2 flex items-center gap-2 sm:gap-3">
              <ClipboardList className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-[#167389]" />
              Orders
              {!isLoading && <span className="text-lg sm:text-xl text-gray-600">({total})</span>}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View & manage customer orders from your database
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black" />
                <input
                  type="text"
                  placeholder="Search by order ID or customer..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition text-sm sm:text-base"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as OrderStatus | "");
                  setPage(1);
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-[#167389] focus:outline-none focus:ring-2 text-[#167389] focus:ring-pink-300 focus:border-pink-400 transition md:w-64 text-sm sm:text-base"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_SHIPPING">In Shipping</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RETURNED">Returned</option>
              </select>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setStartDate(today);
                  setEndDate(today);
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#167389] text-white font-semibold hover:bg-pink-700 transition text-sm sm:text-base whitespace-nowrap"
              >
                Today
              </button>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition text-sm sm:text-base"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition text-sm sm:text-base"
                placeholder="End Date"
              />
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-red-50 text-red-700 border border-red-200 font-semibold hover:bg-red-100 transition text-sm sm:text-base whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          </div>

          {/* List */}
          {isLoading || isFetching ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm sm:text-base text-red-700">
                Failed to load orders. Please try again.
              </p>
            </div>
          ) : filtered.length ? (
            <div className="space-y-4">
              {filtered.map((o) => (
                <div
                  key={o._id}
                  className="bg-white rounded-2xl shadow-sm border border-pink-100 hover:shadow-md transition"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#167389] break-all">
                            {o._id}
                          </h3>
                          <StatusBadge status={o.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-700 truncate">
                              {o.customer.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-700">
                              {o.customer.phone}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-700 truncate">
                              {bnDate(o.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Amount + actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-gray-500 mb-1">
                            Grand Total
                          </p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#167389]">
                            ৳{o.totals.grandTotal}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/orders/${o._id}/invoice`}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 border border-blue-200 transition text-xs sm:text-sm"
                            title="Invoice"
                          >
                            <span>Invoice</span>
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Link>
                          <button
                            onClick={() => handlePrintClick(o._id)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-green-50 text-green-700 font-semibold hover:bg-green-100 border border-green-200 transition text-xs sm:text-sm"
                            title="Print"
                          >
                            <span>Print</span>
                            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelected(o);
                              setOpenDetails(true);
                            }}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#167389] text-white font-semibold hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition text-xs sm:text-sm"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span> Order Details</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Summary line */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                        <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {o.lines.length} item{o.lines.length > 1 ? "s" : ""} •
                        Subtotal ৳{o.totals.subTotal} • Shipping ৳
                        {o.totals.shipping}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Showing <span className="font-semibold">{(page - 1) * limit + 1}</span> to{" "}
                    <span className="font-semibold">{Math.min(page * limit, total)}</span> of{" "}
                    <span className="font-semibold">{total}</span> orders
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 sm:px-4 py-2 rounded-xl border border-pink-200 text-gray-700 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>
                    <span className="text-xs sm:text-sm text-gray-600 font-semibold">
                      {page}/{totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3 sm:px-4 py-2 rounded-xl border border-pink-200 text-gray-700 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-8 sm:p-12 text-center">
              <ClipboardList className="w-12 h-12 sm:w-16 sm:h-16 text-pink-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Try adjusting your filters or search
              </p>
            </div>
          )}
        </div>

        {/* Details modal */}
        {openDetails && selected && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl my-8 border border-pink-100 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-pink-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl sm:rounded-t-3xl z-10">
                <div className="flex-1 min-w-0 pr-2">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    Order Details
                  </h2>
                  <p className="text-xs sm:text-sm text-pink-600 break-all">
                    {selected._id}
                  </p>
                </div>
                <button
                  onClick={() => setOpenDetails(false)}
                  className="p-2 hover:bg-pink-50 rounded-xl transition flex-shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Customer */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-pink-100">
                  <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                    Customer
                  </h3>
                  <div className="grid gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex justify-start gap-3">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold text-gray-800">
                        {selected.customer.name}
                      </span>
                    </div>
                    <div className="flex justify-start gap-3">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold text-gray-800">
                        {selected.customer.phone}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-600">Address: <span className="font-semibold text-gray-800">
                        {[selected.customer.houseOrVillage, selected.customer.roadOrPostOffice, selected.customer.blockOrThana, selected.customer.district].filter(Boolean).join(", ") || "N/A"}
                      </span></span>
                    </div>
                  </div>
                </div>

                {/* Lines */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                    Items
                  </h3>
                  <div className="space-y-3">
                    {selected.lines.map((l, idx) => (
                      <OrderLineItem key={`${l.productId}-${idx}`} line={l} />
                    ))}
                  </div>
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-pink-200 space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">
                        ৳{selected.totals.subTotal}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-semibold">
                        ৳{selected.totals.shipping}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base pt-2 border-t border-pink-100">
                      <span className="font-bold text-gray-800">
                        Grand Total
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-pink-600">
                        ৳{selected.totals.grandTotal}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Update Status */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-pink-100">
                  <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                    Update Status
                  </h3>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-xs sm:text-sm text-gray-600">
                      Current:
                    </span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    {(
                      [
                        "PENDING",
                        "IN_PROGRESS",
                        "IN_SHIPPING",
                        "DELIVERED",
                        "CANCELLED",
                        "RETURNED",
                      ] as OrderStatus[]
                    ).map((s) => {
                      const disabled = selected.status === s || selected.status === "RETURNED" || s === "RETURNED" || isUpdating;
                      const isCurrentStatus = selected.status === s;
                      const base =
                        "px-2 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3 rounded-xl text-xs sm:text-sm font-semibold transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border relative";
                      const active =
                        isCurrentStatus && s === "RETURNED"
                          ? "bg-orange-200 text-orange-800 border-orange-300 cursor-not-allowed"
                          : "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed";
                      const ready =
                        "bg-white border-pink-200 text-pink-700 hover:bg-pink-100";
                      const returnedBtn = s === "RETURNED" ? " cursor-not-allowed" : "";
                      const Icon = STATUS_UI[s].Icon;
                      return (
                        <button
                          key={s}
                          onClick={() => askStatusChange(s)}
                          disabled={disabled}
                          className={`${base} ${disabled ? (s === "RETURNED" && !isCurrentStatus ? returnedBtn : active) : ready}`}
                        >
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {s === "RETURNED" && <Ban className="w-3 h-3 absolute top-1 right-1" />}
                          <span className="text-[10px] sm:text-xs lg:text-sm">
                            {STATUS_UI[s].label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {isUpdating && (
                    <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-pink-600">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span className="text-xs sm:text-sm font-medium">
                        Updating...
                      </span>
                    </div>
                  )}
                </div>

                {/* Delete order */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={openReturnModal}
                    disabled={selected.status === "RETURNED"}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 font-semibold transition text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Process Return
                  </button>
                  <button
                    onClick={() => setPendingDelete(selected._id)}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 font-semibold transition text-xs sm:text-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Delete Order
                  </button>
                </div>
              </div>
            </div>

            {/* Final confirms */}
            <Confirm
              open={!!pendingStatus}
              title={
                pendingStatus === "CANCELLED"
                  ? "Cancel this order?"
                  : pendingStatus === "DELIVERED"
                  ? "Mark as delivered?"
                  : "Change status?"
              }
              subtitle={
                pendingStatus === "CANCELLED"
                  ? "The order will be marked as CANCELLED."
                  : pendingStatus === "DELIVERED"
                  ? "The order will be marked as DELIVERED."
                  : undefined
              }
              confirmLabel={
                pendingStatus === "CANCELLED"
                  ? "Yes, cancel"
                  : pendingStatus === "DELIVERED"
                  ? "Yes, deliver"
                  : "Confirm"
              }
              tone={pendingStatus === "CANCELLED" ? "danger" : "primary"}
              loading={isUpdating}
              onCancel={() => setPendingStatus(null)}
              onConfirm={() => pendingStatus && doStatusChange(pendingStatus)}
            />

            <Confirm
              open={!!pendingDelete}
              title="Delete this order?"
              subtitle="This action cannot be undone."
              confirmLabel="Delete"
              tone="danger"
              loading={isDeleting}
              onCancel={() => setPendingDelete(null)}
              onConfirm={confirmDelete}
            />
          </div>
        )}

        {/* Return Modal */}
        {showReturnModal && selected && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border border-pink-100 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-pink-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl z-10">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Process Return</h2>
                <button onClick={() => setShowReturnModal(false)} className="p-2 hover:bg-pink-50 rounded-xl transition">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {/* Return Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Return Reason *</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    required
                  >
                    <option value="">Select reason</option>
                    <option value="Defective product">Defective product</option>
                    <option value="Wrong item sent">Wrong item sent</option>
                    <option value="Customer changed mind">Customer changed mind</option>
                    <option value="Damaged in shipping">Damaged in shipping</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Order Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800">Order Items:</h3>
                    <button
                      onClick={addAllItems}
                      className="px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-semibold hover:bg-pink-700 transition"
                    >
                      Return All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selected.lines.map((line, idx) => (
                      <ReturnLineItem 
                        key={idx} 
                        line={line} 
                        onAdd={(title, image) => addReturnItem(line.productId, title, line.qty, image)}
                        disabled={returnItems.some(r => r.productId === line.productId)}
                      />
                    ))}
                  </div>
                </div>

                {/* Return Items */}
                {returnItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Items to Return:</h3>
                    <div className="space-y-3">
                      {returnItems.map((item, idx) => (
                        <ReturnItemDisplay
                          key={idx}
                          item={item}
                          index={idx}
                          onUpdate={updateReturnItem}
                          onRemove={removeReturnItem}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
                  <textarea
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    rows={3}
                    placeholder="Enter any additional notes..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowReturnModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-pink-200 text-gray-700 font-medium hover:bg-pink-50 transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReturn}
                    disabled={returnItems.length === 0 || !returnReason.trim() || isProcessingReturn}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition text-sm"
                  >
                    {isProcessingReturn && <Loader2 className="w-4 h-4 animate-spin" />}
                    Process Return
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
