import type { SubCategory } from "@/types/category";

export type ProductImage = {
  id?: number;
  url: string;
  storageKey?: string;
  altText: string;
  sortOrder: number;
};

export type ProductImageInput = {
  url: string;
  storageKey?: string;
  altText: string;
  sortOrder: number;
};

export type ProductMerchandisingTag =
  | "isBestSeller"
  | "isFeaturedProduct"
  | "isMostPopular"
  | "isNewArrival";

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  isActive: boolean;
  isBestSeller: boolean;
  isFeaturedProduct: boolean;
  isMostPopular: boolean;
  isNewArrival: boolean;
  productFeatures: string[];
  subCategoryId: number;
  subCategory: SubCategory;
  images: ProductImage[];
  ratingAverage?: number | null;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductListItem = {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock: number;
  isActive: boolean;
  isBestSeller: boolean;
  isFeaturedProduct: boolean;
  isMostPopular: boolean;
  isNewArrival: boolean;
  productFeatures: string[];
  subCategoryId: number;
  subCategory: SubCategory;
  primaryImage: { url: string; altText: string } | null;
  ratingAverage?: number | null;
  reviewCount?: number;
  createdAt: string;
};

export type ProductSortBy = "name" | "price" | "createdAt";
export type SortOrder = "asc" | "desc";

export type ListProductsParams = {
  name?: string;
  slug?: string;
  minPrice?: number;
  maxPrice?: number;
  subCategoryId?: number;
  categoryId?: number;
  isActive?: boolean;
  tag?: ProductMerchandisingTag;
  page?: number;
  limit?: number;
  sortBy?: ProductSortBy;
  sortOrder?: SortOrder;
};

export type CreateProductPayload = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  subCategoryId: number;
  isActive?: boolean;
  isBestSeller?: boolean;
  isFeaturedProduct?: boolean;
  isMostPopular?: boolean;
  isNewArrival?: boolean;
  productFeatures?: string[];
  images?: ProductImageInput[];
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type UpdateProductCmsTagsPayload = {
  isBestSeller?: boolean;
  isFeaturedProduct?: boolean;
  isMostPopular?: boolean;
  isNewArrival?: boolean;
};

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  subCategoryId: string;
  isActive: boolean;
  isBestSeller: boolean;
  isFeaturedProduct: boolean;
  isMostPopular: boolean;
  isNewArrival: boolean;
  productFeatures: string[];
  images: ProductImageInput[];
};
