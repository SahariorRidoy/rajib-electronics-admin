import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./base";
import type { Banner, CreateBannerRequest, UpdateBannerRequest } from "@/types/banner";

export const bannersApi = createApi({
  reducerPath: "bannersApi",
  baseQuery,
  tagTypes: ["Banners"],
  endpoints: (builder) => ({
    getBanners: builder.query<Banner[], void>({
      query: () => ({
        url: "/admin/banners",
        method: "GET",
      }),
      transformResponse: (response: { ok: boolean; data: Banner[] }) => response.data,
      providesTags: ["Banners"],
    }),

    createBanner: builder.mutation<{ id: string }, CreateBannerRequest>({
      query: (body) => ({
        url: "/admin/banners",
        method: "POST",
        body,
      }),
      transformResponse: (response: { ok: boolean; data: { id: string } }) => response.data,
      invalidatesTags: ["Banners"],
    }),

    updateBanner: builder.mutation<void, { id: string } & UpdateBannerRequest>({
      query: ({ id, ...body }) => ({
        url: `/admin/banners/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Banners"],
    }),

    deleteBanner: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/banners/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Banners"],
    }),
  }),
});

export const {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} = bannersApi;