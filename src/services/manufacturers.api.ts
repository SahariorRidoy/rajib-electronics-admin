import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE;

export const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export type Manufacturer = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  status: "ACTIVE" | "HIDDEN";
};

export type CreateManufacturerDTO = {
  name: string;
  slug: string;
  image?: string;
  description?: string;
  status: "ACTIVE" | "HIDDEN";
};

export const manufacturersApi = createApi({
  reducerPath: "manufacturersApi",
  baseQuery,
  tagTypes: ["Manufacturers"],
  endpoints: (builder) => ({
    listManufacturers: builder.query<{ ok: boolean; data: Manufacturer[] }, void>({
      query: () => ({ url: "/admin/manufacturers", method: "GET" }),
      providesTags: ["Manufacturers"],
    }),

    createManufacturer: builder.mutation<{ ok: boolean; data: { id: string; slug: string } }, CreateManufacturerDTO>({
      query: (body) => ({
        url: "/admin/manufacturers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Manufacturers"],
    }),

    updateManufacturer: builder.mutation<{ ok: boolean; data: Manufacturer }, { id: string; body: Partial<CreateManufacturerDTO> }>({
      query: ({ id, body }) => ({
        url: `/admin/manufacturers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Manufacturers"],
    }),

    deleteManufacturer: builder.mutation<{ ok: boolean; data: { id: string } }, string>({
      query: (id) => ({
        url: `/admin/manufacturers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Manufacturers"],
    }),
  }),
});

export const {
  useListManufacturersQuery,
  useCreateManufacturerMutation,
  useUpdateManufacturerMutation,
  useDeleteManufacturerMutation,
} = manufacturersApi;
