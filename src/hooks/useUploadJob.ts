import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getUploadJob } from "@/services/upload-jobs.service";

export function useUploadJob(jobId: number | null) {
  return useQuery({
    queryKey: queryKeys.uploadJobs.detail(jobId ?? 0),
    queryFn: () => getUploadJob(jobId!),
    enabled: jobId != null,
  });
}
