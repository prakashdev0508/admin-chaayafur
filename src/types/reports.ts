import type { PaginationMeta } from "@/types/api";
import type { ReportGranularity, TrendPoint } from "@/types/dashboard";

export type { TrendPoint };

export type NamedChartRow = {
  name: string;
  value: number;
  amount?: string;
};

export type ReportDateParams = {
  createdFrom?: string;
  createdTo?: string;
};

export type ReportPaginationParams = {
  page?: number;
  limit?: number;
};

export type ReportRangeMeta = {
  createdFrom?: string;
  createdTo?: string;
  timezone: string;
  granularity?: ReportGranularity;
  snapshot?: boolean;
  filters?: Record<string, unknown>;
};

export type ReportTableSection<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type ProductReportRow = {
  productId: number;
  name: string;
  slug: string;
  category: string;
  subCategory: string;
  stock: number;
  isActive: boolean;
  unitsSold: number;
  revenue: string;
  avgSellingPrice: string | null;
};

export type ProductReportKpis = {
  totalProducts: number;
  activeProducts: number;
  unitsSold: number;
  grossRevenue: string;
  avgSellingPrice: string;
  topProduct: { name: string; units: number } | null;
};

export type ProductReportCharts = {
  topProducts: NamedChartRow[];
  revenueByCategory: NamedChartRow[];
  unitsTrend: TrendPoint[];
};

export type ProductReportResponse = {
  range: ReportRangeMeta;
  kpis: ProductReportKpis;
  charts: ProductReportCharts;
  table: ReportTableSection<ProductReportRow>;
};

export type ProductReportParams = ReportDateParams &
  ReportPaginationParams & {
    granularity?: ReportGranularity;
    categoryId?: number;
    subCategoryId?: number;
    productId?: number;
    search?: string;
    isActive?: boolean;
  };

export type SalesReportRow = {
  period: string;
  orderCount: number;
  subtotal: string;
  discount: string;
  shipping: string;
  grossRevenue: string;
  refundsProcessed: string;
};

export type SalesReportKpis = {
  orderCount: number;
  grossRevenue: string;
  totalDiscount: string;
  totalShipping: string;
  refundsProcessed: string;
  netRevenue: string;
  averageOrderValue: string;
};

export type SalesReportCharts = {
  revenueByPeriod: TrendPoint[];
  ordersByPeriod: TrendPoint[];
  refundsByPeriod: TrendPoint[];
};

export type SalesReportResponse = {
  range: ReportRangeMeta;
  kpis: SalesReportKpis;
  charts: SalesReportCharts;
  table: ReportTableSection<SalesReportRow>;
};

export type SalesReportParams = ReportDateParams &
  ReportPaginationParams & {
    granularity?: ReportGranularity;
    categoryId?: number;
    city?: string;
  };

export type OrderReportRow = {
  id: number;
  orderNumber: string;
  customerPhone: string;
  status: import("@/types/order").OrderStatus;
  subtotalAmount: string;
  discountAmount: string;
  shippingAmount: string;
  totalAmount: string;
  city: string | null;
  paymentStatus: string | null;
  createdAt: string;
};

export type OrdersReportKpis = {
  totalOrders: number;
  grossRevenue: string;
  averageOrderValue: string;
  pendingCount: number;
  cancelledCount: number;
  deliveredCount: number;
};

export type OrdersReportCharts = {
  statusDistribution: NamedChartRow[];
  ordersTrend: TrendPoint[];
  revenueTrend: TrendPoint[];
};

export type OrdersReportResponse = {
  range: ReportRangeMeta;
  kpis: OrdersReportKpis;
  charts: OrdersReportCharts;
  table: ReportTableSection<OrderReportRow>;
};

export type OrdersReportParams = ReportDateParams &
  ReportPaginationParams & {
    granularity?: ReportGranularity;
    status?: import("@/types/order").OrderStatus;
    customerId?: number;
    orderNumber?: string;
    customerPhone?: string;
    paymentStatus?: import("@/types/payment").PaymentStatus;
    city?: string;
  };

export type InventoryReportRow = {
  productId: number;
  name: string;
  category: string;
  stock: number;
  unitPrice: string;
  stockValue: string;
  isActive: boolean;
  isLowStock: boolean;
};

export type InventoryReportKpis = {
  totalSkus: number;
  totalStockUnits: number;
  inventoryValue: string;
  lowStockCount: number;
  outOfStockCount: number;
};

export type InventoryReportCharts = {
  stockValueByCategory: NamedChartRow[];
  lowStockProducts: NamedChartRow[];
  stockDistribution: NamedChartRow[];
};

export type InventoryReportResponse = {
  range: ReportRangeMeta;
  kpis: InventoryReportKpis;
  charts: InventoryReportCharts;
  table: ReportTableSection<InventoryReportRow>;
};

export type InventoryReportParams = ReportPaginationParams & {
  categoryId?: number;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  isActive?: boolean;
};

export type CustomerReportRow = {
  customerId: number;
  phone: string;
  registeredAt: string;
  orderCount: number;
  totalSpent: string;
  lastOrderAt: string | null;
  primaryCity: string | null;
};

export type CustomersReportKpis = {
  totalCustomers: number;
  newCustomers: number;
  customersWithOrders: number;
  repeatCustomers: number;
  totalSpent: string;
};

export type CustomersReportCharts = {
  registrationsTrend: TrendPoint[];
  topCustomersBySpend: NamedChartRow[];
  customersByCity: NamedChartRow[];
};

export type CustomersReportResponse = {
  range: ReportRangeMeta;
  kpis: CustomersReportKpis;
  charts: CustomersReportCharts;
  table: ReportTableSection<CustomerReportRow>;
};

export type CustomersReportParams = ReportDateParams &
  ReportPaginationParams & {
    granularity?: ReportGranularity;
    hasOrderInRange?: boolean;
    city?: string;
  };

export type PaymentReportRow = {
  paymentId: number;
  orderNumber: string;
  amount: string;
  status: string;
  paymentMethod: string;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  createdAt: string;
};

export type PaymentsReportKpis = {
  paymentCount: number;
  totalAmount: string;
  completedAmount: string;
  failedCount: number;
  pendingCount: number;
  refundedAmount: string;
};

export type PaymentsReportCharts = {
  statusDistribution: NamedChartRow[];
  amountByPeriod: TrendPoint[];
  methodDistribution: NamedChartRow[];
};

export type PaymentsReportResponse = {
  range: ReportRangeMeta;
  kpis: PaymentsReportKpis;
  charts: PaymentsReportCharts;
  table: ReportTableSection<PaymentReportRow>;
};

export type PaymentsReportParams = ReportDateParams &
  ReportPaginationParams & {
    granularity?: ReportGranularity;
    status?: import("@/types/payment").PaymentStatus;
    orderNumber?: string;
  };

export type ReportKind =
  | "products"
  | "sales"
  | "orders"
  | "inventory"
  | "customers"
  | "payments";

export type ReportSectionResponse =
  | ProductReportResponse
  | SalesReportResponse
  | OrdersReportResponse
  | InventoryReportResponse
  | CustomersReportResponse
  | PaymentsReportResponse;
