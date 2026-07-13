import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type { Invoice } from "@/types/invoice";
import type {
  CreateOrderPayload,
  ListOrdersParams,
  Order,
  OrderTracking,
} from "@/types/order";

export function createShopOrder(payload: CreateOrderPayload) {
  return apiRequest<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  }, "customer");
}

export function listShopOrders(params: ListOrdersParams = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();

  return apiRequest<PaginatedResponse<Order>>(
    `/orders${query ? `?${query}` : ""}`,
    {},
    "customer",
  );
}

export function getShopOrder(id: number) {
  return apiRequest<Order>(`/orders/${id}`, {}, "customer");
}

export function getShopOrderTracking(id: number) {
  return apiRequest<OrderTracking>(`/orders/${id}/tracking`, {}, "customer");
}

export function getShopOrderInvoice(orderId: number) {
  return apiRequest<Invoice>(`/orders/${orderId}/invoice`, {}, "customer");
}
