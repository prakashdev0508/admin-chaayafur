import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { AdminSearchParams, AdminSearchResponse } from "@/types/search";

export function adminSearch(params: AdminSearchParams) {
  const { types, ...rest } = params;
  const queryParams: Record<string, unknown> = { ...rest };
  if (Array.isArray(types)) {
    queryParams.types = types.join(",");
  } else if (types) {
    queryParams.types = types;
  }

  return apiRequest<AdminSearchResponse>(
    `/admin/search${buildQueryString(queryParams)}`,
  );
}
