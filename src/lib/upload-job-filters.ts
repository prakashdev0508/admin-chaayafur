import type { UploadJobStatus, UploadJobType } from "@/types/upload-job";

export type UploadJobFilters = {
  type: UploadJobType | "all";
  status: UploadJobStatus | "all";
};

export const defaultUploadJobFilters: UploadJobFilters = {
  type: "all",
  status: "all",
};

export function countActiveUploadJobFilters(filters: UploadJobFilters) {
  let count = 0;
  if (filters.type !== "all") count += 1;
  if (filters.status !== "all") count += 1;
  return count;
}

export function uploadJobFiltersToParams(filters: UploadJobFilters) {
  return {
    ...(filters.type !== "all" ? { type: filters.type } : {}),
    ...(filters.status !== "all" ? { status: filters.status } : {}),
  };
}
