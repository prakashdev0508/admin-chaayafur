import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  Category,
  CategoryTreeItem,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  SubCategory,
  CreateSubCategoryPayload,
  UpdateSubCategoryPayload,
  ListSubCategoriesParams,
} from "@/types/category";

export function fetchCategoriesTree() {
  return apiRequest<CategoryTreeItem[]>(
    "/categories/tree",
    { cache: "no-store" },
    false,
  );
}

export function fetchAdminCategoriesTree() {
  return apiRequest<CategoryTreeItem[]>("/admin/categories/tree", {
    cache: "no-store",
  });
}

export function listCategories() {
  return apiRequest<Category[]>("/categories");
}

export function getCategory(id: number) {
  return apiRequest<Category>(`/categories/${id}`);
}

export function createCategory(payload: CreateCategoryPayload) {
  return apiRequest<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCategory(id: number, payload: UpdateCategoryPayload) {
  return apiRequest<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listSubCategories(params: ListSubCategoriesParams = {}) {
  return apiRequest<PaginatedResponse<SubCategory>>(
    `/sub-categories${buildQueryString(params)}`,
  );
}

export function getSubCategory(id: number) {
  return apiRequest<SubCategory>(`/sub-categories/${id}`);
}

export function createSubCategory(payload: CreateSubCategoryPayload) {
  return apiRequest<SubCategory>("/sub-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSubCategory(
  id: number,
  payload: UpdateSubCategoryPayload,
) {
  return apiRequest<SubCategory>(`/sub-categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
