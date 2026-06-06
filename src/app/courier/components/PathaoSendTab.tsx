"use client";

import { useState, useMemo } from "react";
import {
  Search, User, Phone, Package, AlertCircle, Send,
  MapPin, Calendar, CreditCard, RefreshCw,
} from "lucide-react";
import { useListOrdersQuery } from "@/services/orders.api";
import type { Order, OrderStatus } from "@/types/order";
import PathaoSendModal from "./PathaoSendModal";

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_SHIPPING: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  RETURNED: "bg-orange-100 text-orange-700",
};

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }) : "";

export default function PathaoSendTab() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<Order | null>(null);
  const limit = 20;

  const { data, isLoading, isFetching, error, refetch } = useListOrdersQuery({
    page,
    limit,
    status: (statusFilter as Order["status"]) || undefined,
  });

  const total = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filtered = useMemo(() => {
    const items: Order[] = data?.data?.items ?? [];
    const eligible = items.filter((o) => !o.courier?.consignmentId);
    const ql = q.trim().toLowerCase();
    if (!ql) return eligible;
    return eligible.filter(
      (o) =>
        o._id.toLowerCase().includes(ql) ||
        o.customer?.name?.toLowerCase().includes(ql) ||
        o.customer?.phone?.includes(ql) ||
        o.customer?.district?.toLowerCase().includes(ql)
    );
  }, [data, q]);

  return (
    <>
      {target && (
        <PathaoSendModal
          order={target}
          onClose={() => setTarget(null)}
          onSuccess={() => { refetch(); setTarget(null); }}
        />
      )}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, name, phone, district..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ""); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white text-gray-700 min-w-[150px]"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_SHIPPING">In Shipping</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-xs text-purple-700 flex items-center gap-2">
          <Package className="w-4 h-4 flex-shrink-0" />
          Click Send to open the Pathao form — select store, city, zone and delivery options.
        </div>

        {/* List */}
        {isLoading || isFetching ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">Failed to load orders. Please try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-purple-300" />
            </div>
            <p className="text-gray-600 font-medium">No eligible orders found</p>
            <p className="text-gray-400 text-xs mt-1">Orders already sent to a courier are excluded</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end px-1">
              <span className="text-xs text-gray-400">{total} total orders</span>
            </div>

            {filtered.map((o) => {
              const address = [
                o.customer.houseOrVillage,
                o.customer.roadOrPostOffice,
                o.customer.blockOrThana,
                o.customer.district,
              ].filter(Boolean).join(", ");

              return (
                <div key={o._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left: order info */}
                    <div className="flex-1 min-w-0">
                      {/* ID + status */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-[#167389] font-mono break-all">{o._id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[o.status]}`}>
                          {o.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Customer info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-600 mb-2">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate font-medium text-gray-800">{o.customer.name}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {o.customer.phone}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {o.lines.length} item{o.lines.length > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {fmtDate(o.createdAt)}
                        </span>
                      </div>

                      {/* Address */}
                      {address && (
                        <p className="text-xs text-gray-500 flex items-start gap-1.5 mb-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          {address}
                        </p>
                      )}

                      {/* Product lines */}
                      <div className="flex flex-wrap gap-1.5">
                        {o.lines.map((l, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">
                            <Package className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate max-w-[160px]">{l.title}</span>
                            <span className="text-gray-400">×{l.qty}</span>
                            {l.color && <span className="text-gray-400">· {l.color}</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: price + send button */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                          <CreditCard className="w-3 h-3" />
                          COD
                        </p>
                        <p className="text-lg font-bold text-[#167389]">৳{o.totals.grandTotal}</p>
                        <p className="text-xs text-gray-400">+৳{o.totals.shipping} shipping</p>
                      </div>
                      <button
                        onClick={() => setTarget(o)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send via Pathao
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 font-medium">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
