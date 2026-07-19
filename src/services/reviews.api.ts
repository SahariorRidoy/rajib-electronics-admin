import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Review {
  _id: string;
  productSlug: string;
  name: string;
  image?: string;
  message: string;
  rating: number;
  status: "pending" | "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsResponse {
  ok: boolean;
  data: {
    reviews: Review[];
    total: number;
    page: number;
    pages: number;
  };
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE ?? "";

export const reviewsApi = createApi({
  reducerPath: "reviewsApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") || localStorage.getItem("token")
          : null;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("content-type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Reviews"],
  endpoints: (builder) => ({
    listReviews: builder.query<ReviewsResponse, { status?: string; productSlug?: string; page?: number }>({
      query: (p) => {
        const usp = new URLSearchParams();
        if (p?.status) usp.set("status", p.status);
        if (p?.productSlug) usp.set("productSlug", p.productSlug);
        if (p?.page) usp.set("page", String(p.page));
        return { url: `/admin/reviews?${usp.toString()}`, method: "GET" };
      },
      providesTags: ["Reviews"],
    }),
    createReview: builder.mutation<{ ok: boolean; data: Review }, Partial<Review>>({
      query: (body) => ({ url: `/admin/reviews`, method: "POST", body }),
      invalidatesTags: ["Reviews"],
    }),
    updateReview: builder.mutation<{ ok: boolean; data: Review }, { id: string } & Partial<Review>>({
      query: ({ id, ...body }) => ({ url: `/admin/reviews/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Reviews"],
    }),
    deleteReview: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/reviews/${id}`, method: "DELETE" }),
      invalidatesTags: ["Reviews"],
    }),
  }),
});

export const {
  useListReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = reviewsApi;
