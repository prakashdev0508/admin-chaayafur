export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

export type SubCategory = {
  id: number;
  name: string;
  slug: string;
  heading: string;
  categoryId: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
};

export type SubCategoryTreeItem = {
  id: number;
  name: string;
  slug: string;
  heading: string;
  description?: string;
  categoryId: number;
};

export type CategoryTreeItem = Category & {
  subCategories: SubCategoryTreeItem[];
};
