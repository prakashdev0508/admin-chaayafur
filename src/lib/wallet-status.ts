import type {
  WalletTransactionReason,
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

const walletTransactionReasonLabels: Record<WalletTransactionReason, string> = {
  REFERRAL_COMMISSION: "Referral commission",
  LOGIN_BONUS: "Login bonus",
  WALLET_DISCOUNT: "Wallet discount",
  WALLET_DISCOUNT_REFUND: "Wallet discount refund",
  WITHDRAWAL: "Withdrawal",
};

export function formatWalletTransactionReason(
  reason: string | null | undefined,
): string {
  if (!reason) return "—";
  if (reason in walletTransactionReasonLabels) {
    return walletTransactionReasonLabels[reason as WalletTransactionReason];
  }
  return reason
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function canReviewWalletWithdrawal(status: WalletWithdrawalStatus) {
  return status === "PENDING";
}
