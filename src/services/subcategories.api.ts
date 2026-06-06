import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Subcategory, CreateSubcategoryDTO } from "@/types/category";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE;

export const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const subcategoriesApi = createApi({
  reducerPath: "subcategoriesApi",
  baseQuery,
  tagTypes: ["Subcategories"],
  endpoints: (builder) => ({
    listSubcategories: builder.query<
      { ok: boolean; data: Subcategory[] },
      { categoryId?: string } | void
    >({
      query: (params) => {
        const url = params?.categoryId
          ? `/admin/subcategories?categoryId=${params.categoryId}`
          : "/admin/subcategories";
        return { url, method: "GET" };
      },
      providesTags: ["Subcategories"],
    }),

    getSubcategory: builder.query<
      { ok: boolean; data: Subcategory },
      string
    >({
      query: (id) => ({ url: `/admin/subcategories/${id}`, method: "GET" }),
      providesTags: ["Subcategories"],
    }),

    createSubcategory: builder.mutation<
      { ok: boolean; data: { id: string; slug: string } },
      CreateSubcategoryDTO
    >({
      query: (body) => ({
        url: "/admin/subcategories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subcategories"],
    }),

    updateSubcategory: builder.mutation<
      { ok: boolean; data: Subcategory },
      { id: string; body: Partial<CreateSubcategoryDTO> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/subcategories/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Subcategories"],
    }),

    deleteSubcategory: builder.mutation<
      { ok: boolean; data: { id: string } },
      string
    >({
      query: (id) => ({
        url: `/admin/subcategories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subcategories"],
    }),
  }),
});

export const {
  useListSubcategoriesQuery,
  useGetSubcategoryQuery,
  useCreateSubcategoryMutation,
  useUpdateSubcategoryMutation,
  useDeleteSubcategoryMutation,
} = subcategoriesApi;
