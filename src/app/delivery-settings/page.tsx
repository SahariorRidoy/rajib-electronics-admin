"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetDeliverySettingsQuery, useCreateDeliverySettingsMutation, useUpdateDeliverySettingsMutation } from "@/services/delivery.api";
import { Package, Truck, Info, ArrowLeft, Calendar, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Page from "@/components/Page";

export default function DeliverySettingsPage() {
  const router = useRouter();
  const { data, isLoading } = useGetDeliverySettingsQuery();
  const [createSettings, { isLoading: isCreating }] = useCreateDeliverySettingsMutation();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateDeliverySettingsMutation();

  const [threshold, setThreshold] = useState(0);
  const [charge, setCharge] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [settingsExist, setSettingsExist] = useState(false);

  useEffect(() => {
    if (data?.data) {
      setThreshold(data.data.freeDeliveryThreshold);
      setCharge(data.data.deliveryCharge);
      setIsActive(data.data.isActive);
      setSettingsExist(true);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (threshold < 0 || charge < 0) {
      toast.error("Values must be greater than or equal to 0");
      return;
    }

    try {
      const payload = {
        freeDeliveryThreshold: threshold,
        deliveryCharge: charge,
        isActive,
      };

      const result = settingsExist
        ? await updateSettings(payload).unwrap()
        : await createSettings(payload).unwrap();

      if (result.ok) {
        toast.success(`Delivery settings ${settingsExist ? 'updated' : 'created'} successfully!`);
        setSettingsExist(true);
      } else {
        toast.error(result.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save settings. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Page title="Delivery Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
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
      <div className="max-w-2xl mx-auto">
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Charge (BDT)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-semibold">৳</span>
                </div>
                <input
                  type="number"
                  value={charge}
                  onChange={(e) => setCharge(Number(e.target.value))}
                  min="0"
                  step="1"
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
                  placeholder="50"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Charge applied to orders below threshold</p>
            </div>

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

            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-cyan-800">
                  <p className="font-semibold mb-1">Current Configuration:</p>
                  <p>
                    Orders more than<span className="font-bold">≥ ৳{threshold}</span> get{" "}
                    <span className="font-bold text-green-600">FREE delivery</span>.
                  </p>
                  <p>
                    Orders less than <span className="font-bold">≥ ৳{threshold}</span> need delivery charge{" "}
                    <span className="font-bold">৳{charge}</span>.
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
                  <span>{settingsExist ? 'Update' : 'Create'} Settings</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </Page>
  );
}
