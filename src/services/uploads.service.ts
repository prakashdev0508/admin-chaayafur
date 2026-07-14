import { apiFormRequest } from "@/lib/api";
import type { ProductImageUploadResult } from "@/types/upload";

type UploadApiResult = {
  url: string;
  key?: string;
  storageKey?: string;
};

function toUploadResult(data: UploadApiResult): ProductImageUploadResult {
  const storageKey = data.storageKey ?? data.key;
  if (!storageKey) {
    throw new Error("Upload returned no storage key");
  }
  return { url: data.url, storageKey };
}

function normalizeUploadResponse(
  data: UploadApiResult | UploadApiResult[],
): ProductImageUploadResult {
  if (Array.isArray(data)) {
    const first = data[0];
    if (!first) {
      throw new Error("Upload returned no images");
    }
    return toUploadResult(first);
  }
  return toUploadResult(data);
}

export function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<UploadApiResult | UploadApiResult[]>(
    "/uploads/product-images",
    formData,
  ).then(normalizeUploadResponse);
}

export function uploadCategoryImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<UploadApiResult | UploadApiResult[]>(
    "/uploads/category-images",
    formData,
  ).then(normalizeUploadResponse);
}

export function uploadBannerImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<UploadApiResult | UploadApiResult[]>(
    "/uploads/banner-images",
    formData,
  ).then(normalizeUploadResponse);
}

export function uploadLogoImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<UploadApiResult | UploadApiResult[]>(
    "/uploads/logo-images",
    formData,
  ).then(normalizeUploadResponse);
}

export function uploadFaviconImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<UploadApiResult | UploadApiResult[]>(
    "/uploads/favicon-images",
    formData,
  ).then(normalizeUploadResponse);
}

export function uploadSupportImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<UploadApiResult | UploadApiResult[]>(
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
