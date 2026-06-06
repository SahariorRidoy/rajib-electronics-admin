import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./base";
import type { ApiOk, Paginated } from "@/types";
import type { User } from "@/types/user";

export const customersApi = createApi({
  reducerPath: "customersApi",
  baseQuery,
  tagTypes: ["Customers"],
  endpoints: (builder) => ({
    listCustomers: builder.query<
      ApiOk<Paginated<User>>,
      { page?: number; limit?: number; search?: string } | void
    >({
      query: (args) => {
        const page = String(args?.page ?? 1);
        const limit = String(args?.limit ?? 50);
        const params = new URLSearchParams({ page, limit });
        if (args?.search) params.set("search", args.search);
        return `/admin/customers?${params.toString()}`;
      },
      providesTags: ["Customers"],
    }),
    getCustomer: builder.query<ApiOk<User>, string>({
      query: (id) => `/admin/customers/${id}`,
      providesTags: (r) => r ? [{ type: "Customers", id: r.data._id }] : ["Customers"],
    }),
    getCustomerOrders: builder.query<
      ApiOk<Paginated<Record<string, unknown>>>,
      { id: string; page?: number; limit?: number }
    >({
      query: ({ id, page = 1, limit = 50 }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        return `/admin/customers/${id}/orders?${params.toString()}`;
      },
    }),
  }),
});

export const { 
  useListCustomersQuery, 
  useGetCustomerQuery,
  useGetCustomerOrdersQuery 
} = customersApi;
