export type UploadJobType = "BULK_PRODUCT_IMAGES" | "BULK_PRODUCT_UPLOAD";

export type UploadJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED";

export type UploadJob = {
  id: number;
  name: string;
  type: UploadJobType;
  status: UploadJobStatus;
  uploadedUrl: string | null;
  resultUrl: string | null;
  totalCount: number;
  successCount: number;
  failedCount: number;
  errorMessage: string | null;
  attempts: number;
  createdById: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  download?: {
    uploaded: string;
    result: string;
  };
};

export type ListUploadJobsParams = {
  page?: number;
  limit?: number;
  type?: UploadJobType;
  status?: UploadJobStatus;
};

/** 202 response from both bulk-upload enqueue endpoints. */
export type EnqueuedUploadJob = {
  jobId: number;
  status: UploadJobStatus;
};

export const TERMINAL_UPLOAD_JOB_STATUSES: UploadJobStatus[] = [
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED",
];

export function isTerminalUploadJobStatus(status: UploadJobStatus) {
  return TERMINAL_UPLOAD_JOB_STATUSES.includes(status);
}
