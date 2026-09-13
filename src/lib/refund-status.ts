import type {
  RefundEventType,
  RefundSource,
  RefundStatus,
} from "@/types/refund";
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

export const refundSourceLabels: Record<RefundSource, string> = {
  STAFF: "Staff",
  RAZORPAY: "Razorpay",
};

export const refundSourceVariants: Record<RefundSource, StatusVariant> = {
  STAFF: "neutral",
  RAZORPAY: "brand",
};

export function getRefundSource(refund: {
  source?: RefundSource | null;
}): RefundSource {
  return refund.source === "RAZORPAY" ? "RAZORPAY" : "STAFF";
}

export function isStaffInitiatedRefund(refund: {
  source?: RefundSource | null;
}) {
  return getRefundSource(refund) === "STAFF";
}

export function refundInitiatedByLabel(refund: {
  source?: RefundSource | null;
  initiatedBy?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  initiatedByStaffId?: number | null;
}) {
  const staff = refund.initiatedBy;
  if (staff) {
    const name = [staff.firstName, staff.lastName].filter(Boolean).join(" ");
    return name || staff.email;
  }
  if (refund.initiatedByStaffId != null) {
    return `Staff #${refund.initiatedByStaffId}`;
  }
  return getRefundSource(refund) === "RAZORPAY" ? "Razorpay" : "—";
}

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
