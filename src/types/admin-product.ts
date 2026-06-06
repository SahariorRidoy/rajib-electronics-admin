export type AdminProductStatus = "ACTIVE" | "DRAFT" | "HIDDEN";

export interface AdminProductCreateDTO {
  title: string;
  slug: string;
  price: number;
  buyingPrice: number;
  stock: number;
  image?: string;
  compareAtPrice?: number;
  isDiscounted?: boolean;
  status?: AdminProductStatus;
  categorySlug?: string;
  tagSlugs?: string[];
}

export type AdminProductUpdateDTO = Partial<AdminProductCreateDTO>;

export interface AdminProductLean {
  _id: string;
  title: string;
  slug: string;
  image?: string;
  price: number;
  buyingPrice: number;
  compareAtPrice?: number;
  isDiscounted?: boolean;
  stock?: number;
  categorySlug?: string;
  tagSlugs?: string[];
  status: AdminProductStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiOk<T> {
  ok: true;
  data: T;
}

export interface ApiErr {
  ok: false;
  code?: string;
  message?: string;
  details?: unknown;
}
