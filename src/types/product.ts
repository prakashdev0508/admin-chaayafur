import type { SubCategory } from "@/types/category";

export type ProductImage = {
  id?: number;
  url: string;
  altText: string;
  sortOrder: number;
};

export type ProductImageInput = {
  url: string;
  altText: string;
  sortOrder: number;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  isActive: boolean;
  productFeatures: string[];
  subCategoryId: number;
  subCategory: SubCategory;
  images: ProductImage[];
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
  productFeatures: string[];
  subCategoryId: number;
  subCategory: SubCategory;
  primaryImage: { url: string; altText: string } | null;
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
  productFeatures?: string[];
  images?: ProductImageInput[];
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  subCategoryId: string;
  isActive: boolean;
  productFeatures: string[];
  images: ProductImageInput[];
};
