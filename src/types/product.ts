import type { SubCategory } from "@/types/category";
import type { ProductFabric } from "@/types/fabric";
import type {
  ProductPolish,
  ProductPolishAssignment,
  ProductWood,
  ProductWoodAssignment,
} from "@/types/wood";

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

export type ProductFabricAssignment = {
  fabricId: number;
  isActive?: boolean;
  priceAdjustment?: number;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  priceWithoutDiscount?: string | null;
  /** Optional GST HSN (4–8 digits); invoices fall back to INVOICE_HSN when omitted. */
  hsnCode?: string | null;
  stock: number;
  isActive: boolean;
  isBestSeller: boolean;
  isFeaturedProduct: boolean;
  isMostPopular: boolean;
  isNewArrival: boolean;
  productFeatures: string[];
  woods?: ProductWood[];
  /** Flat polish assignments (also nested under each wood). */
  polishes?: ProductPolish[];
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
  hsnCode?: string | null;
  stock: number;
  isActive: boolean;
  isBestSeller: boolean;
  isFeaturedProduct: boolean;
  isMostPopular: boolean;
  isNewArrival: boolean;
  productFeatures: string[];
  woods?: ProductWood[];
  polishes?: ProductPolish[];
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
  hsnCode?: string | null;
  stock: number;
  subCategoryId: number;
  isActive?: boolean;
  isBestSeller?: boolean;
  isFeaturedProduct?: boolean;
  isMostPopular?: boolean;
  isNewArrival?: boolean;
  productFeatures?: string[];
  woods?: ProductWoodAssignment[];
  polishes?: ProductPolishAssignment[];
  fabrics?: ProductFabricAssignment[];
  images?: ProductImageInput[];
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type UpdateProductCmsTagsPayload = {
  isBestSeller?: boolean;
  isFeaturedProduct?: boolean;
  isMostPopular?: boolean;
  isNewArrival?: boolean;
};

/** Row in `staged_product_images` after a ZIP staging job. */
export type StagedProductImage = {
  id: number;
  productSlug: string;
  sortOrder: number;
  url: string;
  storageKey: string;
  consumedAt: string | null;
  createdAt: string;
};

export type ListStagedProductImagesParams = {
  page?: number;
  limit?: number;
  slug?: string;
  unconsumed?: boolean;
};

export type ProductWoodFormEntry = {
  woodId: number;
  isActive: boolean;
  /** Form string; empty or "0" → 0 on submit. */
  priceAdjustment: string;
};

export type ProductPolishFormEntry = {
  woodPolishId: number;
  isActive: boolean;
  priceAdjustment: string;
};

export type ProductFabricFormEntry = {
  fabricId: number;
  isActive: boolean;
  priceAdjustment: string;
};

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: string;
  priceWithoutDiscount: string;
  hsnCode: string;
  stock: string;
  categoryId: string;
  subCategoryId: string;
  isActive: boolean;
  isBestSeller: boolean;
  isFeaturedProduct: boolean;
  isMostPopular: boolean;
  isNewArrival: boolean;
  productFeatures: string[];
  woods: ProductWoodFormEntry[];
  polishes: ProductPolishFormEntry[];
  fabrics: ProductFabricFormEntry[];
  images: ProductImageInput[];
};
