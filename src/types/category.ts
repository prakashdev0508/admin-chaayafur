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
