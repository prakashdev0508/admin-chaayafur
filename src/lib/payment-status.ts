import type { PaymentStatus } from "@/types/payment";
import type { StatusVariant } from "@/lib/status-variants";

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially paid",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const paymentStatusVariants: Record<PaymentStatus, StatusVariant> = {
  PENDING: "warning",
  PARTIALLY_PAID: "warning",
  COMPLETED: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
};
