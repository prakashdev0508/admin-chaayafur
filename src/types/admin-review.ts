export type AdminReviewImage = {
  id?: number;
  url: string;
  storageKey?: string | null;
  altText?: string | null;
  sortOrder?: number;
};

export type AdminReviewProduct = {
  id: number;
  name: string;
  slug: string;
};

export type AdminReview = {
  id: number;
  productId: number;
  displayName: string;
  location: string | null;
  rating: number;
  comment: string | null;
  showOnHome: boolean;
  sortOrder: number;
  isActive: boolean;
  product?: AdminReviewProduct;
  images: AdminReviewImage[];
  createdAt: string;
  updatedAt: string;
};

export type AdminReviewImageInput = {
  url: string;
  storageKey?: string;
  altText?: string | null;
  sortOrder?: number;
};

export type CreateAdminReviewPayload = {
  productId: number;
  displayName: string;
  location?: string | null;
  rating: number;
  comment?: string | null;
  showOnHome?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  images?: AdminReviewImageInput[];
};

export type UpdateAdminReviewPayload = {
  productId?: number;
  displayName?: string;
  location?: string | null;
  rating?: number;
  comment?: string | null;
  showOnHome?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  images?: AdminReviewImageInput[];
};

export type ListAdminReviewsParams = {
  productId?: number;
  showOnHome?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
};
