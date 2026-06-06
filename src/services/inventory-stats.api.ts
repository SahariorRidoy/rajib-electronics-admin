import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE;

export const inventoryStatsApi = createApi({
  reducerPath: "inventoryStatsApi",
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
  tagTypes: ["InventoryStats"],
  endpoints: (builder) => ({
    getStockOverview: builder.query<{ data: { totalProducts: number; outOfStock: number; lowStock: number; totalValue: number } }, { threshold?: number }>({
      query: (params) => {
        const usp = new URLSearchParams();
        if (params?.threshold) usp.set("threshold", String(params.threshold));
        return { url: `/admin/stock/overview?${usp.toString()}`, method: "GET" };
      },
      providesTags: ["InventoryStats"],
    }),
  }),
});

export const { useGetStockOverviewQuery } = inventoryStatsApi;