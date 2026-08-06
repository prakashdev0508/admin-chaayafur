import type { PaymentStatus } from "@/types/payment";
import type { OrderAddressRef } from "@/lib/order-utils";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "UNDER_PRODUCTION"
  | "PACKING"
  | "SHIPPED"
  | "DELIVERED"
  | "REFUND_INITIATED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "CANCELLED";

export type OrderItemReview = {
  id: number;
  productId: number;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  product?: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type OrderReviewSummary = {
  id: number;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: number;
  productId: number;
  quantity: number;
  price: string;
  woodId?: number | null;
  woodName?: string | null;
  woodColor?: string | null;
  woodPriceAdjustment?: string | null;
  polishId?: number | null;
  polishName?: string | null;
  polishColor?: string | null;
  polishPriceAdjustment?: string | null;
  fabricId?: number | null;
  fabricName?: string | null;
  fabricColor?: string | null;
  fabricPriceAdjustment?: string | null;
  wood?: OrderCatalogMaterial | null;
  polish?: OrderCatalogMaterial | null;
  fabric?: OrderCatalogMaterial | null;
  product: {
    id: number;
    name: string;
    slug: string;
  };
  review?: OrderItemReview | null;
};

export type OrderCatalogMaterial = {
  id: number;
  name: string;
  slug: string;
  color: string;
  woodId?: number;
};

export type OrderCustomizationRequest = {
  id: number;
  productName: string;
  description: string;
  quantity: number;
  status: string;
  referenceImageUrl?: string | null;
  referenceImageKey?: string | null;
  woodId?: number | null;
  polishId?: number | null;
  fabricId?: number | null;
  wood?: OrderCatalogMaterial | null;
  polish?: OrderCatalogMaterial | null;
  fabric?: OrderCatalogMaterial | null;
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
  customerPhone: string;
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
  deliveryFloor?: number;
  floorDeliveryAmount?: string;
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
  customizationRequest?: OrderCustomizationRequest | null;
  payment: OrderPayment;
  coupon: OrderCoupon | null;
  shippingAddressRef?: OrderAddressRef;
  billingAddressRef?: OrderAddressRef;
  invoice: OrderInvoiceSummary | null;
  orderReview?: OrderReviewSummary | null;
  productReviews?: OrderItemReview[];
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
  /** Filter orders that have at least one refund with this status */
  refundStatus?: import("@/types/refund").RefundStatus;
  customerId?: number;
  orderNumber?: string;
  customerPhone?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type UpdateOrderPayload = {
  status?: OrderStatus;
  shippingAddressId?: number;
  billingAddressId?: number;
  deliveryFloor?: number;
  items?: { productId: number; quantity: number; woodId?: number }[];
  payment?: { notes: string };
};

/** Shop checkout uses `useCart: true`; legacy guest flow may send `items` instead. */
export type CreateOrderPayload = {
  items?: { productId: number; quantity: number; woodId?: number }[];
  useCart?: boolean;
  shippingAddressId: number;
  billingAddressId?: number;
  couponCode?: string;
  referralCode?: string;
  deliveryFloor: number;
};
