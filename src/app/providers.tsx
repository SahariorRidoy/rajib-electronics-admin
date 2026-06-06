"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { hydrateFromStorage } from "@/features/auth/auth.slice";
import { Toaster } from "react-hot-toast";

function Hydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(hydrateFromStorage());
  }, [dispatch]);
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <Hydrator>{children}</Hydrator>
      <Toaster position="top-right" />
    </Provider>
  );
}