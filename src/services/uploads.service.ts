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
