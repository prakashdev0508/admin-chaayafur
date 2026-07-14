import type { RefundEventType, RefundStatus } from "@/types/refund";
import type { StatusVariant } from "@/lib/status-variants";

export const refundStatusLabels: Record<RefundStatus, string> = {
  INITIATED: "Initiated",
  PROCESSING: "Processing",
  PROCESSED: "Processed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const refundStatusVariants: Record<RefundStatus, StatusVariant> = {
  INITIATED: "warning",
  PROCESSING: "brand",
  PROCESSED: "success",
  FAILED: "danger",
  CANCELLED: "neutral",
};

export const refundEventLabels: Record<RefundEventType, string> = {
  INITIATED: "Initiated",
  COMPLETE_REQUESTED: "Complete requested",
  GATEWAY_ACCEPTED: "Gateway accepted",
  PROCESSED: "Processed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export function isActiveRefund(status: RefundStatus) {
  return status === "INITIATED" || status === "PROCESSING";
}
