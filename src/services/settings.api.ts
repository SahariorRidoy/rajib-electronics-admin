import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQuery, API_BASE } from "./base";

export interface Logo {
  _id: string;
  logoUrl: string;
  logoPublicId: string;
  isActive: boolean;
}

export interface SocialLink {
  _id: string;
  platform: string;
  value: string;
  label?: string;
}

export interface ContactInfo {
  phones: string[];
  emails: string[];
}

export interface SiteSettings {
  _id: string;
  siteName: string;
  logos: Logo[];
  contactInfo: ContactInfo;
  socialLinks: SocialLink[];
}

export const publicSettingsApi = createApi({
  reducerPath: "publicSettingsApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  endpoints: (builder) => ({
    getPublicSettings: builder.query<SiteSettings, void>({
      query: () => "/settings",
      transformResponse: (res: { ok: boolean; data: SiteSettings }) => res.data,
    }),
  }),
});

export const { useGetPublicSettingsQuery } = publicSettingsApi;

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery,
  tagTypes: ["Settings"],
  endpoints: (builder) => ({
    getSettings: builder.query<SiteSettings, void>({
      query: () => "/admin/settings",
      transformResponse: (res: { ok: boolean; data: SiteSettings }) => res.data,
      providesTags: ["Settings"],
    }),
    updateSiteName: builder.mutation<SiteSettings, { siteName: string }>({
      query: (body) => ({ url: "/admin/settings", method: "PATCH", body }),
      transformResponse: (res: { ok: boolean; data: SiteSettings }) => res.data,
      invalidatesTags: ["Settings"],
    }),
    addLogo: builder.mutation<SiteSettings, { logoUrl: string; logoPublicId: string }>({
      query: (body) => ({ url: "/admin/settings/logos", method: "POST", body }),
      transformResponse: (res: { ok: boolean; data: SiteSettings }) => res.data,
      invalidatesTags: ["Settings"],
    }),
    activateLogo: builder.mutation<SiteSettings, string>({
      query: (logoId) => ({ url: `/admin/settings/logos/${logoId}/activate`, method: "PATCH" }),
      transformResponse: (res: { ok: boolean; data: SiteSettings }) => res.data,
      invalidatesTags: ["Settings"],
    }),
    deleteLogo: builder.mutation<SiteSettings, string>({
      query: (logoId) => ({ url: `/admin/settings/logos/${logoId}`, method: "DELETE" }),
      transformResponse: (res: { ok: boolean; data: SiteSettings }) => res.data,
      invalidatesTags: ["Settings"],
    }),
    updateContact: builder.mutation<ContactInfo, { phones?: string[]; emails?: string[] }>({
      query: (body) => ({ url: "/admin/settings/contact", method: "PATCH", body }),
      transformResponse: (res: { ok: boolean; data: ContactInfo }) => res.data,
      invalidatesTags: ["Settings"],
    }),
    addSocialLink: builder.mutation<SocialLink[], { platform: string; value: string; label?: string }>({
      query: (body) => ({ url: "/admin/settings/social", method: "POST", body }),
      transformResponse: (res: { ok: boolean; data: SocialLink[] }) => res.data,
      invalidatesTags: ["Settings"],
    }),
    updateSocialLink: builder.mutation<SocialLink[], { id: string; platform?: string; value?: string; label?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/settings/social/${id}`, method: "PATCH", body }),
      transformResponse: (res: { ok: boolean; data: SocialLink[] }) => res.data,
      invalidatesTags: ["Settings"],
    }),
    deleteSocialLink: builder.mutation<SocialLink[], string>({
      query: (id) => ({ url: `/admin/settings/social/${id}`, method: "DELETE" }),
      transformResponse: (res: { ok: boolean; data: SocialLink[] }) => res.data,
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSiteNameMutation,
  useAddLogoMutation,
  useActivateLogoMutation,
  useDeleteLogoMutation,
  useUpdateContactMutation,
  useAddSocialLinkMutation,
  useUpdateSocialLinkMutation,
  useDeleteSocialLinkMutation,
} = settingsApi;
