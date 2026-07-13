import { apiRequest } from "@/lib/api";
import type { CategoryTreeItem } from "@/types/category";

export function fetchCategoriesTree() {
  return apiRequest<CategoryTreeItem[]>("/categories/tree", {}, false);
}
