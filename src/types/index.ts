export type {
  ProductImage,
  Product,
  ProductListItem,
  ProductFormValues,
  CreateProductPayload,
  UpdateProductPayload,
  ListProductsParams,
} from "@/types/product";

export type { SubCategory, CategoryTreeItem } from "@/types/category";

export type { PaginatedResponse, PaginationMeta } from "@/types/api";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

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
  };
  items: OrderItem[];
  payment: OrderPayment;
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

export type Payment = {
  id: number;
  orderId: number;
  amount: string;
  status: PaymentStatus;
  paymentMethod: string;
  paymentLinkUrl: string;
  razorpayPaymentLinkId: string;
  razorpayPaymentId: string | null;
  keyId?: string;
  razorpayOrderId?: string;
  amountPaise?: number;
  currency?: string;
  transactionId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: number;
    orderNumber: string;
    customerId: number;
    status: OrderStatus;
  };
};

export type DashboardStats = {
  totalRevenue: number;
  ordersToday: number;
  activeProducts: number;
  pendingShipments: number;
  revenueByMonth: { label: string; revenue: number }[];
  revenueByWeek: { label: string; revenue: number }[];
  revenueByDay: { label: string; revenue: number }[];
};

export type RecentOrderRow = {
  id: string;
  orderNumber: string;
  customer: string;
  item: string;
  amount: number;
  status: OrderStatus;
};
