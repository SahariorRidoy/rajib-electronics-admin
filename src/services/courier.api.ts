import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./base";

export interface CourierInfo {
  provider: "steadfast" | "pathao";
  consignmentId: string;
  trackingCode?: string;
  status?: string;
  sentAt: string;
}

export interface ShipmentLine {
  productId: string;
  title: string;
  qty: number;
  price: number;
  image?: string;
  color?: string;
}

export interface Shipment {
  _id: string;
  status: string;
  courier: CourierInfo;
  customer: { name: string; phone: string; district?: string };
  totals: { grandTotal: number; subTotal: number; shipping: number };
  lines: ShipmentLine[];
}

export interface PathaoCity {
  city_id: number;
  city_name: string;
}

export interface PathaoZone {
  zone_id: number;
  zone_name: string;
}

export interface PathaoArea {
  area_id: number;
  area_name: string;
}

export interface PathaoStore {
  store_id: number;
  store_name: string;
  store_address: string;
}

export interface PathaoSendPayload {
  store_id: number;
  recipient_city?: number;
  recipient_zone?: number;
  recipient_area?: number;
  delivery_type?: number;        // 48 = Normal, 12 = On Demand
  item_type?: number;            // 1 = Document, 2 = Parcel
  item_weight?: number;
  recipient_secondary_phone?: string;
  special_instruction?: string;
  item_description?: string;
}

