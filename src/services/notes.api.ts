import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./base";
import type { ApiOk } from "@/types";

export type AdminNote = {
  _id: string;
  text: string;
  createdAt: string;
};

export const notesApi = createApi({
  reducerPath: "notesApi",
  baseQuery,
  tagTypes: ["Notes"],
  endpoints: (builder) => ({
    listNotes: builder.query<ApiOk<AdminNote[]>, void>({
      query: () => "/admin/notes",
      providesTags: [{ type: "Notes", id: "LIST" }],
    }),
    createNote: builder.mutation<ApiOk<AdminNote>, { text: string }>({
      query: (body) => ({ url: "/admin/notes", method: "POST", body }),
      invalidatesTags: [{ type: "Notes", id: "LIST" }],
    }),
    updateNote: builder.mutation<ApiOk<AdminNote>, { id: string; text: string }>({
      query: ({ id, text }) => ({ url: `/admin/notes/${id}`, method: "PATCH", body: { text } }),
      invalidatesTags: [{ type: "Notes", id: "LIST" }],
    }),
    deleteNote: builder.mutation<ApiOk<{ id: string }>, string>({
      query: (id) => ({ url: `/admin/notes/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Notes", id: "LIST" }],
    }),
  }),
});

export const { useListNotesQuery, useCreateNoteMutation, useUpdateNoteMutation, useDeleteNoteMutation } = notesApi;
