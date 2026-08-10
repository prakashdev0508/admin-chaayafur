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

const PRODUCT_IMAGES_BATCH_MAX = 5;

function normalizeUploadBatchResponse(
  data: UploadApiResult | UploadApiResult[],
): ProductImageUploadResult[] {
  const items = Array.isArray(data) ? data : [data];
  return items.map(toUploadResult);
}

/** Upload up to 5 images in one request. For more files, use `uploadProductImagesInChunks`. */
export function uploadProductImagesBatch(files: File[]) {
  if (files.length === 0) {
    return Promise.resolve([] as ProductImageUploadResult[]);
  }
  if (files.length > PRODUCT_IMAGES_BATCH_MAX) {
    throw new Error(
      `Batch upload accepts at most ${PRODUCT_IMAGES_BATCH_MAX} files`,
    );
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  return apiFormRequest<UploadApiResult | UploadApiResult[]>(
    "/uploads/product-images/batch",
    formData,
  ).then(normalizeUploadBatchResponse);
}

/** Upload any number of product images, chunked into batches of 5. */
export async function uploadProductImagesInChunks(
  files: File[],
): Promise<ProductImageUploadResult[]> {
  const results: ProductImageUploadResult[] = [];

  for (let i = 0; i < files.length; i += PRODUCT_IMAGES_BATCH_MAX) {
    const chunk = files.slice(i, i + PRODUCT_IMAGES_BATCH_MAX);
    try {
      const uploaded = await uploadProductImagesBatch(chunk);
      results.push(...uploaded);
    } catch {
      // Fall back to parallel single uploads for this chunk
      const uploaded = await Promise.all(
        chunk.map((file) => uploadProductImage(file)),
      );
      results.push(...uploaded);
    }
  }

  return results;
}

export function uploadCategoryImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<UploadApiResult | UploadApiResult[]>(
    "/uploads/category-images",
    formData,
  ).then(normalizeUploadResponse);
}

export function uploadSubCategoryImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<UploadApiResult | UploadApiResult[]>(
    "/uploads/sub-category-images",
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

export function uploadCustomizationImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFormRequest<UploadApiResult | UploadApiResult[]>(
    "/uploads/customization-images",
    formData,
    "customer",
  ).then(normalizeUploadResponse);
}
