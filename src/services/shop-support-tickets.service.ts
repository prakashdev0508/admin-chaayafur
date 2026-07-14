import { apiRequest } from "@/lib/api";
import type {
  CreateSupportTicketMessagePayload,
  CreateSupportTicketPayload,
  SupportTicket,
  SupportTicketListItem,
} from "@/types/support-ticket";

type OrderSupportTicketsResponse = {
  items: SupportTicketListItem[];
};

export function listOrderSupportTickets(orderId: number) {
  return apiRequest<OrderSupportTicketsResponse>(
    `/orders/${orderId}/support-tickets`,
    {},
    "customer",
  );
}

export function createOrderSupportTicket(
  orderId: number,
  payload: CreateSupportTicketPayload,
) {
  return apiRequest<SupportTicket>(`/orders/${orderId}/support-tickets`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, "customer");
}

export function getShopSupportTicket(id: number) {
  return apiRequest<SupportTicket>(`/support-tickets/${id}`, {}, "customer");
}

export function replyToSupportTicket(
  id: number,
  payload: CreateSupportTicketMessagePayload,
) {
  return apiRequest<SupportTicket>(`/support-tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, "customer");
}
