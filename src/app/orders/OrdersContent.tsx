"use client";

import { useEffect, useState } from "react";
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
  Pencil,
  Copy,
  PhoneCall,
  StickyNote,
  Plus,
  MapPin,
} from "lucide-react";
import Image from "@/lib/image";
import Link from "next/link";
import { Toaster, toast } from "react-hot-toast";
import PrintSettings, { PrintSize } from "@/components/PrintSettings";

import {
  useListOrdersQuery,
  useUpdateOrderStatusMutation,
  useUpdateOrderLinesMutation,
  useUpdateOrderDetailsMutation,
  useGetOrderHistoryQuery,
  useDeleteOrderMutation,
  useAddOrderNoteMutation,
  useDeleteOrderNoteMutation,
  useGetOrdersByPhoneQuery,
  useCreateAdminOrderMutation,
} from "@/services/orders.api";
import { useGetDeliverySettingsQuery } from "@/services/delivery.api";
import { useListProductsQuery } from "@/services/products.api";
import { useListNotesQuery } from "@/services/notes.api";
import { useGetProductByIdQuery } from "@/services/products.api";
import { useProcessReturnMutation } from "@/services/returns.api";
import type { Order, OrderEditLog, OrderStatus } from "@/types/order";

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
      <span>{s.label}</span>
    </span>
  );
}

