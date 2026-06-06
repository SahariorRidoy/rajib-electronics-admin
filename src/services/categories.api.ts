import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Category, CreateCategoryDTO } from "@/types/category";

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

export const categoriesApi = createApi({
  reducerPath: "categoriesApi",
  baseQuery,
  tagTypes: ["Categories"],
  endpoints: (builder) => ({
    listCategories: builder.query<{ ok: boolean; data: Category[] }, void>({
      query: () => ({ url: "/categories", method: "GET" }),
      providesTags: ["Categories"],
    }),

    createCategory: builder.mutation<
      { ok: boolean; data: { id: string; slug: string } },
      CreateCategoryDTO
    >({
      query: (body) => ({
        url: "/admin/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Categories"],
    }),

    updateCategory: builder.mutation<
      { ok: boolean; data: Category },
      { id: string; body: Partial<CreateCategoryDTO> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/categories/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Categories"],
    }),

    deleteCategory: builder.mutation<
      { ok: boolean; data: { id: string } },
      string
    >({
      query: (id) => ({
        url: `/admin/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
