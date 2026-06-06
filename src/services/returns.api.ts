import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./base";

export interface ProcessReturnRequest {
  orderId: string;
  reason: string;
  items: { productId: string; quantity: number }[];
  notes?: string;
}

export const returnsApi = createApi({
  reducerPath: "returnsApi",
  baseQuery,
  tagTypes: ["Returns"],
  endpoints: (builder) => ({
    processReturn: builder.mutation<{ success: boolean; message: string }, ProcessReturnRequest>({
      query: (body) => ({
        url: "/admin/returns",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Returns"],
    }),
  }),
});

export const { useProcessReturnMutation } = returnsApi;