function OrderLineItem({ line, onImageClick }: { line: { productId: string; qty: number; title: string; price: number; image?: string; color?: string }; onImageClick: (src: string) => void }) {
  const { data: productData } = useGetProductByIdQuery(line.productId);
  const product = productData?.data;
  
  const title = product?.title || line.title || "Product";
  const price = line.price || 0;
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
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
          onClick={() => onImageClick(image)}
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
      ) : (
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-pink-100 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">
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


function EditableOrderLineItem({
  line,
  editingPrice,
  onEditPrice,
  onCancelPrice,
  onIncrease,
  onDecrease,
  onRemove,
  onPriceChange,
  onImageClick,
}: {
  line: { productId: string; qty: number; title: string; price: number; image?: string; color?: string };
  editingPrice: boolean;
  onEditPrice: () => void;
  onCancelPrice: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onPriceChange: (price: number) => void;
  onImageClick: (src: string) => void;
}) {
  const { data: productData } = useGetProductByIdQuery(line.productId);
  const product = productData?.data;
  const title = product?.title || line.title || "Product";
  const image = product?.images?.[0] || product?.image || line.image;

  return (
    <div className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
      {/* Top row: image + title/price */}
      <div className="flex items-start gap-3 mb-2">
        {image ? (
          <Image
            src={image}
            alt={title}
            width={56}
            height={56}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
            onClick={() => onImageClick(image)}
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-pink-100 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">{title}</h4>
          {line.color && (
            <p className="text-xs text-gray-500">Color: <span className="font-medium text-gray-700">{line.color}</span></p>
          )}
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {editingPrice ? (
              <>
                <span className="text-xs text-gray-500">৳</span>
                <input
                  type="number"
                  min="0"
                  value={line.price}
                  onChange={(e) => onPriceChange(Number(e.target.value))}
                  className="w-24 px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-300"
                  autoFocus
                />
                <span className="text-xs text-gray-400">each</span>
                <button
                  onClick={onCancelPrice}
                  className="ml-1 px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition"
                >
                  Discard
                </button>
              </>
            ) : (
              <>
                <span className="text-xs text-gray-600 font-medium">৳{line.price} each</span>
                <button onClick={onEditPrice} className="text-[#167389] hover:text-[#0f5567] transition ml-1" title="Edit price">
                  <Pencil className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Bottom row: qty controls + line total */}
      <div className="flex items-center gap-1.5 justify-end">
        <button
          onClick={onDecrease}
          disabled={line.qty <= 1}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pink-100 text-pink-700 font-bold flex items-center justify-center hover:bg-pink-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-base leading-none"
        >
          −
        </button>
        <span className="w-7 sm:w-8 text-center font-bold text-gray-800 text-sm sm:text-base">{line.qty}</span>
        <button
          onClick={onIncrease}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pink-100 text-pink-700 font-bold flex items-center justify-center hover:bg-pink-200 transition text-base leading-none"
        >
          +
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          onClick={onRemove}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 hover:text-red-700 transition"
          title="Remove item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <span className="text-sm sm:text-base font-bold text-pink-600 min-w-[52px] text-right">৳{line.price * line.qty}</span>
      </div>
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

const CHIP_COLORS = [
  "bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100",
  "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
  "bg-green-50 border-green-200 text-green-800 hover:bg-green-100",
  "bg-pink-50 border-pink-200 text-pink-800 hover:bg-pink-100",
  "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100",
  "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100",
];

function SavedNotesPicker({ onPick, defaultOpen = false }: { onPick: (text: string) => void; defaultOpen?: boolean }) {
  const { data } = useListNotesQuery();
  const [open, setOpen] = useState(defaultOpen);
  const notes = data?.data ?? [];
  if (notes.length === 0) return null;
  return (
    <div className="mb-3 rounded-xl border border-yellow-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-yellow-50 hover:bg-yellow-100 transition"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-800">
          <StickyNote className="w-3.5 h-3.5" />
          Saved Notes
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-200 text-yellow-900 text-[10px] font-bold">{notes.length}</span>
        </span>
        <span className="text-[10px] text-yellow-700">{open ? "Hide" : "Pick one"}</span>
      </button>
      {open && (
        <div className="p-2.5 bg-white flex flex-wrap gap-2">
          {notes.map((n, idx) => (
            <button
              key={n._id}
              type="button"
              onClick={() => { onPick(n.text); setOpen(false); }}
              className={`flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition text-left max-w-[220px] ${CHIP_COLORS[idx % CHIP_COLORS.length]}`}
              title={n.text}
            >
              <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-60" />
              <span className="line-clamp-2 leading-snug">{n.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PhoneOrderHistory({ phone, currentOrderId }: { phone: string; currentOrderId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useGetOrdersByPhoneQuery(phone, { skip: !open });
  const orders = (data?.data ?? []).filter((o) => o._id !== currentOrderId);

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    IN_SHIPPING: "bg-purple-100 text-purple-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
    RETURNED: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="border border-blue-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition text-sm font-semibold text-blue-800"
      >
        <span className="flex items-center gap-2">
          🔁 Previous Orders for {phone}
        </span>
        <span className="text-xs text-blue-500">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="border-t border-blue-100 divide-y divide-gray-100">
          {isFetching ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : orders.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">No other orders found.</p>
          ) : (
            orders.map((o) => (
              <div key={o._id} className="px-4 py-3 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono text-gray-500 text-[10px]">{o._id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {o.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>{new Date(o.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}</span>
                  <span className="font-bold text-gray-800">৳{o.grandTotal} · {o.itemCount} item{o.itemCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="text-gray-500 leading-relaxed">
                  {o.lines.map((l, i) => (
                    <span key={i}>{l.title} ×{l.qty}{i < o.lines.length - 1 ? ", " : ""}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const [createOrder, { isLoading }] = useCreateAdminOrderMutation();
  const { data: deliveryData } = useGetDeliverySettingsQuery();
  const settings = deliveryData?.data;

  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: productsData, isFetching: isSearching } = useListProductsQuery(
    { q: debouncedSearch },
    { skip: debouncedSearch.length < 2 }
  );
  const searchResults: { _id: string; title: string; price: number; stock: number; image?: string; images?: string[] }[] =
    productsData?.data?.items ?? productsData?.data ?? [];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(productSearch.trim()), 400);
    return () => clearTimeout(t);
  }, [productSearch]);

  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [deliveryZone, setDeliveryZone] = useState<"inside" | "outside">("outside");
  const [items, setItems] = useState<{ productId: string; title: string; price: number; qty: number; stock: number; image?: string }[]>([]);
  const [notes, setNotes] = useState("");

  const shippingCharge =
    deliveryZone === "inside"
      ? (settings?.insideDhakaCharge ?? 60)
      : (settings?.outsideDhakaCharge ?? 120);
  const subTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const grandTotal = subTotal + shippingCharge;

  const addProduct = (p: { _id: string; title: string; price: number; stock: number; image?: string; images?: string[] }) => {
    if (items.find((i) => i.productId === p._id)) return;
    setItems((prev) => [...prev, { productId: p._id, title: p.title, price: p.price, qty: 1, stock: p.stock, image: p.image || p.images?.[0] }]);
    setProductSearch("");
    setDebouncedSearch("");
  };

  const updateQty = (idx: number, qty: number) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, qty: Math.max(1, Math.min(qty, it.stock)) } : it)));

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      toast.error("Please fill in all customer fields");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    try {
      await createOrder({
        customer,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        deliveryZone,
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success("Order created successfully!");
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to create order");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border border-pink-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-pink-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#167389]" />
            Create Manual Order
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-pink-50 rounded-xl transition">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Customer Info */}
          <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 space-y-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4 text-pink-600" /> Customer Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name *</label>
                <input
                  value={customer.name}
                  onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Customer name"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone *</label>
                <input
                  value={customer.phone}
                  onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Address *</label>
              <textarea
                value={customer.address}
                onChange={(e) => setCustomer((p) => ({ ...p, address: e.target.value }))}
                placeholder="Full delivery address"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
              />
            </div>
          </div>

          {/* Delivery Zone */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-600" /> Delivery Zone
            </h3>
            <select
              value={deliveryZone}
              onChange={(e) => setDeliveryZone(e.target.value as "inside" | "outside")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              <option value="inside">Inside Dhaka — ৳{settings?.insideDhakaCharge ?? 60}</option>
              <option value="outside">Outside Dhaka — ৳{settings?.outsideDhakaCharge ?? 120}</option>
            </select>
          </div>

          {/* Product Search */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-pink-600" /> Add Products
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product by name..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
            </div>
            {/* Search results dropdown */}
            {debouncedSearch.length >= 2 && searchResults.length > 0 && (
              <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => addProduct(p)}
                    disabled={!!items.find((i) => i.productId === p._id) || p.stock === 0}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50 text-left text-sm transition disabled:opacity-40 disabled:cursor-not-allowed border-b border-gray-100 last:border-0"
                  >
                    {(p.image || p.images?.[0]) ? (
                      <Image src={p.image || p.images![0]} alt={p.title} width={32} height={32} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-pink-100 flex-shrink-0 flex items-center justify-center"><Package className="w-3 h-3 text-pink-300" /></div>
                    )}
                    <span className="font-medium text-gray-800 truncate flex-1">{p.title}</span>
                    <span className="ml-3 text-xs text-gray-500 shrink-0">৳{p.price} · Stock: {p.stock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Items */}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} width={40} height={40} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-pink-100 flex-shrink-0 flex items-center justify-center"><Package className="w-4 h-4 text-pink-300" /></div>
                  )}
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">{item.title}</span>
                  <span className="text-xs text-gray-500 shrink-0">৳{item.price}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQty(idx, item.qty - 1)}
                      disabled={item.qty <= 1}
                      className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 font-bold flex items-center justify-center hover:bg-pink-200 disabled:opacity-40 transition"
                    >−</button>
                    <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
                    <button
                      onClick={() => updateQty(idx, item.qty + 1)}
                      disabled={item.qty >= item.stock}
                      className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 font-bold flex items-center justify-center hover:bg-pink-200 disabled:opacity-40 transition"
                    >+</button>
                  </div>
                  <span className="text-sm font-bold text-pink-600 w-16 text-right shrink-0">৳{item.price * item.qty}</span>
                  <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Totals */}
              <div className="mt-2 pt-3 border-t-2 border-pink-200 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span className="font-semibold">৳{subTotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery ({deliveryZone === "inside" ? "Inside Dhaka" : "Outside Dhaka"})</span>
                  <span className="font-semibold">৳{shippingCharge}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-pink-100">
                  <span>Grand Total</span><span className="text-pink-600">৳{grandTotal}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-pink-200 text-gray-700 font-medium hover:bg-pink-50 transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#0f5567] disabled:opacity-50 inline-flex items-center justify-center gap-2 transition text-sm"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  /** local UI state */
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  /** debounce phone input → send to server after 600ms */
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = phoneInput.trim();
      setPhoneSearch(trimmed);
      if (trimmed) setPage(1);
    }, 600);
    return () => clearTimeout(timer);
  }, [phoneInput]);

  const [selected, setSelected] = useState<Order | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);

  /** line item editing */
  const [editLines, setEditLines] = useState<Order["lines"]>([]);
  const [pendingRemoveLine, setPendingRemoveLine] = useState<number | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  /** customer / totals / notes editing */
  const [editCustomer, setEditCustomer] = useState({ name: "", phone: "", address: "" });
  const [editShipping, setEditShipping] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [newNote, setNewNote] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);
  const [editingPriceIdx, setEditingPriceIdx] = useState<number | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  /** destructive confirms */
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingDeleteNote, setPendingDeleteNote] = useState<number | null>(null);
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
    search: phoneSearch || undefined,
  });
  const [doUpdate, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [doUpdateLines, { isLoading: isUpdatingLines }] = useUpdateOrderLinesMutation();
  const [doUpdateDetails, { isLoading: isUpdatingDetails }] = useUpdateOrderDetailsMutation();
  const [doDelete, { isLoading: isDeleting }] = useDeleteOrderMutation();
  const [addNote, { isLoading: isAddingNote }] = useAddOrderNoteMutation();
  const [deleteNote, { isLoading: isDeletingNote }] = useDeleteOrderNoteMutation();
  const { data: historyData, isFetching: isLoadingHistory } = useGetOrderHistoryQuery(
    selected?._id ?? "",
    { skip: !selected || !showHistory }
  );
  const historyLogs: OrderEditLog[] = historyData?.data ?? [];
  const [processReturn, { isLoading: isProcessingReturn }] = useProcessReturnMutation();

  const items: Order[] = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** sync edit lines and reset history panel whenever a different order is opened */
  useEffect(() => {
    if (selected) {
      setEditLines(selected.lines.map((l) => ({ ...l })));
      setEditCustomer({
        name: selected.customer.name,
        phone: selected.customer.phone,
        address: selected.customer.address ?? "",
      });
      setEditShipping(selected.totals.shipping);
      setEditNotes(selected.notes ?? "");
      setNewNote("");
      setShowAddNote(false);
      setEditingCustomer(false);
      setEditingShipping(false);
      setEditingPriceIdx(null);
      setShowHistory(false);
    }
  }, [selected?._id]);

  const canEditLines = selected ? selected.status !== "RETURNED" : false;

  const editSubTotal = editLines.reduce((s, l) => s + l.price * l.qty, 0);
  const editGrandTotal = editSubTotal + editShipping;

  const hasLineChanges =
    editLines.length !== (selected?.lines.length ?? 0) ||
    editLines.some((el, i) => el.qty !== selected?.lines[i]?.qty || el.price !== selected?.lines[i]?.price);

  const hasCustomerChanges = selected
    ? editCustomer.name !== selected.customer.name ||
      editCustomer.phone !== selected.customer.phone ||
      editCustomer.address !== (selected.customer.address ?? "")
    : false;

  const hasShippingChanges = selected ? editShipping !== selected.totals.shipping : false;
  const hasNotesChanges = selected ? editNotes !== (selected.notes ?? "") : false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasDetailsChanges = hasCustomerChanges || hasShippingChanges || hasNotesChanges;

  const increaseLineQty = (idx: number) => {
    setEditLines((prev) => prev.map((l, i) => i === idx ? { ...l, qty: l.qty + 1 } : l));
  };

  const decreaseLineQty = (idx: number) => {
    setEditLines((prev) => prev.map((l, i) => i === idx && l.qty > 1 ? { ...l, qty: l.qty - 1 } : l));
  };

  const changeLinePrice = (idx: number, price: number) => {
    setEditLines((prev) => prev.map((l, i) => i === idx ? { ...l, price } : l));
  };

  const confirmRemoveLine = () => {
    if (pendingRemoveLine === null) return;
    setEditLines((prev) => prev.filter((_, i) => i !== pendingRemoveLine));
    setPendingRemoveLine(null);
  };

  /** compute human-readable diff between original and edited lines */
  const lineDiff = (() => {
    if (!selected) return [];
    const diff: { title: string; from: number; to: number; type: "changed" | "removed" }[] = [];
    for (const orig of selected.lines) {
      const next = editLines.find((l) => l.productId === orig.productId);
      if (!next) diff.push({ title: orig.title, from: orig.qty, to: 0, type: "removed" });
      else if (next.qty !== orig.qty) diff.push({ title: orig.title, from: orig.qty, to: next.qty, type: "changed" });
    }
    return diff;
  })();

  const saveLineChanges = () => {
    if (!selected || !hasLineChanges) return;
    setShowSaveConfirm(true);
  };

  const doSaveLines = async () => {
    if (!selected) return;
    setShowSaveConfirm(false);
    try {
      const result = await doUpdateLines({ id: selected._id, lines: editLines }).unwrap();
      toast.success("Items updated successfully");
      setSelected(result.data);
      setShowHistory(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(String(e?.data?.message || e?.data?.code || "Update failed"));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const doSaveDetails = async () => {
    if (!selected) return;
    try {
      const result = await doUpdateDetails({
        id: selected._id,
        body: {
          customer: editCustomer,
          totals: { subTotal: editSubTotal, shipping: editShipping, grandTotal: editGrandTotal },
          notes: editNotes,
        },
      }).unwrap();
      toast.success("Order details updated");
      setSelected(result.data);
      setEditingCustomer(false);
      setEditingShipping(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(String(e?.data?.message || e?.data?.code || "Update failed"));
    }
  };

  const doSaveCustomer = async () => {
    if (!selected) return;
    try {
      const result = await doUpdateDetails({
        id: selected._id,
        body: { customer: editCustomer },
      }).unwrap();
      toast.success("Customer updated");
      setSelected(result.data);
      setEditingCustomer(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(String(e?.data?.message || e?.data?.code || "Update failed"));
    }
  };

  const doSaveShipping = async () => {
    if (!selected) return;
    try {
      const newSubTotal = editLines.reduce((s, l) => s + l.price * l.qty, 0);
      const result = await doUpdateDetails({
        id: selected._id,
        body: { totals: { subTotal: newSubTotal, shipping: editShipping, grandTotal: newSubTotal + editShipping } },
      }).unwrap();
      toast.success("Shipping updated");
      setSelected(result.data);
      setEditingShipping(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(String(e?.data?.message || e?.data?.code || "Update failed"));
    }
  };

  const doAddNote = async () => {
    if (!selected || !newNote.trim()) return;
    try {
      const result = await addNote({ id: selected._id, text: newNote.trim() }).unwrap();
      toast.success("Note added");
      setSelected(result.data);
      setNewNote("");
      setShowAddNote(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(String(e?.data?.message || "Failed to add note"));
    }
  };

  const doDeleteNote = async () => {
    if (!selected || pendingDeleteNote === null) return;
    try {
      const result = await deleteNote({ id: selected._id, noteIndex: pendingDeleteNote }).unwrap();
      toast.success("Note deleted");
      setSelected(result.data);
      setPendingDeleteNote(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(String(e?.data?.message || "Failed to delete note"));
      setPendingDeleteNote(null);
    }
  };

  const doSaveNotes = async () => {
    if (!selected) return;
    try {
      const result = await doUpdateDetails({
        id: selected._id,
        body: { notes: editNotes },
      }).unwrap();
      toast.success("Notes saved");
      setSelected(result.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(String(e?.data?.message || e?.data?.code || "Update failed"));
    }
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
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#167389] to-[#167389] mb-2 flex items-center gap-2 sm:gap-3">
                  <ClipboardList className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-[#167389]" />
                  Orders
                  {!isLoading && <span className="text-lg sm:text-xl text-gray-600">({total})</span>}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  View & manage customer orders from your database
                </p>
              </div>
              <button
                onClick={() => setShowCreateOrder(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#0f5567] transition text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Order
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-6 mb-6 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center">
              {/* Phone search — left side */}
              <div className="relative flex-1">
                <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#167389]" />
                <input
                  type="tel"
                  placeholder="Search by phone number..."
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-9 py-2.5 sm:py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition text-sm sm:text-base"
                />
                {phoneInput ? (
                  <button
                    onClick={() => { setPhoneInput(""); setPhoneSearch(""); setPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  isFetching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#167389] animate-spin" />
                )}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as OrderStatus | "");
                  setPage(1);
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-[#167389] focus:outline-none focus:ring-2 text-[#167389] focus:ring-pink-300 focus:border-pink-400 transition md:w-52 text-sm sm:text-base"
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
                  setPage(1);
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#0f5567] transition text-sm sm:text-base whitespace-nowrap"
              >
                Today
              </button>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition text-sm sm:text-base"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition text-sm sm:text-base"
              />
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-red-50 text-red-700 border border-red-200 font-semibold hover:bg-red-100 transition text-sm sm:text-base whitespace-nowrap"
              >
                Clear
              </button>
            </div>

            {/* Active search result badge */}
            {phoneSearch && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#167389]/10 rounded-xl border border-[#167389]/20 text-sm text-[#167389]">
                <Search className="w-4 h-4 flex-shrink-0" />
                <span>
                  Phone: <span className="font-semibold">{phoneSearch}</span>
                  {!isFetching && <span className="ml-1 text-gray-500">— {total} order{total !== 1 ? "s" : ""} found</span>}
                </span>
                <button
                  onClick={() => { setPhoneInput(""); setPhoneSearch(""); setPage(1); }}
                  className="ml-auto text-xs text-red-600 hover:underline whitespace-nowrap font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
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
          ) : items.length ? (
            <div className="space-y-4">
              {items.map((o) => (
                <div
                  key={o._id}
                  className="bg-white rounded-2xl shadow-sm border border-pink-100 hover:shadow-md transition"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                          <h3 className="text-sm sm:text-md font-bold text-[#167389] break-all">
                            {o._id}
                          </h3>
                          <StatusBadge status={o.status} />
                          {o.customerFlags?.sameDay && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200" title="Same phone ordered again today">
                              ⚠ Same-Day Duplicate
                            </span>
                          )}
                          {o.customerFlags?.returning && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200" title="This customer has ordered before">
                              🔁 Returning Customer
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-sm sm:text-sm text-gray-600 font-normal">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                            {bnDate(o.createdAt)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm sm:text-base">
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
                            <span className="text-gray-800 font-semibold truncate">
                              {o.customer.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-nowrap">
                            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
                            <span className="text-gray-800 font-bold whitespace-nowrap">{o.customer.phone}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(o.customer.phone); toast.success("Phone number copied!"); }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition text-xs font-medium whitespace-nowrap shrink-0"
                              title="Copy phone number"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                            <a
                              href={`tel:${o.customer.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-400 hover:bg-green-500 text-gray-700 hover:text-gray-900 transition text-xs font-medium whitespace-nowrap shrink-0"
                              title="Call customer"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>Call Now</span>
                            </a>
                          </div>
                          {/* Payment status badge */}
                          {o.payment && (
                            <div className="flex items-center gap-1.5 flex-wrap pl-3 border-gray-200">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                o.payment.status === "PAID"
                                  ? "bg-green-100 text-green-700"
                                  : o.payment.status === "FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {o.payment.status === "PAID" ? "✓" : o.payment.status === "FAILED" ? "✗" : "○"}
                                {" "}Delivery Charge: {o.payment.status === "PAID" ? "Paid" : o.payment.status === "FAILED" ? "Failed" : "Pending"}
                              </span>
                              {o.payment.status === "PAID" && !!o.payment.paidAmount && (
                                <span className="text-xs text-green-600 font-semibold">৳{o.payment.paidAmount}</span>
                              )}
                              {o.payment.status === "PAID" && o.payment.payerMobile && (
                                <span className="text-xs text-gray-500">{o.payment.payerMobile}</span>
                              )}
                            </div>
                          )}

                        </div>
                      </div>

                      {/* Amount + actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

                    {/* Product image strip */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        {o.lines.map((line, idx) => (
                          <div key={idx} className="relative flex-shrink-0 flex items-center gap-2" title={`${line.title} × ${line.qty}`}>
                            {line.image ? (
                              <Image
                                src={line.image}
                                alt={line.title}
                                width={48}
                                height={48}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition flex-shrink-0"
                                onClick={() => setLightboxSrc(line.image!)}
                                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-pink-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 text-pink-300" />
                              </div>
                            )}
                            {line.qty > 1 && (
                              <span className="absolute -top-1 left-7 sm:left-9 bg-[#167389] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                                {line.qty}
                              </span>
                            )}
                            <p className="text-xs text-gray-700 font-medium leading-tight w-48">{line.title}</p>
                          </div>
                        ))}
                        <div className="ml-auto text-right">
                          <p className="text-sm font-semibold text-gray-700">Subtotal ৳{o.totals.subTotal}</p>
                          <p className="text-sm font-semibold text-gray-700">Shipping ৳{o.totals.shipping}{o.deliveryZone ? ` (${o.deliveryZone === "inside" ? "Inside Dhaka" : "Outside Dhaka"})` : ""}</p>
                          <p className="text-base font-bold text-[#167389] mt-1">Grand Total ৳{o.totals.grandTotal}</p>
                        </div>
                      </div>
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
                {phoneSearch
                  ? `No orders matched phone number "${phoneSearch}"`
                  : "Try adjusting your filters or search by phone number"}
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
                {/* Payment Info */}
                {selected.payment && (
                  <div className={`rounded-xl p-4 border ${
                    selected.payment.status === "PAID"
                      ? "bg-green-50 border-green-200"
                      : selected.payment.status === "FAILED"
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}>
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      💳 Delivery Charge Payment
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        selected.payment.status === "PAID"
                          ? "bg-green-200 text-green-800"
                          : selected.payment.status === "FAILED"
                          ? "bg-red-200 text-red-800"
                          : "bg-gray-200 text-gray-700"
                      }`}>
                        {selected.payment.status === "PAID" ? "✓ PAID" : selected.payment.status === "FAILED" ? "✗ FAILED" : "PENDING"}
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selected.payment.paidAmount ? (
                        <p><span className="text-gray-500">Amount Paid:</span> <span className="font-semibold">৳{selected.payment.paidAmount}</span></p>
                      ) : null}
                      {selected.payment.method && selected.payment.method !== "CASH_ON_DELIVERY" && (
                        <p><span className="text-gray-500">Method:</span> <span className="font-semibold">{selected.payment.method}</span></p>
                      )}
                      {selected.payment.transactionId && (
                        <p><span className="text-gray-500">Trx ID:</span> <span className="font-semibold font-mono">{selected.payment.transactionId}</span></p>
                      )}
                      {selected.payment.payerMobile && (
                        <p><span className="text-gray-500">Payer Mobile:</span> <span className="font-semibold">{selected.payment.payerMobile}</span></p>
                      )}
                      {selected.payment.paidAt && (
                        <p><span className="text-gray-500">Paid At:</span> <span className="font-semibold">{new Date(selected.payment.paidAt).toLocaleString("en-BD")}</span></p>
                      )}
                      {selected.payment.invoiceNumber && (
                        <p className="col-span-2"><span className="text-gray-500">Invoice #:</span> <span className="font-semibold font-mono text-[10px]">{selected.payment.invoiceNumber}</span></p>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer — click pencil to edit */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-pink-100">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                      Customer
                    </h3>
                    {!editingCustomer && (
                      <button onClick={() => setEditingCustomer(true)} className="text-[#167389] hover:text-[#0f5567] transition" title="Edit customer">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {editingCustomer ? (
                    <div className="grid gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-600">Name</label>
                        <input
                          value={editCustomer.name}
                          onChange={(e) => setEditCustomer((p) => ({ ...p, name: e.target.value }))}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-800 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-600">Phone</label>
                        <input
                          value={editCustomer.phone}
                          onChange={(e) => setEditCustomer((p) => ({ ...p, phone: e.target.value }))}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-800 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-gray-600">Address</label>
                        <textarea
                          value={editCustomer.address}
                          onChange={(e) => setEditCustomer((p) => ({ ...p, address: e.target.value }))}
                          rows={2}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-800 text-xs sm:text-sm resize-none"
                        />
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => { setEditingCustomer(false); setEditCustomer({ name: selected.customer.name, phone: selected.customer.phone, address: selected.customer.address ?? "" }); }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs transition"
                        >
                          Discard
                        </button>
                        <button
                          onClick={doSaveCustomer}
                          disabled={isUpdatingDetails}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#167389] text-white font-semibold hover:bg-[#0f5567] disabled:opacity-50 inline-flex items-center justify-center gap-1.5 text-xs transition"
                        >
                          {isUpdatingDetails && <Loader2 className="w-3 h-3 animate-spin" />}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-1.5 text-xs sm:text-sm">
                      <p><span className="text-gray-500">Name:</span> <span className="font-semibold text-gray-800">{editCustomer.name}</span></p>
                      <p><span className="text-gray-500">Phone:</span> <span className="font-semibold text-gray-800">{editCustomer.phone}</span></p>
                      <p><span className="text-gray-500">Address:</span> <span className="font-semibold text-gray-800">{editCustomer.address || "N/A"}</span></p>
                    </div>
                  )}
                </div>

                {/* Lines */}
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                      Items
                    </h3>
                    {canEditLines && hasLineChanges && (
                      <button
                        onClick={() => setEditLines(selected.lines.map((l) => ({ ...l })))}
                        className="text-xs text-gray-400 hover:text-gray-600 transition"
                      >
                        Discard changes
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {canEditLines
                      ? editLines.map((l, idx) => (
                          <EditableOrderLineItem
                            key={idx}
                            line={l}
                            editingPrice={editingPriceIdx === idx}
                            onEditPrice={() => setEditingPriceIdx(idx)}
                            onCancelPrice={() => { setEditingPriceIdx(null); changeLinePrice(idx, selected.lines[idx]?.price ?? l.price); }}
                            onIncrease={() => increaseLineQty(idx)}
                            onDecrease={() => decreaseLineQty(idx)}
                            onRemove={() => setPendingRemoveLine(idx)}
                            onPriceChange={(price) => changeLinePrice(idx, price)}
                            onImageClick={(src) => setLightboxSrc(src)}
                          />
                        ))
                      : selected.lines.map((l, idx) => (
                          <OrderLineItem key={idx} line={l} onImageClick={(src) => setLightboxSrc(src)} />
                        ))}
                  </div>

                  {/* Save / Discard bar */}
                  {canEditLines && hasLineChanges && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setEditLines(selected.lines.map((l) => ({ ...l })))}
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition"
                      >
                        Discard
                      </button>
                      <button
                        onClick={saveLineChanges}
                        disabled={isUpdatingLines || editLines.length === 0}
                        className="flex-1 px-4 py-2 rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#0f5567] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 text-sm transition"
                      >
                        {isUpdatingLines && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  )}

                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-pink-200 space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">৳{editSubTotal}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        Shipping Charge
                        {selected.deliveryZone && (
                          <span className="text-xs text-gray-400">
                            ({selected.deliveryZone === "inside" ? "Inside Dhaka" : "Outside Dhaka"})
                          </span>
                        )}
                        {selected.payment && (
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            selected.payment.status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : selected.payment.status === "FAILED"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {selected.payment.status === "PAID" ? "✓ Paid" : selected.payment.status === "FAILED" ? "✗ Failed" : "Pending"}
                          </span>
                        )}
                      </span>
                      {editingShipping ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500 text-xs">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={editShipping}
                            onChange={(e) => setEditShipping(Number(e.target.value))}
                            className="w-24 px-2 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-300 text-right"
                            autoFocus
                          />
                          <button
                            onClick={doSaveShipping}
                            disabled={isUpdatingDetails}
                            className="px-2 py-1 rounded-lg bg-[#167389] text-white text-xs font-semibold hover:bg-[#0f5567] disabled:opacity-50 inline-flex items-center gap-1 transition"
                          >
                            {isUpdatingDetails ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                          </button>
                          <button
                            onClick={() => { setEditingShipping(false); setEditShipping(selected.totals.shipping); }}
                            className="px-2 py-1 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition"
                          >
                            Discard
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">৳{editShipping}</span>
                          <button onClick={() => setEditingShipping(true)} className="text-[#167389] hover:text-[#0f5567] transition" title="Edit shipping">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-sm sm:text-base pt-2 border-t border-pink-100">
                      <span className="font-bold text-gray-800">Grand Total</span>
                      <span className="text-xl sm:text-2xl font-bold text-pink-600">৳{editGrandTotal}</span>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <StickyNote className="w-4 h-4 text-yellow-600" />
                      <span className="text-xs sm:text-lg font-semibold text-gray-700">Admin Notes</span>
                      {selected.adminNotes && selected.adminNotes.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-bold">
                          {selected.adminNotes.length}
                        </span>
                      )}
                      <div className="ml-auto">
                        {!showAddNote && (
                          <button
                            onClick={() => setShowAddNote(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500 text-white text-xs font-semibold hover:bg-yellow-600 transition"
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                            Add Note
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Existing notes list */}
                    {selected.adminNotes && selected.adminNotes.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {selected.adminNotes.map((note, idx) => (
                          <div key={idx} className="relative flex items-start gap-2.5 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-r-xl shadow-sm">
                            <StickyNote className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm text-gray-900 font-medium break-words leading-relaxed">{note.text}</p>
                              <p className="text-[10px] text-amber-600 mt-1 font-medium">
                                {new Date(note.createdAt).toLocaleString("en-BD", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <button
                              onClick={() => setPendingDeleteNote(idx)}
                              disabled={isDeletingNote}
                              className="flex-shrink-0 p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Add note toggle */}
                    {!showAddNote ? null : (
                      <div className="space-y-2">
                        <SavedNotesPicker onPick={(t) => setNewNote(t)} defaultOpen />
                        <div className="flex gap-2">
                          <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            rows={2}
                            placeholder="Add a note..."
                            autoFocus
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 resize-none transition"
                          />
                          <div className="flex flex-col gap-1.5 self-end">
                            <button
                              onClick={doAddNote}
                              disabled={isAddingNote || !newNote.trim()}
                              className="px-3 py-2 rounded-xl bg-yellow-500 text-white font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 text-xs transition"
                            >
                              {isAddingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Add</span>}
                            </button>
                            <button
                              onClick={() => { setShowAddNote(false); setNewNote(""); }}
                              className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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

                {/* Previous orders for this phone */}
                {(selected.customerFlags?.returning || selected.customerFlags?.sameDay) && (
                  <PhoneOrderHistory phone={selected.customer.phone} currentOrderId={selected._id} />
                )}

                {/* Edit history */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowHistory((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Edit History
                    </span>
                    <span className="text-xs text-gray-400">{showHistory ? "Hide" : "Show"}</span>
                  </button>
                  {showHistory && (
                    <div className="border-t border-gray-100 px-4 py-3">
                      {isLoadingHistory ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading history…
                        </div>
                      ) : historyLogs.length === 0 ? (
                        <p className="text-sm text-gray-400 py-2">No edits recorded yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {historyLogs.map((log) => {
                            const type = log.editType ?? "lines";
                            const time = new Date(log.createdAt).toLocaleString("en-BD", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

                            const entries: { text: string; tone: "red" | "amber" | "blue" }[] = [];

                            if (type === "customer") {
                              const bc = log.before.customer ?? {};
                              const ac = log.after.customer ?? {};
                              if (bc.name !== ac.name) entries.push({ text: `Name: "${bc.name}" → "${ac.name}"`, tone: "blue" });
                              if (bc.phone !== ac.phone) entries.push({ text: `Phone: ${bc.phone} → ${ac.phone}`, tone: "blue" });
                              if (bc.address !== ac.address) entries.push({ text: `Address: "${bc.address}" → "${ac.address}"`, tone: "blue" });
                            } else if (type === "notes") {
                              entries.push({ text: `Note changed: "${log.before.notes ?? ""}" → "${log.after.notes ?? ""}"`, tone: "blue" });
                            } else if (type === "shipping") {
                              entries.push({ text: `Shipping: ৳${log.before.totals?.shipping} → ৳${log.after.totals?.shipping}`, tone: "amber" });
                            } else if (type === "price") {
                              const bl = log.before.lines ?? [];
                              const al = log.after.lines ?? [];
                              for (const b of bl) {
                                const a = al.find((l) => l.productId === b.productId);
                                if (a && a.price !== b.price) entries.push({ text: `${b.title}: price ৳${b.price} → ৳${a.price}`, tone: "amber" });
                              }
                            } else {
                              // lines (qty / removal)
                              const bl = log.before.lines ?? [];
                              const al = log.after.lines ?? [];
                              for (const b of bl) {
                                const a = al.find((l) => l.productId === b.productId);
                                if (!a) entries.push({ text: `${b.title} — removed`, tone: "red" });
                                else if (a.qty !== b.qty) entries.push({ text: `${b.title}: qty ${b.qty} → ${a.qty}`, tone: "amber" });
                              }
                            }

                            const typeLabel: Record<string, string> = { lines: "Items", price: "Price", customer: "Customer", shipping: "Shipping", notes: "Note" };
                            const typeBg: Record<string, string> = { lines: "bg-red-50 text-red-700", price: "bg-amber-50 text-amber-700", customer: "bg-blue-50 text-blue-700", shipping: "bg-purple-50 text-purple-700", notes: "bg-gray-50 text-gray-600" };

                            return (
                              <div key={log._id} className="text-xs border border-gray-100 rounded-lg p-3 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeBg[type] ?? "bg-gray-50 text-gray-600"}`}>
                                    {typeLabel[type] ?? type} edited
                                  </span>
                                  <span className="text-gray-400">{time}</span>
                                </div>
                                {entries.map((e, i) => (
                                  <p key={i} className={e.tone === "red" ? "text-red-600" : e.tone === "amber" ? "text-amber-700" : "text-blue-700"}>
                                    • {e.text}
                                  </p>
                                ))}
                                {(type === "lines" || type === "price") && log.before.totals && log.after.totals && (
                                  <p className="text-gray-500 pt-1 border-t border-gray-100">
                                    Total: ৳{log.before.totals.grandTotal} → ৳{log.after.totals.grandTotal}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
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
            {/* Save lines confirmation — custom modal with diff list */}
            {showSaveConfirm && (
              <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-pink-100">
                  <div className="px-5 pt-5 pb-3">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Save item changes?</h3>
                    <p className="text-xs text-gray-500 mb-3">The following changes will be saved and stock will be adjusted automatically.</p>
                    <div className="space-y-1.5 mb-3">
                      {lineDiff.map((d, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${d.type === "removed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                          {d.type === "removed" ? (
                            <><Trash2 className="w-3.5 h-3.5 flex-shrink-0" /><span><span className="font-semibold">{d.title}</span> — removed from order</span></>
                          ) : (
                            <><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span><span className="font-semibold">{d.title}</span> — qty {d.from} → {d.to}</span></>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 px-1">
                      <span>New total</span>
                      <span className="font-bold text-gray-800">
                        ৳{editLines.reduce((s, l) => s + l.price * l.qty, 0) + (selected?.totals.shipping ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 px-5 pb-5 pt-2">
                    <button
                      onClick={() => setShowSaveConfirm(false)}
                      className="flex-1 px-4 py-2 rounded-xl border border-pink-200 text-gray-700 font-medium hover:bg-pink-50 text-sm transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={doSaveLines}
                      disabled={isUpdatingLines}
                      className="flex-1 px-4 py-2 rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#0f5567] disabled:opacity-50 inline-flex items-center justify-center gap-2 text-sm transition"
                    >
                      {isUpdatingLines && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm & Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Confirm
              open={pendingRemoveLine !== null}
              title="Remove this item?"
              subtitle={
                pendingRemoveLine !== null
                  ? `"${editLines[pendingRemoveLine]?.title}" will be removed from the order.`
                  : undefined
              }
              confirmLabel="Remove"
              tone="danger"
              loading={false}
              onCancel={() => setPendingRemoveLine(null)}
              onConfirm={confirmRemoveLine}
            />

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

            <Confirm
              open={pendingDeleteNote !== null}
              title="Delete this note?"
              subtitle="This note will be permanently removed."
              confirmLabel="Delete"
              tone="danger"
              loading={isDeletingNote}
              onCancel={() => setPendingDeleteNote(null)}
              onConfirm={doDeleteNote}
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

      {/* Create Order Modal */}
      {showCreateOrder && <CreateOrderModal onClose={() => setShowCreateOrder(false)} />}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
          <Image
            src={lightboxSrc}
            alt="Product"
            width={1200}
            height={900}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
