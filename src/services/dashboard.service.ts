import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { DashboardQueryParams, DashboardResponse } from "@/types/dashboard";

export function getDashboard(params: DashboardQueryParams = {}) {
  return apiRequest<DashboardResponse>(
    `/admin/dashboard${buildQueryString(params)}`,
  );
}
