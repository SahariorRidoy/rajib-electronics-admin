"use client";

import { X, Loader2, MapPin, Package, RefreshCw, ExternalLink } from "lucide-react";
import { useSteadfastTrackQuery, usePathaoTrackQuery } from "@/services/courier.api";

interface Props {
  orderId: string;
  provider: "steadfast" | "pathao";
  consignmentId: string;
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-xs font-semibold text-gray-800 text-right break-all">{String(value)}</span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SteadfastResult({ data }: { data: any }) {
  const d = data?.delivery_status ?? data;
  return (
    <div className="space-y-3">
      {d?.status && (
        <div className="flex items-center justify-center">
          <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-bold uppercase tracking-wide">
            {d.status}
          </span>
        </div>
      )}
      <div className="bg-gray-50 rounded-xl p-4 space-y-0">
        <InfoRow label="Consignment ID" value={d?.consignment_id} />
        <InfoRow label="Tracking Code" value={d?.tracking_code} />
        <InfoRow label="Recipient" value={d?.recipient_name} />
        <InfoRow label="Phone" value={d?.recipient_phone} />
        <InfoRow label="Address" value={d?.recipient_address} />
        <InfoRow label="COD Amount" value={d?.cod_amount ? `৳${d.cod_amount}` : null} />
        <InfoRow label="Status" value={d?.status} />
        <InfoRow label="Note" value={d?.note} />
        <InfoRow label="Created" value={d?.created_at} />
        <InfoRow label="Updated" value={d?.updated_at} />
      </div>
      {!d?.consignment_id && (
        <pre className="text-xs bg-gray-50 rounded-xl p-4 overflow-auto max-h-60 border border-gray-200 whitespace-pre-wrap break-all">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PathaoResult({ data }: { data: any }) {
  const d = data?.data ?? data;
  return (
    <div className="space-y-3">
      {d?.order_status && (
        <div className="flex items-center justify-center">
          <span className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-bold uppercase tracking-wide">
            {d.order_status}
          </span>
        </div>
      )}
      <div className="bg-gray-50 rounded-xl p-4 space-y-0">
        <InfoRow label="Consignment ID" value={d?.consignment_id} />
        <InfoRow label="Merchant Order ID" value={d?.merchant_order_id} />
        <InfoRow label="Recipient" value={d?.recipient_name} />
        <InfoRow label="Phone" value={d?.recipient_phone} />
        <InfoRow label="Address" value={d?.recipient_address} />
        <InfoRow label="COD Amount" value={d?.amount_to_collect ? `৳${d.amount_to_collect}` : null} />
        <InfoRow label="Delivery Fee" value={d?.delivery_fee ? `৳${d.delivery_fee}` : null} />
        <InfoRow label="Order Status" value={d?.order_status} />
        <InfoRow label="Delivery Type" value={d?.delivery_type === 48 ? "Normal (48h)" : d?.delivery_type === 12 ? "Express (12h)" : d?.delivery_type} />
        <InfoRow label="Item Weight" value={d?.item_weight ? `${d.item_weight} kg` : null} />
        <InfoRow label="Special Instruction" value={d?.special_instruction} />
        <InfoRow label="Created" value={d?.created_at} />
        <InfoRow label="Updated" value={d?.updated_at} />
      </div>
      {!d?.consignment_id && (
        <pre className="text-xs bg-gray-50 rounded-xl p-4 overflow-auto max-h-60 border border-gray-200 whitespace-pre-wrap break-all">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function TrackModal({ orderId, provider, consignmentId, onClose }: Props) {
  const isSteadfast = provider === "steadfast";

  const steadfast = useSteadfastTrackQuery(orderId, { skip: !isSteadfast });
  const pathao = usePathaoTrackQuery(orderId, { skip: isSteadfast });

  const { data, isLoading, error, refetch } = isSteadfast ? steadfast : pathao;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSteadfast ? "bg-blue-100" : "bg-purple-100"}`}>
              <MapPin className={`w-4 h-4 ${isSteadfast ? "text-blue-600" : "text-purple-600"}`} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {isSteadfast ? "Steadfast" : "Pathao"} Tracking
              </h2>
              <p className="text-xs text-gray-400 font-mono">{consignmentId}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => refetch()} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="Refresh">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#167389]" />
              <span className="text-sm">Fetching tracking info...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-sm text-red-600 font-medium">Failed to fetch tracking info</p>
              <button onClick={() => refetch()} className="text-xs text-[#167389] hover:underline flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Try again
              </button>
            </div>
          ) : isSteadfast ? (
            <SteadfastResult data={data?.data ?? data} />
          ) : (
            <PathaoResult data={data?.data ?? data} />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Close
          </button>
          {!isLoading && !error && (
            <a
              href={isSteadfast
                ? `https://steadfast.com.bd/t/${consignmentId}`
                : `https://pathao.com/track/${consignmentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#167389] text-white text-sm font-semibold hover:bg-[#125f73] transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Track Online
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
