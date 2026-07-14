import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateSupportTicketMessagePayload,
  ListSupportTicketsParams,
  SupportTicket,
  SupportTicketListItem,
  UpdateSupportTicketPayload,
} from "@/types/support-ticket";

function buildQueryString(params: ListSupportTicketsParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listSupportTickets(params: ListSupportTicketsParams = {}) {
  return apiRequest<PaginatedResponse<SupportTicketListItem>>(
    `/support-tickets${buildQueryString(params)}`,
  );
}

export function getSupportTicket(id: number) {
  return apiRequest<SupportTicket>(`/support-tickets/${id}`);
}

export function postSupportTicketMessage(
  id: number,
  payload: CreateSupportTicketMessagePayload,
) {
  return apiRequest<SupportTicket>(`/support-tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSupportTicket(id: number, payload: UpdateSupportTicketPayload) {
  return apiRequest<SupportTicket>(`/support-tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
