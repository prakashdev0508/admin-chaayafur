import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  CustomerReferralListItem,
  ListMyReferralsParams,
  MyReferralCode,
} from "@/types/referral";

export function getMyReferral() {
  return apiRequest<MyReferralCode>("/users/me/referral", {}, "customer");
}

export function listMyReferrals(params: ListMyReferralsParams = {}) {
  return apiRequest<PaginatedResponse<CustomerReferralListItem>>(
    `/users/me/referrals${buildQueryString(params)}`,
    {},
    "customer",
  );
}
