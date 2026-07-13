import type { Payment } from "@/types";

export const mockPayments: Payment[] = [
  {
    id: 1,
    orderId: 1,
    amount: "49999.98",
    status: "COMPLETED",
    paymentMethod: "RAZORPAY",
    paymentLinkUrl: "https://rzp.io/i/xxxx",
    razorpayPaymentLinkId: "plink_abc123",
    razorpayPaymentId: "pay_xyz789",
    keyId: "rzp_test_xxxxxxxx",
    razorpayOrderId: "order_xxxxxxxx",
    amountPaise: 4999998,
    currency: "INR",
    transactionId: "pay_xyz789",
    notes: null,
    createdAt: "2026-07-10T12:00:00.000Z",
    updatedAt: "2026-07-10T12:05:00.000Z",
    order: {
      id: 1,
      orderNumber: "ORD-20260710-0001",
      customerId: 1,
      status: "CONFIRMED",
    },
  },
  {
    id: 2,
    orderId: 2,
    amount: "25900.00",
    status: "COMPLETED",
    paymentMethod: "RAZORPAY",
    paymentLinkUrl: "https://rzp.io/i/yyyy",
    razorpayPaymentLinkId: "plink_def456",
    razorpayPaymentId: "pay_abc123",
    keyId: "rzp_test_xxxxxxxx",
    amountPaise: 2590000,
    currency: "INR",
    transactionId: "pay_abc123",
    notes: null,
    createdAt: "2026-07-09T14:30:00.000Z",
    updatedAt: "2026-07-09T14:35:00.000Z",
    order: {
      id: 2,
      orderNumber: "ORD-20260710-0002",
      customerId: 2,
      status: "SHIPPED",
    },
  },
  {
    id: 3,
    orderId: 3,
    amount: "89900.00",
    status: "PENDING",
    paymentMethod: "RAZORPAY",
    paymentLinkUrl: "https://rzp.io/i/zzzz",
    razorpayPaymentLinkId: "plink_ghi789",
    razorpayPaymentId: null,
    keyId: "rzp_test_xxxxxxxx",
    amountPaise: 8990000,
    currency: "INR",
    transactionId: null,
    notes: null,
    createdAt: "2026-07-09T16:00:00.000Z",
    updatedAt: "2026-07-09T16:00:00.000Z",
    order: {
      id: 3,
      orderNumber: "ORD-20260709-0003",
      customerId: 3,
      status: "PENDING",
    },
  },
  {
    id: 4,
    orderId: 4,
    amount: "18900.00",
    status: "COMPLETED",
    paymentMethod: "RAZORPAY",
    paymentLinkUrl: "https://rzp.io/i/aaaa",
    razorpayPaymentLinkId: "plink_jkl012",
    razorpayPaymentId: "pay_def456",
    transactionId: "pay_def456",
    notes: null,
    createdAt: "2026-07-05T10:00:00.000Z",
    updatedAt: "2026-07-05T10:10:00.000Z",
    order: {
      id: 4,
      orderNumber: "ORD-20260708-0004",
      customerId: 4,
      status: "DELIVERED",
    },
  },
  {
    id: 5,
    orderId: 5,
    amount: "35900.00",
    status: "FAILED",
    paymentMethod: "RAZORPAY",
    paymentLinkUrl: "https://rzp.io/i/bbbb",
    razorpayPaymentLinkId: "plink_mno345",
    razorpayPaymentId: null,
    transactionId: null,
    notes: "Payment link expired",
    createdAt: "2026-07-07T08:00:00.000Z",
    updatedAt: "2026-07-07T08:30:00.000Z",
    order: {
      id: 5,
      orderNumber: "ORD-20260707-0005",
      customerId: 5,
      status: "CANCELLED",
    },
  },
];

export function getPaymentById(id: number) {
  return mockPayments.find((p) => p.id === id);
}

export function formatCurrency(amount: string | number) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const paymentStatusVariants: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  PENDING: "warning",
  COMPLETED: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
};
