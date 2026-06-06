import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./base";
import type { AdminLoginDTO, AdminLoginRes, RefreshTokenDTO, RefreshTokenRes } from "@/types/auth";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  endpoints: (builder) => ({
    adminLogin: builder.mutation<AdminLoginRes, AdminLoginDTO>({
      query: (body) => ({
        url: "/admin/auth/login",
        method: "POST",
        body,
      }),
    }),
    refreshToken: builder.mutation<RefreshTokenRes, RefreshTokenDTO>({
      query: (body) => ({
        url: "/admin/auth/refresh",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useAdminLoginMutation, useRefreshTokenMutation } = authApi;
