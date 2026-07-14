import type { OrderStatus } from "@/types/order";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type Payment = {
  id: number;
  orderId: number;
  amount: string;
  status: PaymentStatus;
  paymentMethod: string;
  paymentLinkUrl?: string;
  razorpayPaymentLinkId?: string;
  razorpayPaymentId: string | null;
  razorpayRefundId?: string | null;
  keyId?: string;
  razorpayOrderId?: string;
  amountPaise?: number;
  currency?: string;
  transactionId: string | null;
  notes: string | null;
  refundNotes?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: number;
    orderNumber: string;
    customerId: number;
    status: OrderStatus;
  };
};

export type ListPaymentsParams = {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  orderId?: number;
  customerId?: number;
};
