import type { OrderStatus } from "@/types/order";

export type PaymentStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

export type PaymentInstallment = {
  id: number;
  amount: string;
  paymentMode: string;
  transactionId: string | null;
  notes: string | null;
  recordedByStaffId?: number | null;
  createdAt: string;
};

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
  paidAmount?: string | null;
  dueAmount?: string | null;
  installments?: PaymentInstallment[];
  createdAt: string;
  updatedAt: string;
  order?: {
    id: number;
    orderNumber: string;
    customerId: number;
    status: OrderStatus;
    orderType?: string;
    totalAmount?: string;
  };
};

export type ListPaymentsParams = {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  orderId?: number;
  customerId?: number;
  orderNumber?: string;
  customerPhone?: string;
  createdFrom?: string;
  createdTo?: string;
};
