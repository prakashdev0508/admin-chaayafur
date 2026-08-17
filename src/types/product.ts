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

/** Free-form product option (admin-defined groups). Identity is groupName + value. */
export type ProductCustomizationOption = {
  groupName: string;
  value: string;
  price: number | string;
  image?: string | null;
  /** Omit or true = available. False = show as “currently not available”. */
  isActive?: boolean;
  /** Public detail alias of isActive. */
  isAvailable?: boolean;
};

/** Cart / checkout pick — server resolves price and image. */
export type ProductCustomizationPick = {
  groupName: string;
  value: string;
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
  customization?: ProductCustomizationOption[];
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
  customization?: ProductCustomizationOption[];
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
  customization?: ProductCustomizationOption[];
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

export type ProductCustomizationFormEntry = {
  groupName: string;
  value: string;
  /** Form string; empty or "0" → 0 on submit. */
  price: string;
  image: string;
  isActive: boolean;
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
  customization: ProductCustomizationFormEntry[];
  images: ProductImageInput[];
};
