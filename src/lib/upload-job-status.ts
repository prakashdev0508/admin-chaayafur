import type { StatusVariant } from "@/lib/status-variants";
import type { UploadJobStatus, UploadJobType } from "@/types/upload-job";

export const uploadJobStatusLabels: Record<UploadJobStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  COMPLETED_WITH_ERRORS: "Completed with errors",
  FAILED: "Failed",
};

export const uploadJobStatusVariants: Record<UploadJobStatus, StatusVariant> = {
  PENDING: "warning",
  PROCESSING: "warning",
  COMPLETED: "success",
  COMPLETED_WITH_ERRORS: "warning",
  FAILED: "danger",
};

export const uploadJobTypeLabels: Record<UploadJobType, string> = {
  BULK_PRODUCT_IMAGES: "Product images (ZIP)",
  BULK_PRODUCT_UPLOAD: "Product import (Excel)",
};
