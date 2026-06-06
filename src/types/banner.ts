export interface Banner {
  _id: string;
  image: string;
  title?: string;
  subtitle?: string;
  discount?: string;
  status: 'ACTIVE' | 'HIDDEN';
  position: 'hero' | 'side';
  sort: number;
  link?: string;
  categorySlug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerRequest {
  image: string;
  title?: string;
  subtitle?: string;
  discount?: string;
  status?: 'ACTIVE' | 'HIDDEN';
  position?: 'hero' | 'side';
  sort?: number;
  link?: string;
  categorySlug?: string;
}

export type UpdateBannerRequest = Partial<CreateBannerRequest>;