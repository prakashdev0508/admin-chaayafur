import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type { Payment, ListPaymentsParams } from "@/types/payment";

export function listPayments(params: ListPaymentsParams = {}) {
  return apiRequest<PaginatedResponse<Payment>>(
    `/payments${buildQueryString(params)}`,
  );
}

export function getPayment(id: number) {
  return apiRequest<Payment>(`/payments/${id}`);
}
