import type { ReferralStatus } from "@/types/referral";
import type { StatusVariant } from "@/lib/status-variants";

export const referralStatusLabels: Record<ReferralStatus, string> = {
  PENDING: "Pending",
  CREDITED: "Credited",
  CANCELLED: "Cancelled",
};

export const referralStatusVariants: Record<ReferralStatus, StatusVariant> = {
  PENDING: "warning",
  CREDITED: "success",
  CANCELLED: "neutral",
};
