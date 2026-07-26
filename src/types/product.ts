import type { SubCategory } from "@/types/category";
import type { ProductFabric } from "@/types/fabric";
import type { ProductWood } from "@/types/wood";

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
  priceWithoutDiscount?: string | null;
  stock: number;
  isActive: boolean;
  isBestSeller: boolean;
  isFeaturedProduct: boolean;
  isMostPopular: boolean;
  isNewArrival: boolean;
  productFeatures: string[];
  woods?: ProductWood[];
  fabrics?: ProductFabric[];
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
  priceWithoutDiscount?: string | null;
  stock: number;
  isActive: boolean;
  isBestSeller: boolean;
  isFeaturedProduct: boolean;
  isMostPopular: boolean;
  isNewArrival: boolean;
  productFeatures: string[];
  woods?: ProductWood[];
  fabrics?: ProductFabric[];
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
  priceWithoutDiscount?: number | null;
  stock: number;
  subCategoryId: number;
  isActive?: boolean;
  isBestSeller?: boolean;
  isFeaturedProduct?: boolean;
  isMostPopular?: boolean;
  isNewArrival?: boolean;
  productFeatures?: string[];
  woods?: { woodId: number; isActive?: boolean }[];
  fabrics?: { fabricId: number; isActive?: boolean }[];
  images?: ProductImageInput[];
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type UpdateProductCmsTagsPayload = {
  isBestSeller?: boolean;
  isFeaturedProduct?: boolean;
  isMostPopular?: boolean;
  isNewArrival?: boolean;
};

export type ProductWoodFormEntry = {
  woodId: number;
  isActive: boolean;
};

export type ProductFabricFormEntry = {
  fabricId: number;
  isActive: boolean;
};

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: string;
  priceWithoutDiscount: string;
  stock: string;
  subCategoryId: string;
  isActive: boolean;
  isBestSeller: boolean;
  isFeaturedProduct: boolean;
  isMostPopular: boolean;
  isNewArrival: boolean;
  productFeatures: string[];
  woods: ProductWoodFormEntry[];
  fabrics: ProductFabricFormEntry[];
  images: ProductImageInput[];
};
