import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateWalletWithdrawalPayload,
  ListWalletTransactionsParams,
  ListWalletWithdrawalsParams,
  WalletBalances,
  WalletPayoutMethods,
  WalletTransaction,
  WalletWithdrawalDetail,
  WalletWithdrawalListItem,
} from "@/types/wallet";

export function getMyWallet() {
  return apiRequest<WalletBalances>("/users/me/wallet", {}, "customer");
}

export function listMyWalletTransactions(
  params: ListWalletTransactionsParams = {},
) {
  return apiRequest<PaginatedResponse<WalletTransaction>>(
    `/users/me/wallet/transactions${buildQueryString(params)}`,
    {},
    "customer",
  );
}

export function getMyPayoutMethods() {
  return apiRequest<WalletPayoutMethods>(
    "/users/me/wallet/payout-methods",
    {},
    "customer",
  );
}

export function listMyWithdrawals(params: ListWalletWithdrawalsParams = {}) {
  return apiRequest<PaginatedResponse<WalletWithdrawalListItem>>(
    `/users/me/wallet/withdrawals${buildQueryString(params)}`,
    {},
    "customer",
  );
}

export function getMyWithdrawal(id: number) {
  return apiRequest<WalletWithdrawalDetail>(
    `/users/me/wallet/withdrawals/${id}`,
    {},
    "customer",
  );
}

export function createWithdrawal(payload: CreateWalletWithdrawalPayload) {
  return apiRequest<WalletWithdrawalDetail>(
    "/users/me/wallet/withdrawals",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "customer",
  );
}
