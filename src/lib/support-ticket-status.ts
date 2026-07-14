import type { SupportTicketStatus, SupportTicketType } from "@/types/support-ticket";
import type { StatusVariant } from "@/lib/status-variants";

export const supportTicketStatusLabels: Record<SupportTicketStatus, string> = {
  OPEN: "Open",
  AWAITING_STAFF: "Awaiting staff",
  AWAITING_CUSTOMER: "Awaiting customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const supportTicketStatusVariants: Record<SupportTicketStatus, StatusVariant> = {
  OPEN: "warning",
  AWAITING_STAFF: "warning",
  AWAITING_CUSTOMER: "brand",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export const supportTicketTypeLabels: Record<SupportTicketType, string> = {
  QUESTION: "Question",
  PROBLEM: "Problem",
};

export function isSupportTicketActive(status: SupportTicketStatus) {
  return status !== "RESOLVED" && status !== "CLOSED";
}

export function canCustomerReply(status: SupportTicketStatus) {
  return status === "AWAITING_CUSTOMER";
}
