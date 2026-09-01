import type { PaymentStatus } from "@/types/payment";
import type { OrderAddressRef } from "@/lib/order-utils";
import type {
  ProductCustomizationOption,
  ProductCustomizationPick,
} from "@/types/product";

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

export type OrderType = "CHECKOUT" | "MANUAL";

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
  /** Catalog product id; null for off-catalog custom lines. */
  productId: number | null;
  quantity: number;
  price: string;
  /** Snapshot display name for this line (catalog or custom). */
  productName?: string;
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
  customization?: ProductCustomizationOption[];
  wood?: OrderCatalogMaterial | null;
  polish?: OrderCatalogMaterial | null;
  fabric?: OrderCatalogMaterial | null;
  /** Present for catalog lines; null/omitted for custom lines. */
  product?: {
    id: number;
    name: string;
    slug: string;
  } | null;
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
  orderType: OrderType;
  status: OrderStatus;
  cancellationReason?: string | null;
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
  /** Set when cancelled (staff reason or system message). */
  cancellationReason?: string | null;
  subtotalAmount: string;
  discountAmount: string;
  shippingAmount?: string;
  deliveryFloor?: number;
  liftAccessAvailable?: boolean;
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
  orderType?: OrderType;
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
  /** Required when status is CANCELLED (min 3 chars). */
  cancellationReason?: string;
  shippingAddressId?: number;
  billingAddressId?: number;
  deliveryFloor?: number;
  liftAccessAvailable?: boolean;
  items?: OrderLineInput[];
  payment?: { notes: string };
};

export type OrderLineInput = {
  type?: "CATALOG" | "CUSTOM";
} & (
  | {
      type?: "CATALOG";
      productId: number;
      quantity: number;
      woodId?: number;
      polishId?: number;
      fabricId?: number;
      customization?: ProductCustomizationPick[];
    }
  | {
      type: "CUSTOM";
      productId?: null;
      productName: string;
      quantity: number;
      /** Unit price for the custom/off-catalog line (GST-inclusive). */
      price: number;
      image?: { url: string; storageKey: string } | null;
    }
);

/** Shop checkout uses `useCart: true`; legacy guest flow may send `items` instead. */
export type CreateOrderPayload = {
  items?: OrderLineInput[];
  useCart?: boolean;
  shippingAddressId: number;
  billingAddressId?: number;
  /** When true, billing snapshot matches shipping; ignores a different billingAddressId. */
  billingSameAsShipping?: boolean;
  couponCode?: string;
  referralCode?: string;
  deliveryFloor: number;
  liftAccessAvailable: boolean;
};

/** Inline address snapshot stored on MANUAL orders (not the customer's address book). */
export type OrderAddressSnapshot = {
  name: string;
  email?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  gstin?: string;
};

export type CreateAdminOrderPayload = {
  /** Indian mobile; find-or-create customer. */
  phone: string;
  shipping: OrderAddressSnapshot;
  /** Billing snapshot is required unless `billingSameAsShipping` is true. */
  billing?: OrderAddressSnapshot;
  billingSameAsShipping: boolean;
  deliveryFloor: number;
  liftAccessAvailable: boolean;
  items: OrderLineInput[];
  /** Optional override; otherwise computed from site settings. */
  shippingAmount?: number;
};

export type MarkPaidOrderPayload = {
  transactionId: string;
  notes?: string;
};

export type ConvertQuotationToOrderPayload = {
  phone: string;
  shipping: OrderAddressSnapshot;
  billing?: OrderAddressSnapshot;
  billingSameAsShipping: boolean;
  deliveryFloor: number;
  liftAccessAvailable: boolean;
};