export const courierApi = createApi({
  reducerPath: "courierApi",
  baseQuery,
  tagTypes: ["Courier", "Shipments"],
  endpoints: (b) => ({
    // ── Steadfast ──────────────────────────────────────────────────────────
    steadfastBalance: b.query<{ ok: boolean; data: { current_balance: number } }, void>({
      query: () => "/admin/courier/steadfast/balance",
    }),

    steadfastSend: b.mutation<{ ok: boolean; data: unknown }, string>({
      query: (orderId) => ({
        url: `/admin/courier/steadfast/send/${orderId}`,
        method: "POST",
      }),
      invalidatesTags: ["Shipments"],
    }),

    steadfastBulkSend: b.mutation<{ ok: boolean; data: unknown }, string[]>({
      query: (orderIds) => ({
        url: "/admin/courier/steadfast/bulk-send",
        method: "POST",
        body: { orderIds },
      }),
      invalidatesTags: ["Shipments"],
    }),

    steadfastTrack: b.query<{ ok: boolean; data: unknown }, string>({
      query: (orderId) => `/admin/courier/steadfast/track/${orderId}`,
      providesTags: (_r, _e, id) => [{ type: "Courier", id }],
    }),

    steadfastTrackByCode: b.query<{ ok: boolean; data: unknown }, string>({
      query: (trackingCode) => `/admin/courier/steadfast/track-code/${trackingCode}`,
    }),

    steadfastCreateReturn: b.mutation<{ ok: boolean; data: unknown }, {
      consignment_id?: string | number;
      invoice?: string;
      tracking_code?: string;
      reason?: string;
    }>({
      query: (body) => ({ url: "/admin/courier/steadfast/return", method: "POST", body }),
      invalidatesTags: ["Shipments"],
    }),

    steadfastGetReturn: b.query<{ ok: boolean; data: unknown }, string>({
      query: (id) => `/admin/courier/steadfast/return/${id}`,
    }),

    steadfastGetReturns: b.query<{ ok: boolean; data: unknown }, void>({
      query: () => "/admin/courier/steadfast/returns",
    }),

    steadfastGetPayments: b.query<{ ok: boolean; data: unknown }, void>({
      query: () => "/admin/courier/steadfast/payments",
    }),

    steadfastGetPayment: b.query<{ ok: boolean; data: unknown }, string>({
      query: (id) => `/admin/courier/steadfast/payments/${id}`,
    }),

    steadfastGetPoliceStations: b.query<{ ok: boolean; data: unknown }, void>({
      query: () => "/admin/courier/steadfast/police-stations",
    }),

    // ── Pathao ─────────────────────────────────────────────────────────────
    pathaoStores: b.query<{ ok: boolean; data: PathaoStore[] }, void>({
      query: () => "/admin/courier/pathao/stores",
    }),

    pathaoCreateStore: b.mutation<{ ok: boolean; data: unknown }, {
      name: string;
      contact_name: string;
      contact_number: string;
      secondary_contact?: string;
      otp_number?: string;
      address: string;
      city_id: number;
      zone_id: number;
      area_id: number;
    }>({
      query: (body) => ({ url: "/admin/courier/pathao/stores", method: "POST", body }),
    }),

    pathaoCities: b.query<{ ok: boolean; data: PathaoCity[] }, void>({
      query: () => "/admin/courier/pathao/cities",
    }),

    pathaoZones: b.query<{ ok: boolean; data: PathaoZone[] }, number>({
      query: (cityId) => `/admin/courier/pathao/zones/${cityId}`,
    }),

    pathaoAreas: b.query<{ ok: boolean; data: PathaoArea[] }, number>({
      query: (zoneId) => `/admin/courier/pathao/areas/${zoneId}`,
    }),

    pathaoPricePlan: b.mutation<{ ok: boolean; data: unknown }, { store_id: number; item_type: number; delivery_type: number; item_weight: number; recipient_city: number; recipient_zone: number }>({
      query: (body) => ({ url: "/admin/courier/pathao/price-plan", method: "POST", body }),
    }),

    pathaoSend: b.mutation<{ ok: boolean; data: unknown }, { orderId: string; body: PathaoSendPayload }>({
      query: ({ orderId, body }) => ({
        url: `/admin/courier/pathao/send/${orderId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shipments"],
    }),

    pathaoBulkSend: b.mutation<{ ok: boolean; data: unknown }, {
      orders: Array<{
        orderId: string;
        store_id: number;
        delivery_type?: number;
        item_type?: number;
        item_weight?: number;
        special_instruction?: string;
        item_description?: string;
      }>;
    }>({
      query: (body) => ({
        url: "/admin/courier/pathao/bulk-send",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shipments"],
    }),

    pathaoTrack: b.query<{ ok: boolean; data: unknown }, string>({
      query: (orderId) => `/admin/courier/pathao/track/${orderId}`,
      providesTags: (_r, _e, id) => [{ type: "Courier", id }],
    }),

    pathaoCancel: b.mutation<{ ok: boolean; data: unknown }, string>({
      query: (orderId) => ({
        url: `/admin/courier/pathao/cancel/${orderId}`,
        method: "POST",
      }),
      invalidatesTags: ["Shipments"],
    }),

    // ── Shared ─────────────────────────────────────────────────────────────
    getOrderCourier: b.query<{ ok: boolean; data: { courier?: CourierInfo; status: string } }, string>({
      query: (orderId) => `/admin/courier/order/${orderId}`,
      providesTags: (_r, _e, id) => [{ type: "Courier", id }],
    }),

    listShipments: b.query<
      { ok: boolean; data: { items: Shipment[]; total: number; page: number; limit: number } },
      { provider?: "steadfast" | "pathao"; page?: number; limit?: number } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.provider) params.set("provider", args.provider);
        if (args?.page) params.set("page", String(args.page));
        if (args?.limit) params.set("limit", String(args.limit));
        return `/admin/courier/shipments?${params.toString()}`;
      },
      providesTags: ["Shipments"],
    }),
  }),
});

export const {
  useSteadfastBalanceQuery,
  useSteadfastSendMutation,
  useSteadfastBulkSendMutation,
  useSteadfastTrackQuery,
  useSteadfastTrackByCodeQuery,
  useSteadfastCreateReturnMutation,
  useSteadfastGetReturnQuery,
  useSteadfastGetReturnsQuery,
  useSteadfastGetPaymentsQuery,
  useSteadfastGetPaymentQuery,
  useSteadfastGetPoliceStationsQuery,
  usePathaoStoresQuery,
  usePathaoCreateStoreMutation,
  usePathaoCitiesQuery,
  usePathaoZonesQuery,
  usePathaoAreasQuery,
  usePathaoPricePlanMutation,
  usePathaoSendMutation,
  usePathaoBulkSendMutation,
  usePathaoTrackQuery,
  usePathaoCancelMutation,
  useGetOrderCourierQuery,
  useListShipmentsQuery,
} = courierApi;
