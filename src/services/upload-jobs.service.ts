import { apiBlobRequest, apiRequest } from "@/lib/api";
import { buildQueryString } from "@/lib/build-query";
import type { PaginatedResponse } from "@/types/api";
import type {
  ListUploadJobsParams,
  UploadJob,
} from "@/types/upload-job";

export function listUploadJobs(params: ListUploadJobsParams = {}) {
  return apiRequest<PaginatedResponse<UploadJob>>(
    `/upload-jobs${buildQueryString(params)}`,
  );
}

export function getUploadJob(id: number) {
  return apiRequest<UploadJob>(`/upload-jobs/${id}`);
}

/** Auth-gated streams — must go through apiBlobRequest, not a plain link. */
export function downloadUploadJobFile(
  id: number,
  kind: "uploaded" | "result",
) {
  return apiBlobRequest(`/upload-jobs/${id}/download/${kind}`);
}
