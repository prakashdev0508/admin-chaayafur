import type { ReferralStatus } from "@/types/referral";

export type ReferralFilters = {
  status: ReferralStatus | "all";
};

export const defaultReferralFilters: ReferralFilters = {
  status: "all",
};

export function countActiveReferralFilters(filters: ReferralFilters) {
  return filters.status !== "all" ? 1 : 0;
}
