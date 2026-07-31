import { apiBlobRequest, apiFormRequest, apiRequest } from "@/lib/api";
import { buildQueryString } from "@/lib/build-query";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateProductPayload,
  ListProductsParams,
  ListStagedProductImagesParams,
  Product,
  ProductListItem,
  StagedProductImage,
  UpdateProductCmsTagsPayload,
  UpdateProductPayload,
} from "@/types/product";
import type { EnqueuedUploadJob } from "@/types/upload-job";

export function listProducts(params: ListProductsParams = {}) {
  return apiRequest<PaginatedResponse<ProductListItem>>(
    `/products${buildQueryString(params)}`,
    {},
    false,
  );
}

/** Public storefront product detail (active products only). */
export function getProduct(idOrSlug: number | string) {
  return apiRequest<Product>(`/products/${idOrSlug}`, {}, false);
}

/**
 * Admin product detail for view/edit screens.
 * Returns inactive products too; requires `view-products`.
 * @see docs/products.md — GET /api/v1/admin/products/:id
 */
export function getAdminProduct(id: number) {
  return apiRequest<Product>(`/admin/products/${id}`);
}

/** @deprecated Prefer getAdminProduct — kept as an alias for edit pages. */
export function getProductForEdit(id: number) {
  return getAdminProduct(id);
}

/**
 * Admin product detail page loader.
 * @deprecated Prefer getAdminProduct directly.
 */
export function getProductDetail(id: number, _canUseStaffFallback?: boolean) {
  return getAdminProduct(id);
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

/** Enqueues a BULK_PRODUCT_UPLOAD job. Poll GET /upload-jobs/:jobId. */
export function bulkUploadProducts(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFormRequest<EnqueuedUploadJob>(
    "/products/bulk-upload",
    formData,
  );
}

/** Enqueues a BULK_PRODUCT_IMAGES job from a ZIP of `{slug}__{sortOrder}.{ext}`. */
export function stageBulkProductImages(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFormRequest<EnqueuedUploadJob>(
    "/products/bulk-upload/images",
    formData,
  );
}

export function listStagedProductImages(
  params: ListStagedProductImagesParams = {},
) {
  return apiRequest<PaginatedResponse<StagedProductImage>>(
    `/products/bulk-upload/staged-images${buildQueryString(params)}`,
  );
}

export function deleteStagedProductImage(id: number) {
  return apiRequest<{ id: number }>(
    `/products/bulk-upload/staged-images/${id}`,
    { method: "DELETE" },
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
