"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Loader2, Send, Calculator, Info, MapPin,
  User, Phone, Package, ChevronDown, Store,
  Weight, FileText, Zap, Clock, Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  usePathaoStoresQuery,
  usePathaoCitiesQuery,
  usePathaoZonesQuery,
  usePathaoAreasQuery,
  usePathaoSendMutation,
  usePathaoPricePlanMutation,
  type PathaoSendPayload,
  type PathaoStore,
  type PathaoCity,
  type PathaoZone,
  type PathaoArea,
} from "@/services/courier.api";
import type { Order } from "@/types/order";
import { formatAddress } from "@/lib/address";

interface Props {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Reusable searchable dropdown showing max 10 items with scroll ──
function SearchableSelect({
  label, required, disabled, loading, value, placeholder, hint,
  options, onChange,
}: {
  label: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  value: number | "";
  placeholder: string;
  hint?: string;
  options: { id: number; label: string }[];
  onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = q.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (id: number) => {
    onChange(id);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="space-y-1" ref={ref}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700">
          {label} {required && <span className="text-purple-500">*</span>}
        </label>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => { if (!disabled && !loading) setOpen((p) => !p); }}
        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition focus:outline-none ${
          disabled || loading
            ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
            : open
            ? "border-purple-400 ring-2 ring-purple-200 bg-white"
            : value
            ? "border-purple-300 bg-white text-gray-800 hover:border-purple-400"
            : "border-gray-200 bg-white text-gray-400 hover:border-purple-300"
        }`}
      >
        <span className="truncate text-left">
          {loading ? "Loading..." : selected ? selected.label : placeholder}
        </span>
        {loading
          ? <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin flex-shrink-0" />
          : <ChevronDown className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        }
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-purple-200 rounded-xl shadow-xl overflow-hidden"
          style={{ minWidth: "160px" }}
        >
          {/* Search input */}
          <div className="px-2.5 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                className="w-full pl-6 pr-2 py-1 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-300 focus:border-purple-400"
              />
            </div>
          </div>

          {/* List — max 10 items visible, then scroll */}
          <ul className="overflow-y-auto" style={{ maxHeight: "200px" }}>
            {filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-gray-400 text-center">No results</li>
            ) : (
              filtered.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(o.id)}
                    className={`w-full text-left px-3 py-2 text-xs transition hover:bg-purple-50 ${
                      value === o.id ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-700"
                    }`}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Native select for Store (long text, no search needed) ──
function StoreSelect({
  loading, value, onChange, stores,
}: {
  loading: boolean; value: number | "";
  onChange: (v: number) => void; stores: PathaoStore[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-700">
        Store <span className="text-purple-500">*</span>
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          required
          disabled={loading}
          className={`w-full px-3 py-2.5 pr-8 rounded-xl border text-sm appearance-none transition focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 bg-white ${
            loading ? "border-gray-100 bg-gray-50 text-gray-400" : value ? "border-purple-300 text-gray-800" : "border-gray-200 text-gray-500"
          }`}
        >
          <option value="">{loading ? "Loading stores..." : "Select pickup store"}</option>
          {stores.map((s) => (
            <option key={s.store_id} value={s.store_id}>
              {s.store_name} — {s.store_address}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
          {loading
            ? <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          }
        </div>
      </div>
    </div>
  );
}

export default function PathaoSendModal({ order, onClose, onSuccess }: Props) {
  const [storeId, setStoreId] = useState<number | "">("");
  const [cityId, setCityId] = useState<number | "">("");
  const [zoneId, setZoneId] = useState<number | "">("");
  const [areaId, setAreaId] = useState<number | "">("");
  const [deliveryType, setDeliveryType] = useState(48);
  const [itemType, setItemType] = useState(2);
  const [itemWeight, setItemWeight] = useState(0.5);
  const [specialInstruction, setSpecialInstruction] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [pricePlanResult, setPricePlanResult] = useState<Record<string, unknown> | null>(null);

  const { data: storesData, isLoading: loadingStores } = usePathaoStoresQuery();
  const { data: citiesData, isLoading: loadingCities } = usePathaoCitiesQuery();
  const { data: zonesData, isLoading: loadingZones } = usePathaoZonesQuery(cityId as number, { skip: !cityId });
  const { data: areasData, isLoading: loadingAreas } = usePathaoAreasQuery(zoneId as number, { skip: !zoneId });

  const [pathaoSend, { isLoading: isSending }] = usePathaoSendMutation();
  const [getPricePlan, { isLoading: isCheckingPrice }] = usePathaoPricePlanMutation();

  const stores: PathaoStore[] = storesData?.data ?? [];
  const cities: PathaoCity[] = citiesData?.data ?? [];
  const zones: PathaoZone[] = zonesData?.data ?? [];
  const areas: PathaoArea[] = areasData?.data ?? [];

  // auto-select first store
  useEffect(() => {
    if (stores.length > 0 && storeId === "") setStoreId(stores[0].store_id);
  }, [stores, storeId]);

  useEffect(() => { setZoneId(""); setAreaId(""); setPricePlanResult(null); }, [cityId]);
  useEffect(() => { setAreaId(""); setPricePlanResult(null); }, [zoneId]);

  const address = formatAddress(order.customer.address);

  const isFormReady = !!storeId && !!cityId && !!zoneId;

  const handleCheckPrice = async () => {
    if (!isFormReady) { toast.error("Select store, city and zone first"); return; }
    try {
      const result = await getPricePlan({
        store_id: storeId as number,
        item_type: itemType,
        delivery_type: deliveryType,
        item_weight: itemWeight,
        recipient_city: cityId as number,
        recipient_zone: zoneId as number,
      }).unwrap();
      setPricePlanResult((result as { data: Record<string, unknown> })?.data ?? result);
    } catch {
      toast.error("Could not fetch price plan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormReady) { toast.error("Store, city and zone are required"); return; }
    const body: PathaoSendPayload = {
      store_id: storeId as number,
      recipient_city: cityId as number,
      recipient_zone: zoneId as number,
      recipient_area: areaId ? (areaId as number) : undefined,
      delivery_type: deliveryType,
      item_type: itemType,
      item_weight: itemWeight,
      special_instruction: specialInstruction || undefined,
      item_description: itemDescription || undefined,
    };
    try {
      await pathaoSend({ orderId: order._id, body }).unwrap();
      toast.success("Order sent to Pathao successfully!");
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string; code?: string } };
      toast.error(String(err?.data?.message || err?.data?.code || "Send failed"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] border border-purple-100/50">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Send via Pathao</h2>
              <p className="text-[10px] sm:text-xs text-gray-400 font-mono truncate max-w-[180px] sm:max-w-xs">{order._id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 space-y-5">

            {/* Customer summary */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 via-purple-50 to-blue-50 border border-purple-100 overflow-hidden">
              <div className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                    <span className="text-sm font-bold text-gray-800 truncate">{order.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600">{order.customer.phone}</span>
                  </div>
                  {address && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-500 leading-relaxed">{address}</span>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">COD</p>
                  <p className="text-xl font-black text-purple-700">৳{order.totals.grandTotal}</p>
                  <p className="text-[10px] text-gray-400">{order.lines.length} item{order.lines.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-purple-100 bg-white/50 flex flex-wrap gap-1.5">
                {order.lines.map((l, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-purple-200 rounded-lg text-[11px] text-gray-700 shadow-sm">
                    <Package className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span className="font-medium truncate max-w-[120px] sm:max-w-[160px]">{l.title}</span>
                    <span className="text-purple-400 font-semibold">×{l.qty}</span>
                    {l.color && <span className="text-gray-400">· {l.color}</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Pickup */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" /> Pickup
              </p>
              <StoreSelect loading={loadingStores} value={storeId} onChange={setStoreId} stores={stores} />
            </div>

            {/* Delivery Location */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Delivery Location
              </p>
              <div className="grid grid-cols-2 gap-3 relative">
                <SearchableSelect
                  label="City" required loading={loadingCities}
                  value={cityId} placeholder="Select city"
                  options={cities.map((c) => ({ id: c.city_id, label: c.city_name }))}
                  onChange={(id) => setCityId(id)}
                />
                <SearchableSelect
                  label="Zone" required loading={loadingZones}
                  disabled={!cityId} value={zoneId}
                  placeholder={!cityId ? "Pick city first" : "Select zone"}
                  hint={!cityId ? "pick city first" : undefined}
                  options={zones.map((z) => ({ id: z.zone_id, label: z.zone_name }))}
                  onChange={(id) => setZoneId(id)}
                />
              </div>
              <div className="mt-3 relative">
                <SearchableSelect
                  label="Area" loading={loadingAreas}
                  disabled={!zoneId} value={areaId}
                  placeholder={!zoneId ? "Select zone first" : "Select area (optional)"}
                  hint="optional"
                  options={areas.map((a) => ({ id: a.area_id, label: a.area_name }))}
                  onChange={(id) => setAreaId(id)}
                />
              </div>
            </div>

            {/* Parcel Details */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Parcel Details
              </p>

              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-700 mb-2 block">
                  Delivery Type <span className="text-purple-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 48, label: "Normal", sub: "48 hours", Icon: Clock },
                    { value: 12, label: "Express", sub: "12 hours", Icon: Zap },
                  ].map(({ value, label, sub, Icon }) => (
                    <button key={value} type="button" onClick={() => setDeliveryType(value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition text-left ${
                        deliveryType === value ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/30"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${deliveryType === value ? "bg-purple-500" : "bg-gray-100"}`}>
                        <Icon className={`w-3.5 h-3.5 ${deliveryType === value ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${deliveryType === value ? "text-purple-700" : "text-gray-700"}`}>{label}</p>
                        <p className="text-[10px] text-gray-400">{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Item Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 2, label: "Parcel", Icon: Package },
                    { value: 1, label: "Document", Icon: FileText },
                  ].map(({ value, label, Icon }) => (
                    <button key={value} type="button" onClick={() => setItemType(value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition text-left ${
                        itemType === value ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/30"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${itemType === value ? "bg-purple-500" : "bg-gray-100"}`}>
                        <Icon className={`w-3.5 h-3.5 ${itemType === value ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <p className={`text-xs font-bold ${itemType === value ? "text-purple-700" : "text-gray-700"}`}>{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Weight className="w-3.5 h-3.5 text-gray-400" /> Item Weight (kg)
                </label>
                <div className="flex gap-2">
                  <input type="number" min={0.1} step={0.1} value={itemWeight}
                    onChange={(e) => setItemWeight(Number(e.target.value))}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition"
                  />
                  <button type="button" onClick={handleCheckPrice}
                    disabled={isCheckingPrice || !isFormReady}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition whitespace-nowrap"
                  >
                    {isCheckingPrice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
                    Check Price
                  </button>
                </div>
              </div>

              {pricePlanResult && (
                <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mb-2">
                    <Info className="w-3.5 h-3.5" /> Delivery Price Plan
                  </p>
                  <pre className="text-xs text-emerald-800 whitespace-pre-wrap break-all leading-relaxed">
                    {JSON.stringify(pricePlanResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Optional Info */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Optional Info
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Special Instruction</label>
                  <input type="text" value={specialInstruction} onChange={(e) => setSpecialInstruction(e.target.value)}
                    placeholder="e.g. Handle with care, call before delivery"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Item Description</label>
                  <input type="text" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="e.g. Electronics, Mobile accessories"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>

          </div>
        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white sm:rounded-b-2xl">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSending || !isFormReady}
            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-bold hover:from-purple-700 hover:to-purple-800 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition shadow-md shadow-purple-200"
          >
            {isSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send to Pathao</>}
          </button>
        </div>

      </div>
    </div>
  );
}
