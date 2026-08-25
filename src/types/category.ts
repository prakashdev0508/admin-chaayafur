export type CategoryImageInput = {
  url: string;
  storageKey?: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
  isSignatureCollection?: boolean;
  /** Display order for signature collections (lower first). */
  sortOrder?: number;
  /** Present on tree / detail responses */
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SubCategory = {
  id: number;
  name: string;
  slug: string;
  heading: string | null;
  description?: string | null;
  categoryId: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  isActive?: boolean;
  /** Present on tree responses; detail may use nested `image` instead */
  imageUrl?: string | null;
  image?: CategoryImageInput | null;
  productsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SubCategoryTreeItem = {
  id: number;
  name: string;
  slug: string;
  heading: string | null;
  description?: string | null;
  categoryId: number;
  isActive?: boolean;
  imageUrl?: string | null;
  productsCount?: number;
  updatedAt?: string;
};

export type CategoryTreeItem = Category & {
  subCategories: SubCategoryTreeItem[];
};

export type CreateCategoryPayload = {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  isSignatureCollection?: boolean;
  sortOrder?: number;
  image?: CategoryImageInput;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export type CreateSubCategoryPayload = {
  name: string;
  slug: string;
  categoryId: number;
  heading?: string;
  description?: string;
  isActive?: boolean;
  image?: CategoryImageInput;
};

export type UpdateSubCategoryPayload = Partial<
  Omit<CreateSubCategoryPayload, "categoryId">
>;

export type ListCategoriesParams = {
  name?: string;
  slug?: string;
  isActive?: boolean;
  isSignatureCollection?: boolean;
  page?: number;
  limit?: number;
};

export type ListSubCategoriesParams = {
  categoryId?: number;
  name?: string;
  slug?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};
