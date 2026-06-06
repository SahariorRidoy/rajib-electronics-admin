import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { RootState } from "@/store/store";
import { setToken, logout } from "@/features/auth/auth.slice";
import { Mutex } from "async-mutex";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE;

const mutex = new Mutex();

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: API_BASE,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token =
      state.auth.token ??
      (typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  await mutex.waitForUnlock();
  let result = await baseQueryWithAuth(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const state = api.getState() as RootState;
        const refreshToken =
          state.auth.refreshToken ??
          (typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null);

        if (refreshToken) {
          const refreshResult = await baseQueryWithAuth(
            {
              url: "/admin/auth/refresh",
              method: "POST",
              body: { refreshToken },
            },
            api,
            extraOptions
          );

          if (refreshResult.data) {
            const data = refreshResult.data as { ok: boolean; data?: { accessToken: string } };
            if (data.ok && data.data?.accessToken) {
              api.dispatch(setToken(data.data.accessToken));
              result = await baseQueryWithAuth(args, api, extraOptions);
            } else {
              api.dispatch(logout());
              if (typeof window !== "undefined") window.location.href = "/login";
            }
          } else {
            api.dispatch(logout());
            if (typeof window !== "undefined") window.location.href = "/login";
          }
        } else {
          api.dispatch(logout());
          if (typeof window !== "undefined") window.location.href = "/login";
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await baseQueryWithAuth(args, api, extraOptions);
    }
  }

  return result;
};
