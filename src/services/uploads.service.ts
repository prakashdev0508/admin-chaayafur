import { apiFormRequest } from "@/lib/api";
import type { ProductImageUploadResult } from "@/types/upload";

function normalizeUploadResponse(
  data: ProductImageUploadResult | ProductImageUploadResult[],
): ProductImageUploadResult {
  if (Array.isArray(data)) {
    const first = data[0];
    if (!first) {
      throw new Error("Upload returned no images");
    }
    return first;
  }
  return data;
}

export function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<ProductImageUploadResult | ProductImageUploadResult[]>(
    "/uploads/product-images",
    formData,
  ).then(normalizeUploadResponse);
}

export function uploadCategoryImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<ProductImageUploadResult | ProductImageUploadResult[]>(
    "/uploads/category-images",
    formData,
  ).then(normalizeUploadResponse);
}

export function uploadBannerImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<ProductImageUploadResult | ProductImageUploadResult[]>(
    "/uploads/banner-images",
    formData,
  ).then(normalizeUploadResponse);
}

export function uploadSupportImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<ProductImageUploadResult | ProductImageUploadResult[]>(
    "/uploads/support-images",
    formData,
    "customer",
  ).then(normalizeUploadResponse);
}

export function uploadSupportImagesBatch(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  return apiFormRequest<ProductImageUploadResult[]>(
    "/uploads/support-images/batch",
    formData,
    "customer",
  );
}
