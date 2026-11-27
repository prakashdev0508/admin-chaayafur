export type MediaVendor = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string;
  imageStorageKey?: string | null;
  sortOrder: number;
  isActive: boolean;
  mediaItemsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MediaItemVendor = {
  id: number;
  name: string;
  imageUrl: string;
};

export type MediaItem = {
  id: number;
  vendorId: number;
  link: string;
  coverImageUrl: string;
  coverImageStorageKey?: string | null;
  description: string;
  showOnHome: boolean;
  sortOrder: number;
  isActive: boolean;
  vendor: MediaItemVendor;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateMediaVendorPayload = {
  name: string;
  description?: string | null;
  imageUrl: string;
  imageStorageKey?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateMediaVendorPayload = {
  name?: string;
  description?: string | null;
  imageUrl?: string;
  imageStorageKey?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type CreateMediaItemPayload = {
  vendorId: number;
  link: string;
  coverImageUrl: string;
  coverImageStorageKey?: string;
  description: string;
  showOnHome?: boolean;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateMediaItemPayload = {
  vendorId?: number;
  link?: string;
  coverImageUrl?: string;
  coverImageStorageKey?: string;
  description?: string;
  showOnHome?: boolean;
  sortOrder?: number;
  isActive?: boolean;
};

export type ListMediaVendorsParams = {
  name?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export type ListMediaItemsParams = {
  vendorId?: number;
  isActive?: boolean;
  showOnHome?: boolean;
  page?: number;
  limit?: number;
};

export type MediaImageInput = {
  url: string;
  storageKey?: string;
};
