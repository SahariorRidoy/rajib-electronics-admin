import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./base";
import type { ApiOk, Paginated } from "@/types";
import type { Order, UpdateOrderDTO } from "@/types/order";

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery,
  tagTypes: ["Orders"],
  endpoints: (builder) => ({
    listOrders: builder.query<
      ApiOk<Paginated<Order>>,
      { page?: number; limit?: number; status?: Order["status"]; startDate?: string; endDate?: string } | void
    >({
      query: (args) => {
        const page = String(args?.page ?? 1);
        const limit = String(args?.limit ?? 50);
        const params = new URLSearchParams({ page, limit });
        if (args?.status) params.set("status", args.status);
        if (args?.startDate) params.set("startDate", args.startDate);
        if (args?.endDate) params.set("endDate", args.endDate);
        return `/orders?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data.items
          ? [
              ...result.data.items.map((o) => ({
                type: "Orders" as const,
                id: o._id,
              })),
              { type: "Orders" as const, id: "LIST" },
            ]
          : [{ type: "Orders" as const, id: "LIST" }],
    }),

    getOrder: builder.query<ApiOk<Order>, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (r) =>
        r
          ? [{ type: "Orders", id: r.data._id }]
          : [{ type: "Orders", id: "LIST" }],
    }),

    updateOrderStatus: builder.mutation<
      ApiOk<Order>,
      { id: string; body: UpdateOrderDTO }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (r) =>
        r
          ? [
              { type: "Orders", id: r.data._id },
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
    }),

    deleteOrder: builder.mutation<ApiOk<{ id: string }>, string>({
      query: (id) => ({ url: `/orders/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Orders", id: "LIST" }],
    }),
  }),
});

export const {
  useListOrdersQuery,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
} = ordersApi;

export const useGetOrderByIdQuery = ordersApi.endpoints.getOrder.useQuery;
