import type { SupportTicketStatus, SupportTicketType } from "@/types/support-ticket";

export type SupportTicketFilters = {
  status: SupportTicketStatus | "all";
  type: SupportTicketType | "all";
  q: string;
  orderId: string;
  customerId: string;
};

export const defaultSupportTicketFilters: SupportTicketFilters = {
  status: "all",
  type: "all",
  q: "",
  orderId: "",
  customerId: "",
};

export function countActiveSupportTicketFilters(filters: SupportTicketFilters) {
  let count = 0;
  if (filters.status !== "all") count += 1;
  if (filters.type !== "all") count += 1;
  if (filters.q.trim()) count += 1;
  if (filters.orderId.trim()) count += 1;
  if (filters.customerId.trim()) count += 1;
  return count;
}

export function supportTicketFiltersToParams(filters: SupportTicketFilters) {
  return {
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.type !== "all" ? { type: filters.type } : {}),
    ...(filters.q.trim() ? { q: filters.q.trim() } : {}),
    ...(filters.orderId.trim() ? { orderId: Number(filters.orderId) } : {}),
    ...(filters.customerId.trim() ? { customerId: Number(filters.customerId) } : {}),
  };
}
