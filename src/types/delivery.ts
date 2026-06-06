export type DeliverySettings = {
  _id: string;
  freeDeliveryThreshold: number;
  deliveryCharge: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type DeliverySettingsResponse = {
  ok: boolean;
  data?: DeliverySettings;
  message?: string;
};

export type UpdateDeliverySettingsDTO = {
  freeDeliveryThreshold: number;
  deliveryCharge: number;
  isActive: boolean;
};
