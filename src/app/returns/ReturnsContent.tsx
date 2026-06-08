"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PackageX,
  Search,
  Eye,
  X,
  Loader2,
  Package,
  User,
  Phone,
  Calendar,
  ArrowLeft,
  Plus,
  AlertCircle,
} from "lucide-react";
import Image from "@/lib/image";
import { Toaster, toast } from "react-hot-toast";

import { useListOrdersQuery } from "@/services/orders.api";
import { useGetProductByIdQuery } from "@/services/products.api";
import { useProcessReturnMutation } from "@/services/returns.api";
import type { Order } from "@/types/order";

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

export default function ReturnsContent() {
  const router = useRouter();
  
  const [q, setQ] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 24;

  const [selected, setSelected] = useState<Order | null>(null);
  const [showOrderSelectModal, setShowOrderSelectModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [returnItems, setReturnItems] = useState<Array<{ productId: string; title: string; maxQty: number; qty: number; image?: string }>>([]);
  const [returnReason, setReturnReason] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("");

  const { data, isLoading, isFetching, error } = useListOrdersQuery({
    page,
    limit,
    status: "RETURNED",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: allOrdersData } = useListOrdersQuery({ limit: 100 });

  const [processReturn, { isLoading: isProcessingReturn }] = useProcessReturnMutation();

  const total = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filtered = useMemo(() => {
    const items: Order[] = data?.data?.items ?? [];
    const ql = q.trim().toLowerCase();
    if (!ql) return items;
    return items.filter(
      (o) =>
        o._id.toLowerCase().includes(ql) ||
        o.customer?.name?.toLowerCase().includes(ql)
    );
  }, [data, q]);

  const openCreateModal = (order: Order) => {
    setSelected(order);
    setReturnItems([]);
    setReturnReason("");
    setReturnNotes("");
    setShowOrderSelectModal(false);
    setShowCreateModal(true);
  };

  const filteredOrders = useMemo(() => {
    const allOrders = allOrdersData?.data?.items ?? [];
    const ql = orderSearch.trim().toLowerCase();
    let orders = allOrders.filter(o => o.status !== "RETURNED");
    
    if (orderStatusFilter) {
      orders = orders.filter(o => o.status === orderStatusFilter);
    }
    
    if (!ql) return orders;
    return orders.filter(
      (o) =>
        o._id.toLowerCase().includes(ql) ||
        o.customer?.name?.toLowerCase().includes(ql)
    );
  }, [allOrdersData, orderSearch, orderStatusFilter]);

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
      setShowCreateModal(false);
      setSelected(null);
      setReturnItems([]);
      setReturnReason("");
      setReturnNotes("");
      window.location.reload();
    } catch (e: unknown) {
      const error = e as { data?: { message?: string; code?: string } };
      toast.error(String(error?.data?.message || error?.data?.code || "Return failed"));
      console.error(e);
    }
  };

  const Skeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 animate-pulse">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="h-5 bg-orange-100 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="h-4 bg-orange-100 rounded" />
          <div className="h-4 bg-orange-100 rounded" />
          <div className="h-4 bg-orange-100 rounded" />
        </div>
        <div className="h-4 bg-orange-100 rounded w-1/2" />
      </div>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-16">
          <div className="mb-6 sm:mb-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-orange-200 text-gray-700 hover:bg-orange-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-700 mb-2 flex items-center gap-2 sm:gap-3">
                  <PackageX className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10" />
                  Order Returns
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  View all returned orders and process new returns
                </p>
              </div>
              <button
                onClick={() => setShowOrderSelectModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 shadow-md transition text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Return</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 sm:p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black" />
                <input
                  type="text"
                  placeholder="Search by order ID or customer..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition text-sm sm:text-base"
                />
              </div>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setStartDate(today);
                  setEndDate(today);
                }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition text-sm sm:text-base whitespace-nowrap"
              >
                Today
              </button>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition text-sm sm:text-base"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition text-sm sm:text-base"
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
                Failed to load returns. Please try again.
              </p>
            </div>
          ) : filtered.length ? (
            <div className="space-y-4">
              {filtered.map((o) => (
                <div
                  key={o._id}
                  className="bg-white rounded-2xl shadow-sm border border-orange-100 hover:shadow-md transition"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-orange-700 break-all">
                            {o._id}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            <PackageX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden xs:inline">Returned</span>
                          </span>
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

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-gray-500 mb-1">
                            Grand Total
                          </p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-700">
                            ৳{o.totals.grandTotal}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelected(o);
                            setShowDetailsModal(true);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition text-xs sm:text-sm"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>

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

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 sm:px-4 py-2 rounded-xl border border-orange-200 text-gray-700 hover:bg-orange-50 disabled:opacity-50 text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-xs sm:text-sm text-gray-600">
                    Page <span className="font-semibold">{page}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 sm:px-4 py-2 rounded-xl border border-orange-200 text-gray-700 hover:bg-orange-50 disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 sm:p-12 text-center">
              <PackageX className="w-12 h-12 sm:w-16 sm:h-16 text-orange-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                No returned orders found
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Try adjusting your search
              </p>
            </div>
          )}
        </div>

        {showDetailsModal && selected && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border border-orange-100 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-orange-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl z-10">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Return Details</h2>
                <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-orange-50 rounded-xl transition">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Order ID</h3>
                  <p className="text-sm text-gray-700 break-all">{selected._id}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-600" />
                    Customer
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold text-gray-800">{selected.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold text-gray-800">{selected.customer.phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-600" />
                    Items
                  </h3>
                  <div className="space-y-2">
                    {selected.lines.map((line, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="flex-1 text-sm text-gray-700">{line.title} (Qty: {line.qty})</span>
                        <span className="text-sm font-bold text-orange-600">৳{line.price * line.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">৳{selected.totals.subTotal}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">৳{selected.totals.shipping}</span>
                  </div>
                  <div className="flex justify-between text-base pt-2 border-t border-orange-200">
                    <span className="font-bold text-gray-800">Grand Total</span>
                    <span className="text-xl font-bold text-orange-600">৳{selected.totals.grandTotal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showOrderSelectModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl my-4 sm:my-8 border border-orange-100 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-orange-100 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl z-10">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Select Order for Return</h2>
                <button onClick={() => setShowOrderSelectModal(false)} className="p-1.5 sm:p-2 hover:bg-orange-50 rounded-lg sm:rounded-xl transition">
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by order ID or customer..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_SHIPPING">In Shipping</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-2 max-h-[50vh] sm:max-h-96 overflow-y-auto">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <button
                        key={order._id}
                        onClick={() => openCreateModal(order)}
                        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 hover:bg-orange-50 rounded-lg sm:rounded-xl border border-gray-200 hover:border-orange-300 transition text-left gap-2 sm:gap-0"
                      >
                        <div className="flex-1 w-full sm:w-auto">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-gray-800 text-xs sm:text-sm break-all">{order._id}</span>
                            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{order.status}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[10px] sm:text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {order.customer.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.customer.phone}
                            </span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <p className="text-xs sm:text-sm font-bold text-orange-600">৳{order.totals.grandTotal}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">{order.lines.length} items</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs sm:text-sm">No orders found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && selected && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border border-orange-100 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-orange-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl z-10">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Process Return</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-orange-50 rounded-xl transition">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Return Reason *</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
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

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800">Order Items:</h3>
                    <button
                      onClick={addAllItems}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition"
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
                  <textarea
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    rows={3}
                    placeholder="Enter any additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-orange-200 text-gray-700 font-medium hover:bg-orange-50 transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReturn}
                    disabled={returnItems.length === 0 || !returnReason.trim() || isProcessingReturn}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition text-sm"
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
