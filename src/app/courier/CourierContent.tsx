"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Send, Package, ArrowLeft, LayoutList } from "lucide-react";
import SteadfastBalanceBadge from "./components/SteadfastBalanceBadge";
import ShipmentsTab from "./components/ShipmentsTab";
import SteadfastSendTab from "./components/SteadfastSendTab";
import PathaoSendTab from "./components/PathaoSendTab";
import { useListShipmentsQuery } from "@/services/courier.api";

type Tab = "shipments" | "steadfast" | "pathao";

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "shipments", label: "All Shipments", icon: <LayoutList className="w-4 h-4" />, color: "bg-[#167389] text-white" },
  { id: "steadfast", label: "Send via Steadfast", icon: <Send className="w-4 h-4" />, color: "bg-blue-600 text-white" },
  { id: "pathao", label: "Send via Pathao", icon: <Package className="w-4 h-4" />, color: "bg-purple-600 text-white" },
];

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 ${color} shadow-sm`}>
      <p className="text-xs font-medium opacity-80 mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  );
}

export default function CourierContent() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("shipments");

  const { data: allShipments } = useListShipmentsQuery({ limit: 1000 });
  const { data: steadfastShipments } = useListShipmentsQuery({ provider: "steadfast", limit: 1000 });
  const { data: pathaoShipments } = useListShipmentsQuery({ provider: "pathao", limit: 1000 });

  const totalShipments = allShipments?.data?.total ?? 0;
  const totalSteadfast = steadfastShipments?.data?.total ?? 0;
  const totalPathao = pathaoShipments?.data?.total ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-16">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-medium shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-[#167389] flex items-center justify-center shadow-md">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                Courier Management
              </h1>
              <p className="text-sm text-gray-500 ml-13">Manage & track shipments via Steadfast and Pathao</p>
            </div>
            <SteadfastBalanceBadge />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <StatCard label="Total Shipments" value={totalShipments} sub="All couriers" color="bg-white border border-gray-200 text-gray-800" />
          <StatCard label="Steadfast" value={totalSteadfast} sub="Consignments sent" color="bg-blue-50 border border-blue-200 text-blue-800" />
          <StatCard label="Pathao" value={totalPathao} sub="Orders sent" color="bg-purple-50 border border-purple-200 text-purple-800" />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5 bg-white rounded-2xl border border-gray-200 p-1.5 shadow-sm mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-max inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                tab === t.id ? t.color + " shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "shipments" && <ShipmentsTab />}
        {tab === "steadfast" && <SteadfastSendTab />}
        {tab === "pathao" && <PathaoSendTab />}
      </div>
    </div>
  );
}
