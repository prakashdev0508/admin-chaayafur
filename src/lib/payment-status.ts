import type { PaymentStatus } from "@/types/payment";
import type { StatusVariant } from "@/lib/status-variants";

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const paymentStatusVariants: Record<PaymentStatus, StatusVariant> = {
  PENDING: "warning",
  COMPLETED: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
};
