import { createSlice, type PayloadAction } from "@reduxjs/toolkit";


export type AuthState = {
  token: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
};

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
 
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      state.isHydrated = true;
      if (typeof window !== "undefined") {
        if (action.payload) {
          localStorage.setItem("accessToken", action.payload);
        } else {
          localStorage.removeItem("accessToken");
        }
      }
    },
    setTokens(state, action: PayloadAction<{accessToken: string; refreshToken: string}>) {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isHydrated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      }
    },
    hydrateFromStorage(state) {
      if (typeof window !== "undefined") {
        state.token = localStorage.getItem("accessToken");
        state.refreshToken = localStorage.getItem("refreshToken");
      }
      state.isHydrated = true;
    },
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.isHydrated = true;
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    },
  },
});

export const { setToken, setTokens, hydrateFromStorage, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;

/** Selectors */
export const selectToken = (root: { auth: AuthState }) => root.auth.token;
export const selectIsAuthed = (root: { auth: AuthState }) =>
  Boolean(root.auth.token);
export const selectIsAuthHydrated = (root: { auth: AuthState }) =>
  root.auth.isHydrated;
