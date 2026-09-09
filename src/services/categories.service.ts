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

/** Permanently delete a category. 409 if any product is linked. */
export function deleteCategory(id: number) {
  return apiRequest<void>(`/categories/${id}`, {
    method: "DELETE",
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

/** Permanently delete a sub-category. 409 if any product is linked. */
export function deleteSubCategory(id: number) {
  return apiRequest<void>(`/sub-categories/${id}`, {
    method: "DELETE",
  });
}
