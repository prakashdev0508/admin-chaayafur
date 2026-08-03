import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  AdminWalletBalances,
  ListWalletWithdrawalsParams,
  RejectWalletWithdrawalPayload,
  WalletWithdrawalDetail,
  WalletWithdrawalListItem,
} from "@/types/wallet";

export function getAdminWallet(customerId: number) {
  return apiRequest<AdminWalletBalances>(`/admin/wallets/${customerId}`);
}

export function listWalletWithdrawals(
  params: ListWalletWithdrawalsParams = {},
) {
  return apiRequest<PaginatedResponse<WalletWithdrawalListItem>>(
    `/admin/wallet-withdrawals${buildQueryString(params)}`,
  );
}

export function getWalletWithdrawal(id: number) {
  return apiRequest<WalletWithdrawalDetail>(
    `/admin/wallet-withdrawals/${id}`,
  );
}

export function approveWalletWithdrawal(id: number) {
  return apiRequest<WalletWithdrawalDetail>(
    `/admin/wallet-withdrawals/${id}/approve`,
    { method: "POST" },
  );
}

export function rejectWalletWithdrawal(
  id: number,
  payload: RejectWalletWithdrawalPayload = {},
) {
  return apiRequest<WalletWithdrawalDetail>(
    `/admin/wallet-withdrawals/${id}/reject`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
