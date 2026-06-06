import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE;

export const stockFilterApi = createApi({
  reducerPath: "stockFilterApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = typeof window !== "undefined" 
        ? localStorage.getItem("accessToken") || localStorage.getItem("token") || localStorage.getItem("authToken")
        : null;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("content-type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["StockFilter"],
  endpoints: (builder) => ({
    getOutOfStockProducts: builder.query<{ data: Array<{ _id: string; title: string; stock: number; price: number; images?: string[] }> }, void>({
      query: () => ({ url: `/admin/stock/out-of-stock`, method: "GET" }),
      providesTags: ["StockFilter"],
    }),
    getLowStockProducts: builder.query<{ data: Array<{ _id: string; title: string; stock: number; price: number; images?: string[] }> }, { threshold?: number }>({
      query: (params) => {
        const usp = new URLSearchParams();
        if (params?.threshold) usp.set("threshold", String(params.threshold));
        return { url: `/admin/stock/low-stock?${usp.toString()}`, method: "GET" };
      },
      providesTags: ["StockFilter"],
    }),
  }),
});

export const { useGetOutOfStockProductsQuery, useGetLowStockProductsQuery } = stockFilterApi;