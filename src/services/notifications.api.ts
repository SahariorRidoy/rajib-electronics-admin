import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './base';
import { NotificationResponse } from '@/types/notification';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery,
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationResponse, { page?: number; unread?: boolean }>({
      query: ({ page = 1, unread = false }) => ({
        url: `/admin/notifications?page=${page}&limit=20${unread ? '&unread=true' : ''}`,
        method: 'GET',
      }),
      providesTags: ['Notification'],
    }),
    markAsRead: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({
        url: `/admin/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAsUnread: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({
        url: `/admin/notifications/${id}/unread`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllAsRead: builder.mutation<{ ok: boolean }, void>({
      query: () => ({
        url: '/admin/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
    clearReadNotifications: builder.mutation<{ ok: boolean }, void>({
      query: () => ({
        url: '/admin/notifications/clear-read',
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAsUnreadMutation,
  useMarkAllAsReadMutation,
  useClearReadNotificationsMutation,
} = notificationApi;