import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type { ListAuditLogsParams, AuditLog } from "@/types/audit-log";

export function listAuditLogs(params: ListAuditLogsParams = {}) {
  return apiRequest<PaginatedResponse<AuditLog>>(
    `/audit-logs${buildQueryString(params)}`,
  );
}

export function listCustomerAuditLogs(
  customerId: number,
  params: Omit<ListAuditLogsParams, "parentEntityId"> = {},
) {
  return apiRequest<PaginatedResponse<AuditLog>>(
    `/customers/${customerId}/audit-logs${buildQueryString(params)}`,
  );
}

export function listOrderAuditLogs(
  orderId: number,
  params: ListAuditLogsParams = {},
) {
  return apiRequest<PaginatedResponse<AuditLog>>(
    `/orders/${orderId}/audit-logs${buildQueryString(params)}`,
  );
}
