import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PublicSearchParams, PublicSearchResponse } from "@/types/search";

/** Public catalog search — no auth. */
export function publicSearch(params: PublicSearchParams) {
  return apiRequest<PublicSearchResponse>(
    `/search${buildQueryString(params)}`,
    {},
    false,
  );
}
