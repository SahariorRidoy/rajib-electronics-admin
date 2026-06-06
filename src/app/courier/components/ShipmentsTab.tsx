"use client";

import { useState } from "react";
import {
  Truck, Search, MapPin, X, User, Phone, Calendar,
  Loader2, AlertCircle, RefreshCw, Package, CreditCard,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useListShipmentsQuery,
  usePathaoCancelMutation,
  type Shipment,
} from "@/services/courier.api";
import TrackModal from "./TrackModal";

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }) : "";

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_SHIPPING: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  RETURNED: "bg-orange-100 text-orange-700",
};

export default function ShipmentsTab() {
  const [provider, setProvider] = useState<"" | "steadfast" | "pathao">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [trackTarget, setTrackTarget] = useState<Shipment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Shipment | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useListShipmentsQuery({
    provider: provider || undefined,
    page,
    limit,
  });

  const [pathaoCancel, { isLoading: isCancelling }] = usePathaoCancelMutation();

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filtered = q.trim()
    ? items.filter(
        (s) =>
          s._id.toLowerCase().includes(q.toLowerCase()) ||
          s.customer?.name?.toLowerCase().includes(q.toLowerCase()) ||
          s.customer?.phone?.includes(q) ||
          s.courier?.consignmentId?.toLowerCase().includes(q.toLowerCase())
      )
    : items;

  const handleCancel = async (shipment: Shipment) => {
    try {
      await pathaoCancel(shipment._id).unwrap();
      toast.success("Pathao order cancelled");
      setCancelTarget(null);
      refetch();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string; code?: string } };
      toast.error(String(err?.data?.message || err?.data?.code || "Cancel failed"));
    }
  };

  return (
    <>
      {trackTarget && (
        <TrackModal
          orderId={trackTarget._id}
          provider={trackTarget.courier.provider}
          consignmentId={trackTarget.courier.consignmentId}
          onClose={() => setTrackTarget(null)}
        />
      )}

      {/* Cancel confirm modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-red-100 p-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Cancel Pathao Order?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              Consignment <span className="font-semibold text-gray-700">{cancelTarget.courier.consignmentId}</span> will be cancelled with Pathao.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Go Back
              </button>
              <button onClick={() => handleCancel(cancelTarget)} disabled={isCancelling}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition">
                {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, customer, phone, consignment..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#167389]/30 focus:border-[#167389]"
              />
            </div>
            <select
              value={provider}
              onChange={(e) => { setProvider(e.target.value as "" | "steadfast" | "pathao"); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#167389]/30 bg-white text-gray-700 min-w-[160px]"
            >
              <option value="">All Providers</option>
              <option value="steadfast">Steadfast</option>
              <option value="pathao">Pathao</option>
            </select>
            <button onClick={() => refetch()}
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition" title="Refresh">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
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
            <p className="text-sm text-red-700">Failed to load shipments. Please try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">No shipments found</p>
            <p className="text-gray-400 text-xs mt-1">Send orders via Steadfast or Pathao to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-gray-500 font-medium">{total} total shipments</span>
            </div>

            {filtered.map((s) => (
              <div key={s._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Top badges row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span className="text-sm font-bold text-[#167389] font-mono break-all">{s._id}</span>
                      {/* Provider badge */}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        s.courier.provider === "steadfast" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}>
                        {s.courier.provider === "steadfast" ? "Steadfast" : "Pathao"}
                      </span>
                      {/* Order status badge */}
                      {s.status && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ORDER_STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {s.status.replace("_", " ")}
                        </span>
                      )}
                      {/* Courier status badge */}
                      {s.courier.status && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium border border-gray-200">
                          {s.courier.status}
                        </span>
                      )}
                    </div>

                    {/* Customer info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs text-gray-600 mb-2">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-800 truncate">{s.customer?.name}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {s.customer?.phone}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        Sent: {fmtDate(s.courier.sentAt)}
                      </span>
                    </div>

                    {/* Consignment info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        Consignment: <span className="font-semibold text-gray-700 ml-1">{s.courier.consignmentId}</span>
                      </span>
                      {s.courier.trackingCode && s.courier.trackingCode !== s.courier.consignmentId && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          Tracking: <span className="font-semibold text-gray-700 ml-1">{s.courier.trackingCode}</span>
                        </span>
                      )}
                    </div>

                    {/* Product lines */}
                    {s.lines?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {s.lines.map((l, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">
                            <Package className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate max-w-[160px]">{l.title}</span>
                            <span className="text-gray-400">×{l.qty}</span>
                            {l.color && <span className="text-gray-400">· {l.color}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <CreditCard className="w-3 h-3" /> COD
                      </p>
                      <p className="text-lg font-bold text-[#167389]">৳{s.totals?.grandTotal}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTrackTarget(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#167389] text-white text-xs font-semibold hover:bg-[#125f73] transition shadow-sm"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Track
                      </button>
                      {s.courier.provider === "pathao" && (
                        <button
                          onClick={() => setCancelTarget(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
                  Previous
                </button>
                <span className="text-sm text-gray-600 font-medium">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
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
