import { apiBlobRequest, apiFormRequest, apiRequest, ApiError } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateProductPayload,
  ListProductsParams,
  Product,
  ProductBulkUploadResult,
  ProductListItem,
  UpdateProductCmsTagsPayload,
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

export function downloadProductBulkUploadSample() {
  return apiBlobRequest("/products/bulk-upload/sample");
}

export function bulkUploadProducts(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFormRequest<ProductBulkUploadResult>(
    "/products/bulk-upload",
    formData,
  );
}

export function updateProduct(id: number, payload: UpdateProductPayload) {
  return apiRequest<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateProductCmsTags(
  id: number,
  payload: UpdateProductCmsTagsPayload,
) {
  return apiRequest<Product>(`/admin/cms/products/${id}/tags`, {
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
