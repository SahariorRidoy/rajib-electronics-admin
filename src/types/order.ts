export type OrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "IN_SHIPPING"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";


  export type OrderLine = {
    productId: string;
    title: string;
    image?: string;
    price: number;
    qty: number;
    color?: string;
  };

  export type Order = {
    _id: string;
    customer: {
      name: string;
      email?: string;
      phone: string;
      address?: string;
    };
    lines: OrderLine[];
    totals: { subTotal: number; shipping: number; grandTotal: number };
    status: OrderStatus;
    payment?: { method: string; status: string; transactionId?: string };
    notes?: string;
    courier?: {
      provider: "steadfast" | "pathao";
      consignmentId: string;
      trackingCode?: string;
      status?: string;
      sentAt: string;
    };
    createdAt?: string;
    updatedAT?: string;
  };

  export type CreateOrderDTO = {
    customer: Order["customer"];
    lines: {productId: string; qty: number}
  };


  export type UpdateOrderDTO = {
    status: OrderStatus;
  }