"use client";

import { Wallet, RefreshCw, AlertCircle } from "lucide-react";
import { useSteadfastBalanceQuery } from "@/services/courier.api";

export default function SteadfastBalanceBadge() {
  const { data, isLoading, isError, refetch } = useSteadfastBalanceQuery();

  return (
    <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Wallet className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500 leading-none mb-0.5">Steadfast Balance</p>
        {isLoading ? (
          <p className="text-sm font-bold text-gray-400">Loading...</p>
        ) : isError ? (
          <p className="text-sm font-bold text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Error
          </p>
        ) : (
          <p className="text-sm font-bold text-blue-700">
            ৳{data?.data?.current_balance ?? "—"}
          </p>
        )}
      </div>
      <button
        onClick={() => refetch()}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition ml-1"
        title="Refresh balance"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
