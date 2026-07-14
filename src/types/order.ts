import type { PaymentStatus } from "@/types/payment";
import type { OrderAddressRef } from "@/lib/order-utils";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "REFUND_INITIATED"
  | "REFUNDED"
  | "CANCELLED";

export type OrderItem = {
  id: number;
  productId: number;
  quantity: number;
  price: string;
  product: {
    id: number;
    name: string;
    slug: string;
  };
};

export type OrderPayment = {
  id: number;
  amount: string;
  status: PaymentStatus;
  paymentMethod: string;
  paymentLinkUrl?: string | null;
  razorpayPaymentLinkId?: string | null;
  razorpayPaymentId: string | null;
  razorpayRefundId?: string | null;
  keyId?: string;
  razorpayOrderId?: string | null;
  amountPaise?: number;
  currency?: string;
  transactionId: string | null;
  notes: string | null;
  refundNotes?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  gatewayPayload?: unknown;
};

export type OrderCoupon = {
  id?: number;
  code: string;
  type?: string;
};

export type OrderInvoiceSummary = {
  id: number;
  invoiceNumber: string;
  issuedAt: string;
  totalAmount: string;
};

export type OrderListItem = {
  id: number;
  orderNumber: string;
  customerId: number;
  status: OrderStatus;
  totalAmount: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: number;
    phone: string;
  };
};

export type Order = {
  id: number;
  orderNumber: string;
  customerId: number;
  addressId: number;
  billingAddressId: number | null;
  status: OrderStatus;
  subtotalAmount: string;
  discountAmount: string;
  shippingAmount?: string;
  totalAmount: string;
  paymentMethod: string;
  shippingAddress: string;
  billingAddress: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    phone: string;
    lastLogin: string | null;
    isActive?: boolean;
  };
  items: OrderItem[];
  payment: OrderPayment;
  coupon: OrderCoupon | null;
  shippingAddressRef?: OrderAddressRef;
  billingAddressRef?: OrderAddressRef;
  invoice: OrderInvoiceSummary | null;
};

export type TrackingStep = {
  status: OrderStatus;
  label: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  occurredAt: string | null;
};

export type OrderTracking = {
  orderId: number;
  orderNumber: string;
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  timeline: TrackingStep[];
};

export type ListOrdersParams = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  customerId?: number;
};

export type UpdateOrderPayload = {
  status?: OrderStatus;
  shippingAddressId?: number;
  billingAddressId?: number;
  items?: { productId: number; quantity: number }[];
  payment?: { notes: string };
};

export type CreateOrderPayload = {
  items: { productId: number; quantity: number }[];
  shippingAddressId: number;
  billingAddressId?: number;
  couponCode?: string;
};
