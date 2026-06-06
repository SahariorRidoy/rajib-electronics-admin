import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./base";
import type { ApiOk, Paginated } from "@/types";
import type { User } from "@/types/user";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery,
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    listUsers: builder.query<
      ApiOk<Paginated<User>>,
      { page?: number; limit?: number } | void
    >({
      query: (args) => {
        const page = String(args?.page ?? 1);
        const limit = String(args?.limit ?? 50);
        const params = new URLSearchParams({ page, limit });
        return `/admin/users?${params.toString()}`;
      },
      providesTags: ["Users"],
    }),
  }),
});

export const { useListUsersQuery } = usersApi;
