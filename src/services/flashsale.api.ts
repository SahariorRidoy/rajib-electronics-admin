import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./base";

export interface FlashSaleItem {
  productId: string;
  title: string;
  image: string;
  regularPrice: number;
  salePrice: number;
  saleQty: number;
  soldQty: number;
}

export interface FlashSale {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  startAt: string;
  endAt: string;
  status: "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED";
  items: FlashSaleItem[];
  createdAt?: string;
}

export interface FlashSaleStats {
  sale: FlashSale;
  totalRevenue: number;
  totalSold: number;
  items: Array<{
    productId: string;
    title: string;
    image: string;
    regularPrice: number;
    salePrice: number;
    saleQty: number;
    soldQty: number;
    remaining: number;
    revenue: number;
  }>;
}

export type CreateFlashSaleDTO = {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  items: Array<{ productId: string; salePrice: number; saleQty: number }>;
};

export const flashSaleApi = createApi({
  reducerPath: "flashSaleApi",
  baseQuery,
  tagTypes: ["FlashSale"],
  endpoints: (builder) => ({
    listFlashSales: builder.query<FlashSale[], void>({
      query: () => ({ url: "/admin/flash-sales", method: "GET" }),
      transformResponse: (res: { ok: boolean; data: FlashSale[] }) => res.data,
      providesTags: [{ type: "FlashSale", id: "LIST" }],
    }),

    getFlashSale: builder.query<FlashSale, string>({
      query: (id) => ({ url: `/admin/flash-sales/${id}`, method: "GET" }),
      transformResponse: (res: { ok: boolean; data: FlashSale }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "FlashSale", id }],
    }),

    getFlashSaleStats: builder.query<FlashSaleStats, string>({
      query: (id) => ({ url: `/admin/flash-sales/${id}/stats`, method: "GET" }),
      transformResponse: (res: { ok: boolean; data: FlashSaleStats }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "FlashSale", id }],
    }),

    createFlashSale: builder.mutation<FlashSale, CreateFlashSaleDTO>({
      query: (body) => ({ url: "/admin/flash-sales", method: "POST", body }),
      transformResponse: (res: { ok: boolean; data: FlashSale }) => res.data,
      invalidatesTags: [{ type: "FlashSale", id: "LIST" }],
    }),

    updateFlashSale: builder.mutation<FlashSale, { id: string } & Partial<CreateFlashSaleDTO>>({
      query: ({ id, ...body }) => ({ url: `/admin/flash-sales/${id}`, method: "PATCH", body }),
      transformResponse: (res: { ok: boolean; data: FlashSale }) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "FlashSale", id }, { type: "FlashSale", id: "LIST" }],
    }),

    togglePauseFlashSale: builder.mutation<FlashSale, string>({
      query: (id) => ({ url: `/admin/flash-sales/${id}/pause`, method: "PATCH" }),
      transformResponse: (res: { ok: boolean; data: FlashSale }) => res.data,
      invalidatesTags: (_r, _e, id) => [{ type: "FlashSale", id }, { type: "FlashSale", id: "LIST" }],
    }),

    deleteFlashSale: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/flash-sales/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "FlashSale", id: "LIST" }],
    }),
  }),
});

export const {
  useListFlashSalesQuery,
  useGetFlashSaleQuery,
  useGetFlashSaleStatsQuery,
  useCreateFlashSaleMutation,
  useUpdateFlashSaleMutation,
  useTogglePauseFlashSaleMutation,
  useDeleteFlashSaleMutation,
} = flashSaleApi;
