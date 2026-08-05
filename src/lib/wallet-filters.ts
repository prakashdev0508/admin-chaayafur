import type { WalletWithdrawalStatus } from "@/types/wallet";

export type WalletWithdrawalFilters = {
  status: WalletWithdrawalStatus | "all";
  customerId: string;
};

export const defaultWalletWithdrawalFilters: WalletWithdrawalFilters = {
  status: "PENDING",
  customerId: "",
};

export function countActiveWalletWithdrawalFilters(
  filters: WalletWithdrawalFilters,
) {
  let count = 0;
  if (filters.status !== "all") count += 1;
  if (filters.customerId.trim()) count += 1;
  return count;
}
