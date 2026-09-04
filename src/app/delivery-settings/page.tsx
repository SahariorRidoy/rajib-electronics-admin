"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetDeliverySettingsQuery, useCreateDeliverySettingsMutation, useUpdateDeliverySettingsMutation } from "@/services/delivery.api";
import { Package, Truck, Info, ArrowLeft, Calendar, Clock, CreditCard, Eye, EyeOff, ShieldCheck, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import Page from "@/components/Page";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function DeliverySettingsPage() {
  const router = useRouter();
  const { data, isLoading } = useGetDeliverySettingsQuery();
  const [createSettings, { isLoading: isCreating }] = useCreateDeliverySettingsMutation();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateDeliverySettingsMutation();

  const [threshold, setThreshold] = useState(0);
  const [insideCharge, setInsideCharge] = useState(80);
  const [outsideCharge, setOutsideCharge] = useState(120);
  const [isActive, setIsActive] = useState(true);
  const [deliveryChargePaymentRequired, setDeliveryChargePaymentRequired] = useState(false);
  const [settingsExist, setSettingsExist] = useState(false);

  // PayStation credentials state
  const [psMerchantId, setPsMerchantId] = useState("");
  const [psPassword, setPsPassword] = useState("");
  const [psIsLive, setPsIsLive] = useState(false);
  const [psHasPassword, setPsHasPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [psSaving, setPsSaving] = useState(false);
  const [psLoading, setPsLoading] = useState(true);

  useEffect(() => {
    if (data?.data) {
      setThreshold(data.data.freeDeliveryThreshold);
      setInsideCharge(data.data.insideDhakaCharge);
      setOutsideCharge(data.data.outsideDhakaCharge);
      setIsActive(data.data.isActive);
      setDeliveryChargePaymentRequired(data.data.deliveryChargePaymentRequired ?? false);
      setSettingsExist(true);
    }
  }, [data]);

  useEffect(() => {
    const fetchPs = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/settings/paystation`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        const json = await res.json();
        if (json.ok) {
          setPsMerchantId(json.data.merchantId || "");
          setPsPassword(json.data.hasPassword ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "");
          setPsHasPassword(json.data.hasPassword);
          setPsIsLive(json.data.isLive);
        }
      } catch {
        // silently ignore
      } finally {
        setPsLoading(false);
      }
    };
    fetchPs();
  }, []);

  const handleSavePaystation = async () => {
    setPsSaving(true);
    try {
      const body: Record<string, unknown> = {
        merchantId: psMerchantId,
        isLive: psIsLive,
      };
      // Only send password if user typed a new one (not the masked placeholder)
      if (psPassword && psPassword !== "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022") {
        body.password = psPassword;
      }
      const res = await fetch(`${API_BASE}/admin/settings/paystation`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("PayStation settings saved!");
        setPsHasPassword(json.data.hasPassword);
        if (json.data.hasPassword) setPsPassword("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");
        setPsIsLive(json.data.isLive);
      } else {
        toast.error(json.message || "Failed to save PayStation settings");
      }
    } catch {
      toast.error("Failed to save PayStation settings");
    } finally {
      setPsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (threshold < 0 || insideCharge < 0 || outsideCharge < 0) {
      toast.error("Values must be greater than or equal to 0");
      return;
    }
    try {
      const payload = {
        freeDeliveryThreshold: threshold,
        insideDhakaCharge: insideCharge,
        outsideDhakaCharge: outsideCharge,
        isActive,
        deliveryChargePaymentRequired,
      };
      const result = settingsExist
        ? await updateSettings(payload).unwrap()
        : await createSettings(payload).unwrap();
      if (result.ok) {
        toast.success(`Delivery settings ${settingsExist ? "updated" : "created"} successfully!`);
        setSettingsExist(true);
      } else {
        toast.error(result.message || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings. Please try again.");
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (isLoading) {
    return (
      <Page title="Delivery Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" />
        </div>
      </Page>
    );
  }

  const isSaving = isCreating || isUpdating;

  return (
    <Page title="Delivery Settings">
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-teal-800 p-1 text-gray-700 hover:bg-pink-50 transition mt-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Truck className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Delivery Configuration</h2>
            </div>
          </div>

          {data?.data && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {formatDate(data.data.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Updated: {formatDate(data.data.updatedAt)}</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Free Delivery Threshold */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Free Delivery Threshold (BDT) If Order:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  min="0"
                  step="1"
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
                  placeholder="1000"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Orders above this amount get free delivery</p>
            </div>

            {/* Inside / Outside Dhaka charges side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Inside Dhaka Charge (BDT)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-semibold">৳</span>
                  </div>
                  <input
                    type="number"
                    value={insideCharge}
                    onChange={(e) => setInsideCharge(Number(e.target.value))}
                    min="0"
                    step="1"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
                    placeholder="60"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Delivery charge within Dhaka city</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Outside Dhaka Charge (BDT)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-semibold">৳</span>
                  </div>
                  <input
                    type="number"
                    value={outsideCharge}
                    onChange={(e) => setOutsideCharge(Number(e.target.value))}
                    min="0"
                    step="1"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
                    placeholder="120"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Delivery charge outside Dhaka (default)</p>
              </div>
            </div>

            {/* Active toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-cyan-600 transition">
                    Active Status
                  </span>
                  <p className="text-xs text-gray-500">Enable delivery charge system</p>
                </div>
              </label>
            </div>

            {/* Mandatory Delivery Charge Payment toggle */}
            <div className={`rounded-xl border-2 p-4 transition-colors ${
              deliveryChargePaymentRequired
                ? "border-orange-400 bg-orange-50"
                : "border-gray-200 bg-gray-50"
            }`}>
              <div className="flex items-center gap-3">
                <div
                  onClick={() => setDeliveryChargePaymentRequired((v) => !v)}
                  className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0 ${
                    deliveryChargePaymentRequired ? "bg-orange-500" : "bg-gray-300"
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    deliveryChargePaymentRequired ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => setDeliveryChargePaymentRequired((v) => !v)}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold transition ${
                      deliveryChargePaymentRequired ? "text-orange-700" : "text-gray-700"
                    }`}>
                      Mandatory Delivery Charge Payment
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      deliveryChargePaymentRequired
                        ? "bg-orange-200 text-orange-800"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {deliveryChargePaymentRequired ? "ON" : "OFF"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {deliveryChargePaymentRequired
                      ? "Customers MUST pay delivery charge online before placing order. A modal will appear at checkout."
                      : "Customers can choose Cash on Delivery or online payment freely."}
                  </p>
                </div>
              </div>
              {deliveryChargePaymentRequired && (
                <div className="mt-3 p-3 bg-orange-100 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-800 font-semibold mb-1">⚠️ When ON:</p>
                  <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
                    <li>A Bengali modal will appear at checkout explaining the advance delivery charge</li>
                    <li>Customers cannot place order without paying delivery charge first</li>
                    <li>The charge amount shown will match the selected delivery zone (Inside/Outside Dhaka)</li>
                    <li>After successful payment, order is placed automatically</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Info box */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-cyan-800 space-y-1">
                  <p className="font-semibold mb-1">Current Configuration:</p>
                  <p>
                    Orders <span className="font-bold">≥ ৳{threshold}</span> get{" "}
                    <span className="font-bold text-green-600">FREE delivery</span>.
                  </p>
                  <p>
                    Inside Dhaka: <span className="font-bold">৳{insideCharge}</span> &nbsp;|&nbsp;
                    Outside Dhaka: <span className="font-bold">৳{outsideCharge}</span>
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Truck className="w-5 h-5" />
                  <span>{settingsExist ? "Update" : "Create"} Settings</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* PayStation Credentials */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">PayStation Gateway Credentials</h2>
              <p className="text-xs text-gray-500 mt-0.5">Stored securely in database. Used for delivery charge payments.</p>
            </div>
          </div>

          {psLoading ? (
            <div className="flex items-center gap-2 text-gray-400 py-4">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Live / Sandbox toggle */}
              <div className={`rounded-xl border-2 p-4 transition-colors ${
                psIsLive ? "border-green-400 bg-green-50" : "border-yellow-300 bg-yellow-50"
              }`}>
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => setPsIsLive((v) => !v)}
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0 ${
                      psIsLive ? "bg-green-500" : "bg-yellow-400"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      psIsLive ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => setPsIsLive((v) => !v)}>
                    <div className="flex items-center gap-2">
                      {psIsLive
                        ? <ShieldCheck className="w-4 h-4 text-green-600" />
                        : <ShieldAlert className="w-4 h-4 text-yellow-600" />}
                      <span className={`text-sm font-bold ${
                        psIsLive ? "text-green-700" : "text-yellow-700"
                      }`}>
                        {psIsLive ? "Production (Live)" : "Sandbox (Test)"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        psIsLive ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"
                      }`}>
                        {psIsLive ? "LIVE" : "TEST"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {psIsLive
                        ? "Using: https://api.paystation.com.bd — real payments"
                        : "Using: https://sandbox.paystation.com.bd — test payments only"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Merchant ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Merchant ID
                </label>
                <input
                  type="text"
                  value={psMerchantId}
                  onChange={(e) => setPsMerchantId(e.target.value)}
                  placeholder="e.g. 204-16537301811"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition font-mono text-sm"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                  {psHasPassword && (
                    <span className="ml-2 text-xs font-normal text-green-600">✓ saved</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={psPassword}
                    onChange={(e) => setPsPassword(e.target.value)}
                    onFocus={() => {
                      if (psPassword === "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022") setPsPassword("");
                    }}
                    placeholder="Enter PayStation password"
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">Leave unchanged to keep existing password.</p>
              </div>

              <button
                type="button"
                onClick={handleSavePaystation}
                disabled={psSaving}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {psSaving ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Save PayStation Credentials
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
