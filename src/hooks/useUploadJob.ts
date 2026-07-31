import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getUploadJob } from "@/services/upload-jobs.service";
import { isTerminalUploadJobStatus } from "@/types/upload-job";

/** Poll an upload job until it reaches a terminal status. */
export function useUploadJob(jobId: number | null) {
  return useQuery({
    queryKey: queryKeys.uploadJobs.detail(jobId ?? 0),
    queryFn: () => getUploadJob(jobId!),
    enabled: jobId != null,
    refetchInterval: (query) =>
      query.state.data && isTerminalUploadJobStatus(query.state.data.status)
        ? false
        : 3000,
  });
}
