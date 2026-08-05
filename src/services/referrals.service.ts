import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  AdminReferralListItem,
  ListAdminReferralsParams,
} from "@/types/referral";

export function listAdminReferrals(params: ListAdminReferralsParams = {}) {
  return apiRequest<PaginatedResponse<AdminReferralListItem>>(
    `/admin/referrals${buildQueryString(params)}`,
  );
}
