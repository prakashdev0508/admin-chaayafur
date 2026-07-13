import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type { Invoice } from "@/types/invoice";
import type {
  Order,
  OrderListItem,
  OrderTracking,
  ListOrdersParams,
  UpdateOrderPayload,
} from "@/types/order";
import type { AuditLog, ListAuditLogsParams } from "@/types/audit-log";

export function listOrders(params: ListOrdersParams = {}) {
  return apiRequest<PaginatedResponse<OrderListItem>>(
    `/orders${buildQueryString(params)}`,
  );
}

export function getOrder(id: number) {
  return apiRequest<Order>(`/orders/${id}`);
}

export function updateOrder(id: number, payload: UpdateOrderPayload) {
  return apiRequest<Order>(`/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getOrderTracking(id: number) {
  return apiRequest<OrderTracking>(`/orders/${id}/tracking`);
}

export function getOrderAuditLogs(
  orderId: number,
  params: ListAuditLogsParams = {},
) {
  return apiRequest<PaginatedResponse<AuditLog>>(
    `/orders/${orderId}/audit-logs${buildQueryString(params)}`,
  );
}

export function getOrderInvoice(orderId: number) {
  return apiRequest<Invoice>(`/orders/${orderId}/invoice`);
}
