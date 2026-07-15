export type RefundStatus =
  | "INITIATED"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED"
  | "CANCELLED";

export type RefundEventType =
  | "INITIATED"
  | "COMPLETE_REQUESTED"
  | "GATEWAY_ACCEPTED"
  | "PROCESSED"
  | "FAILED"
  | "CANCELLED";

export type RefundEventActorType = "STAFF" | "SYSTEM" | "GATEWAY";

export type RefundEvent = {
  id: number;
  type: RefundEventType;
  actorType: RefundEventActorType;
  actorId: number | null;
  message: string | null;
  metadata: unknown;
  createdAt: string;
};

export type RefundStaffSummary = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export type OrderRefund = {
  id: number;
  orderId: number;
  paymentId: number;
  status: RefundStatus;
  reason: string;
  amount: string;
  paymentAmount?: string;
  refundedAmount?: string;
  remainingAmount?: string;
  initiatedByStaffId: number;
  initiatedBy?: RefundStaffSummary | null;
  initiatedAt: string;
  completedByStaffId: number | null;
  completedBy?: RefundStaffSummary | null;
  completedAt: string | null;
  processedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  razorpayRefundId: string | null;
  createdAt: string;
  updatedAt: string;
  events: RefundEvent[];
};

/** GET /orders/:id/refund — balance summary + all refunds */
export type OrderRefundsResponse = OrderRefund & {
  paymentAmount: string;
  refundedAmount: string;
  remainingAmount: string;
  items: OrderRefund[];
};

export type InitiateRefundPayload = {
  reason: string;
  /** Omit to refund the full remaining balance */
  amount?: number;
};
