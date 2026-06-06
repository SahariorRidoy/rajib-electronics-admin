export type CategoryStatus = "ACTIVE" | "HIDDEN";

export interface Category {
  _id: string;
  name: string;
  title?: string;
  slug: string;
  image?: string;
  images?: string[];
  description?: string;
  status: CategoryStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateCategoryDTO = {
  name: string;
  slug: string;
  title?: string;
  image?: string;
  images?: string[];
  description?: string;
  status?: CategoryStatus;
};

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: string;
  images?: string[];
  description?: string;
  status: CategoryStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateSubcategoryDTO = {
  name: string;
  slug: string;
  categoryId: string;
  images?: string[];
  description?: string;
  status?: CategoryStatus;
};

export const isActive = (c: Pick<Category, "status">) => c.status === "ACTIVE";
