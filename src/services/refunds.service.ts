import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  ListRefundsParams,
  RefundDetail,
  RefundListItem,
} from "@/types/refund";

export function listRefunds(params: ListRefundsParams = {}) {
  return apiRequest<PaginatedResponse<RefundListItem>>(
    `/refunds${buildQueryString(params)}`,
  );
}

export function getRefund(id: number) {
  return apiRequest<RefundDetail>(`/refunds/${id}`);
}
