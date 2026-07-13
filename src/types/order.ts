import type { PaymentStatus } from "@/types/payment";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
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
  paymentLinkUrl: string;
  razorpayPaymentLinkId: string;
  razorpayPaymentId: string | null;
  transactionId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  gatewayPayload?: unknown;
};

export type OrderCoupon = {
  id: number;
  code: string;
  type: string;
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
  billingAddressId: number;
  status: OrderStatus;
  totalAmount: string;
  subtotalAmount?: string;
  discountAmount?: string;
  paymentMethod: string;
  shippingAddress: string;
  billingAddress: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    phone: string;
    lastLogin: string;
    isActive?: boolean;
  };
  items: OrderItem[];
  payment: OrderPayment;
  coupon?: OrderCoupon;
  shippingAddressRef?: unknown;
  billingAddressRef?: unknown;
  invoice?: {
    id: number;
    invoiceNumber: string;
    issuedAt: string;
  };
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
