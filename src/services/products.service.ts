import { apiRequest, ApiError } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateProductPayload,
  ListProductsParams,
  Product,
  ProductListItem,
  UpdateProductPayload,
} from "@/types/product";

function buildQueryString(params: ListProductsParams) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listProducts(params: ListProductsParams = {}) {
  return apiRequest<PaginatedResponse<ProductListItem>>(
    `/products${buildQueryString(params)}`,
    {},
    false,
  );
}

export function getProduct(id: number) {
  return apiRequest<Product>(`/products/${id}`, {}, false);
}

export function createProduct(payload: CreateProductPayload) {
  return apiRequest<Product>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProduct(id: number, payload: UpdateProductPayload) {
  return apiRequest<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getProductForEdit(id: number) {
  return getProductDetail(id, true);
}

export async function getProductDetail(id: number, canUseStaffFallback: boolean) {
  try {
    return await getProduct(id);
  } catch (error) {
    if (
      canUseStaffFallback &&
      error instanceof ApiError &&
      error.statusCode === 404
    ) {
      return updateProduct(id, {});
    }
    throw error;
  }
}
