import type {
  WalletWithdrawalMethod,
  WalletWithdrawalStatus,
} from "@/types/wallet";
import type { StatusVariant } from "@/lib/status-variants";

export const walletWithdrawalStatusLabels: Record<
  WalletWithdrawalStatus,
  string
> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SUCCESS: "Success",
  FAILED: "Failed",
  REJECTED: "Rejected",
};

export const walletWithdrawalStatusVariants: Record<
  WalletWithdrawalStatus,
  StatusVariant
> = {
  PENDING: "warning",
  PROCESSING: "brand",
  SUCCESS: "success",
  FAILED: "danger",
  REJECTED: "neutral",
};

export const walletWithdrawalMethodLabels: Record<
  WalletWithdrawalMethod,
  string
> = {
  UPI: "UPI",
  BANK: "Bank (IMPS)",
};

export function canReviewWalletWithdrawal(status: WalletWithdrawalStatus) {
  return status === "PENDING";
}
