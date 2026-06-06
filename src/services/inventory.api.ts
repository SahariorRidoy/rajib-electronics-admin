import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./base";
import type { StockMovement, AddStockRequest, RemoveStockRequest } from "@/types/inventory";
import { productsApi } from "./products.api";

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery,
  tagTypes: ["StockHistory"],
  endpoints: (builder) => ({
    getStockHistory: builder.query<StockMovement[], string>({
      query: (productId) => ({
        url: `/admin/products/${productId}/stock/history`,
        method: "GET",
      }),
      transformResponse: (response: { ok: boolean; data: StockMovement[] }) => response.data,
      providesTags: ["StockHistory"],
    }),

    addStock: builder.mutation<void, { productId: string } & AddStockRequest>({
      query: ({ productId, ...body }) => ({
        url: `/admin/products/${productId}/stock/add`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["StockHistory"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(productsApi.util.invalidateTags(["Products"]));
      },
    }),

    removeStock: builder.mutation<void, { productId: string } & RemoveStockRequest>({
      query: ({ productId, ...body }) => ({
        url: `/admin/products/${productId}/stock/remove`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["StockHistory"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(productsApi.util.invalidateTags(["Products"]));
      },
    }),
  }),
});

export const {
  useGetStockHistoryQuery,
  useAddStockMutation,
  useRemoveStockMutation,
} = inventoryApi;