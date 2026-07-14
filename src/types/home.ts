import type { ProductListItem } from "@/types/product";

export type BannerType = "MAIN" | "SUB";

export type HomeBanner = {
  id: number;
  title: string | null;
  imageUrl: string;
  redirectUrl: string;
  sortOrder: number;
};

export type AdminBanner = {
  id: number;
  type: BannerType;
  title: string | null;
  imageUrl: string;
  imageStorageKey?: string | null;
  redirectUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HomePayload = {
  banners: HomeBanner[];
  subBanners: HomeBanner[];
  featuredProducts: ProductListItem[];
  bestSellers: ProductListItem[];
  mostPopular: ProductListItem[];
  newArrivals: ProductListItem[];
};

export type CreateBannerPayload = {
  type: BannerType;
  title?: string;
  imageUrl: string;
  imageStorageKey?: string;
  redirectUrl: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateBannerPayload = Partial<CreateBannerPayload>;

export type ListBannersParams = {
  type?: BannerType;
  isActive?: boolean;
  page?: number;
  limit?: number;
};
