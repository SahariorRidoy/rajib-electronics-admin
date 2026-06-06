"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Minus, History, Package, Sparkles } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useGetStockHistoryQuery, useAddStockMutation, useRemoveStockMutation } from "@/services/inventory.api";
import { useListProductsQuery } from "@/services/products.api";
import type { AddStockRequest, RemoveStockRequest } from "@/types/inventory";
import Link from "next/link";

export default function InventoryPage() {
  const params = useParams();
  const productId = params.id as string;

  const [activeTab, setActiveTab] = useState<"add" | "remove" | "history">("add");

  const { data: productsData } = useListProductsQuery({});
  const products = (productsData?.data?.items ?? productsData?.data ?? []) as Array<{ _id: string; title?: string; stock?: number }>;
  const product = products.find((p) => p._id === productId);

  const { data: stockHistory = [], isLoading: historyLoading } = useGetStockHistoryQuery(productId);
  const [addStock, { isLoading: adding }] = useAddStockMutation();
  const [removeStock, { isLoading: removing }] = useRemoveStockMutation();

  const currentStock = product?.stock || 0;

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-16">
          <Link
            href="/products"
            className="inline-flex border border-teal-800 rounded-lg p-1 items-center gap-2 px-3 py-2 mb-4 text-gray-700 hover:text-[#167389] transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#167389] to-[#167389] mb-1 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-[#167389]" />
              Stock Management
            </h1>
            <p className="text-sm text-gray-600">{product?.title || "Loading..."}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-0.5">Current Stock</p>
                <p className="text-3xl font-bold text-gray-900">{currentStock}</p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                currentStock > 10 ? "bg-green-100 text-green-800" :
                currentStock > 0 ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}>
                {currentStock > 10 ? "✅ In Stock" :
                 currentStock > 0 ? "⚠️ Low Stock" :
                 "❌ Out of Stock"}
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-pink-100">
              <button
                onClick={() => setActiveTab("add")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === "add"
                    ? "bg-gradient-to-r from-[#167389] to-[#167389] text-white"
                    : "text-gray-600 hover:bg-pink-50"
                }`}
              >
                <Plus className="w-4 h-4 inline mr-1.5" />
                Add Stock
              </button>
              <button
                onClick={() => setActiveTab("remove")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === "remove"
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                    : "text-gray-600 hover:bg-pink-50"
                }`}
              >
                <Minus className="w-4 h-4 inline mr-1.5" />
                Remove Stock
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                    : "text-gray-600 hover:bg-pink-50"
                }`}
              >
                <History className="w-4 h-4 inline mr-1.5" />
                History
              </button>
            </div>

            <div className="p-4">
              {activeTab === "add" && (
                <AddStockForm
                  productId={productId}
                  currentStock={currentStock}
                  onSuccess={() => toast.success("Stock added successfully")}
                  isLoading={adding}
                  addStock={addStock}
                />
              )}

              {activeTab === "remove" && (
                <RemoveStockForm
                  productId={productId}
                  currentStock={currentStock}
                  onSuccess={() => toast.success("Stock removed successfully")}
                  isLoading={removing}
                  removeStock={removeStock}
                />
              )}

              {activeTab === "history" && (
                <StockHistory movements={stockHistory} isLoading={historyLoading} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface AddStockFormProps {
  productId: string;
  currentStock: number;
  onSuccess: () => void;
  isLoading: boolean;
  addStock: (data: { productId: string } & AddStockRequest) => { unwrap: () => Promise<unknown> };
}

function AddStockForm({ productId, currentStock, onSuccess, isLoading, addStock }: AddStockFormProps) {
  const [formData, setFormData] = useState<AddStockRequest>({
    quantity: 0,
    type: "PURCHASE",
    reason: "",
    reference: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    try {
      await addStock({ productId, ...formData }).unwrap();
      onSuccess();
      setFormData({ quantity: 0, type: "PURCHASE", reason: "", reference: "" });
    } catch {
      toast.error("Failed to add stock");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Add Quantity *</label>
          <input
            type="number"
            min="1"
            value={formData.quantity || ""}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
            placeholder="Enter quantity"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as "PURCHASE" | "RETURN" | "ADJUSTMENT" })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
          >
            <option value="PURCHASE">New Purchase</option>
            <option value="RETURN">Customer Return</option>
            <option value="ADJUSTMENT">Stock Adjustment</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reference</label>
        <input
          type="text"
          value={formData.reference}
          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
          placeholder="PO number, invoice, etc."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reason</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition resize-none"
          rows={2}
          placeholder="Why are you adding this stock?"
        />
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
        <p className="text-xs text-green-800">
          Current: <strong>{currentStock}</strong> → New: <strong>{currentStock + (formData.quantity || 0)}</strong>
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2.5 text-sm rounded-xl bg-gradient-to-r from-[#167389] to-[#167389] text-white font-semibold hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 transition shadow-md"
      >
        {isLoading ? "Adding..." : `Add ${formData.quantity || 0} units to stock`}
      </button>
    </form>
  );
}

interface RemoveStockFormProps {
  productId: string;
  currentStock: number;
  onSuccess: () => void;
  isLoading: boolean;
  removeStock: (data: { productId: string } & RemoveStockRequest) => { unwrap: () => Promise<unknown> };
}

function RemoveStockForm({ productId, currentStock, onSuccess, isLoading, removeStock }: RemoveStockFormProps) {
  const [formData, setFormData] = useState<RemoveStockRequest>({
    quantity: 0,
    type: "DAMAGE",
    reason: "",
    reference: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (formData.quantity > currentStock) {
      toast.error("Cannot remove more than current stock");
      return;
    }

    try {
      await removeStock({ productId, ...formData }).unwrap();
      onSuccess();
      setFormData({ quantity: 0, type: "DAMAGE", reason: "", reference: "" });
    } catch {
      toast.error("Failed to remove stock");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Remove Quantity *</label>
          <input
            type="number"
            min="1"
            max={currentStock}
            value={formData.quantity || ""}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
            placeholder="Enter quantity"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as "DAMAGE" | "LOSS" | "ADJUSTMENT" })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
          >
            <option value="DAMAGE">Damaged</option>
            <option value="LOSS">Lost/Stolen</option>
            <option value="ADJUSTMENT">Stock Adjustment</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reference</label>
        <input
          type="text"
          value={formData.reference}
          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
          placeholder="Incident report, etc."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reason *</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition resize-none"
          rows={2}
          placeholder="Why are you removing this stock?"
          required
        />
      </div>

      <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-3">
        <p className="text-xs text-red-800">
          Current: <strong>{currentStock}</strong> → New: <strong>{currentStock - (formData.quantity || 0)}</strong>
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2.5 text-sm rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition shadow-md"
      >
        {isLoading ? "Removing..." : `Remove ${formData.quantity || 0} units from stock`}
      </button>
    </form>
  );
}

interface StockHistoryProps {
  movements: Array<{
    _id: string;
    type: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    reason?: string;
    reference?: string;
    createdAt: string;
  }>;
  isLoading: boolean;
}

function StockHistory({ movements, isLoading }: StockHistoryProps) {
  if (isLoading) {
    return <div className="text-center py-6 text-sm text-gray-600">Loading history...</div>;
  }

  if (!movements || movements.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-pink-300 mx-auto mb-3" />
        <p className="text-sm text-gray-600">No stock movements yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {movements.map((movement) => (
        <div key={movement._id} className="border border-pink-100 rounded-xl p-3 hover:border-pink-200 hover:shadow-sm transition bg-white">
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                ["PURCHASE", "RETURN", "ADJUSTMENT"].includes(movement.type)
                  ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800"
                  : "bg-gradient-to-r from-red-100 to-rose-100 text-red-800"
              }`}>
                {movement.type}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(movement.createdAt).toLocaleString()}
              </span>
            </div>
            <span className={`text-base font-bold ${
              ["PURCHASE", "RETURN", "ADJUSTMENT"].includes(movement.type)
                ? "text-green-600"
                : "text-red-600"
            }`}>
              {["PURCHASE", "RETURN", "ADJUSTMENT"].includes(movement.type) ? "+" : "-"}{movement.quantity}
            </span>
          </div>
          <div className="text-xs text-gray-700">
            <p className="font-medium">Stock: {movement.previousStock} → {movement.newStock}</p>
            {movement.reason && <p className="mt-1 text-gray-600">Reason: {movement.reason}</p>}
            {movement.reference && <p className="text-gray-600">Ref: {movement.reference}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}