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

export type OrderRefund = {
  id: number;
  orderId: number;
  paymentId: number;
  status: RefundStatus;
  reason: string;
  amount: string;
  initiatedByStaffId: number;
  initiatedAt: string;
  completedByStaffId: number | null;
  completedAt: string | null;
  processedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  razorpayRefundId: string | null;
  createdAt: string;
  updatedAt: string;
  events: RefundEvent[];
};

export type InitiateRefundPayload = {
  reason: string;
};
