export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  address?: string;
  orderCount: number;
  isAutoCreated?: boolean;
}
