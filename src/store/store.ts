import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth/auth.slice";
import { authApi } from "@/services/auth.api";
import { productsApi } from "@/services/products.api";
import { categoriesApi } from "@/services/categories.api";
import { subcategoriesApi } from "@/services/subcategories.api";
import { ordersApi } from "@/services/orders.api";
import { bannersApi } from "@/services/banners.api";
import { inventoryApi } from "@/services/inventory.api";
import { inventoryStatsApi } from "@/services/inventory-stats.api";
import { deliveryApi } from "@/services/delivery.api";
import { manufacturersApi } from "@/services/manufacturers.api";
import { returnsApi } from "@/services/returns.api";
import { stockFilterApi } from "@/services/stock-filter.api";
import { notificationApi } from "@/services/notifications.api";
import { customersApi } from "@/services/customers.api";
import { usersApi } from "@/services/users.api";
import { settingsApi, publicSettingsApi } from "@/services/settings.api";
import { courierApi } from "@/services/courier.api";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [subcategoriesApi.reducerPath]: subcategoriesApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [bannersApi.reducerPath]: bannersApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [inventoryStatsApi.reducerPath]: inventoryStatsApi.reducer,
    [deliveryApi.reducerPath]: deliveryApi.reducer,
    [manufacturersApi.reducerPath]: manufacturersApi.reducer,
    [returnsApi.reducerPath]: returnsApi.reducer,
    [stockFilterApi.reducerPath]: stockFilterApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [customersApi.reducerPath]: customersApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [publicSettingsApi.reducerPath]: publicSettingsApi.reducer,
    [courierApi.reducerPath]: courierApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(
      authApi.middleware,
      productsApi.middleware,
      categoriesApi.middleware,
      subcategoriesApi.middleware,
      ordersApi.middleware,
      bannersApi.middleware,
      inventoryApi.middleware,
      inventoryStatsApi.middleware,
      deliveryApi.middleware,
      manufacturersApi.middleware,
      returnsApi.middleware,
      stockFilterApi.middleware,
      notificationApi.middleware,
      customersApi.middleware,
      usersApi.middleware,
      settingsApi.middleware,
      publicSettingsApi.middleware,
      courierApi.middleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
