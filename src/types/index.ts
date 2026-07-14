export type {
  ProductImage,
  Product,
  ProductListItem,
  ProductFormValues,
  CreateProductPayload,
  UpdateProductPayload,
  ListProductsParams,
} from "@/types/product";

export type {
  Category,
  CategoryImageInput,
  SubCategory,
  CategoryTreeItem,
  SubCategoryTreeItem,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CreateSubCategoryPayload,
  UpdateSubCategoryPayload,
  ListCategoriesParams,
  ListSubCategoriesParams,
} from "@/types/category";

export type { PaginatedResponse, PaginationMeta } from "@/types/api";

export type {
  OrderStatus,
  OrderItem,
  OrderPayment,
  OrderCoupon,
  OrderListItem,
  Order,
  TrackingStep,
  OrderTracking,
  ListOrdersParams,
  UpdateOrderPayload,
} from "@/types/order";

export type {
  PaymentStatus,
  Payment,
  ListPaymentsParams,
} from "@/types/payment";

export type {
  CouponType,
  CouponVisibility,
  Coupon,
  CouponFormValues,
  CreateCouponPayload,
  UpdateCouponPayload,
  ListCouponsParams,
} from "@/types/coupon";

export type {
  CustomerOrderSummary,
  Customer,
  CustomerListItem,
  ListCustomersParams,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  ListCustomerOrdersParams,
} from "@/types/customer";

export type {
  CustomerAddress,
  CreateAddressPayload,
  UpdateAddressPayload,
  AddressType,
} from "@/types/address";

export type {
  AuditEntityType,
  AuditLogStaff,
  AuditLog,
  ListAuditLogsParams,
} from "@/types/audit-log";

export type { InvoiceLineItem, Invoice } from "@/types/invoice";

export type {
  SocialLinks,
  AdminSiteSettings,
  PublicSiteSettings,
  UpdateSiteSettingsPayload,
} from "@/types/site-settings";

export type {
  ShippingPincode,
  ListPincodesParams,
  UpsertPincodesPayload,
  ShippingQuoteParams,
  ShippingQuote,
} from "@/types/shipping";

export type {
  RefundStatus,
  RefundEventType,
  RefundEventActorType,
  RefundEvent,
  OrderRefund,
  InitiateRefundPayload,
} from "@/types/refund";

export type {
  ReviewKind,
  ProductReview,
  OrderReview,
  PublicProductReview,
  PublicProductReviewsResponse,
  MyReviewsResponse,
  CreateProductReviewPayload,
  CreateOrderReviewPayload,
  ListReviewsParams,
} from "@/types/review";

export type RecentOrderRow = {
  id: string;
  orderNumber: string;
  customer: string;
  item: string;
  amount: number;
  status: import("@/types/order").OrderStatus;
};
