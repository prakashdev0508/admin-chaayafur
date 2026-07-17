import { getDefaultReportDateRange } from "@/lib/report-dates";
import type { ReportGranularity } from "@/types/dashboard";
import type { OrderStatus } from "@/types/order";
import type { PaymentStatus } from "@/types/payment";
import type { ReportKind } from "@/types/reports";

export type ReportDateFilters = {
  createdFrom: string;
  createdTo: string;
};

export type ProductReportFilters = ReportDateFilters & {
  granularity: ReportGranularity;
  search: string;
  categoryId: string;
  isActive: "all" | "true" | "false";
};

export type SalesReportFilters = ReportDateFilters & {
  granularity: ReportGranularity;
  categoryId: string;
  city: string;
};

export type OrdersReportFilters = ReportDateFilters & {
  granularity: ReportGranularity;
  status: OrderStatus | "all";
  customerId: string;
  orderNumber: string;
  customerPhone: string;
  paymentStatus: PaymentStatus | "all";
  city: string;
};

export type InventoryReportFilters = {
  categoryId: string;
  lowStockOnly: boolean;
  outOfStockOnly: boolean;
  isActive: "all" | "true" | "false";
};

export type CustomersReportFilters = ReportDateFilters & {
  granularity: ReportGranularity;
  hasOrderInRange: boolean;
  city: string;
};

export type PaymentsReportFilters = ReportDateFilters & {
  granularity: ReportGranularity;
  status: PaymentStatus | "all";
  orderNumber: string;
};

const defaultDates = getDefaultReportDateRange(30);

export const defaultProductReportFilters: ProductReportFilters = {
  ...defaultDates,
  granularity: "daily",
  search: "",
  categoryId: "",
  isActive: "all",
};

export const defaultSalesReportFilters: SalesReportFilters = {
  ...defaultDates,
  granularity: "daily",
  categoryId: "",
  city: "",
};

export const defaultOrdersReportFilters: OrdersReportFilters = {
  ...defaultDates,
  granularity: "daily",
  status: "all",
  customerId: "",
  orderNumber: "",
  customerPhone: "",
  paymentStatus: "all",
  city: "",
};

export const defaultInventoryReportFilters: InventoryReportFilters = {
  categoryId: "",
  lowStockOnly: false,
  outOfStockOnly: false,
  isActive: "all",
};

export const defaultCustomersReportFilters: CustomersReportFilters = {
  ...defaultDates,
  granularity: "daily",
  hasOrderInRange: false,
  city: "",
};

export const defaultPaymentsReportFilters: PaymentsReportFilters = {
  ...defaultDates,
  granularity: "daily",
  status: "all",
  orderNumber: "",
};

export function countDateFilters(filters: ReportDateFilters) {
  let count = 0;
  const defaults = getDefaultReportDateRange(30);
  if (filters.createdFrom && filters.createdFrom !== defaults.createdFrom) {
    count += 1;
  }
  if (filters.createdTo && filters.createdTo !== defaults.createdTo) {
    count += 1;
  }
  return count;
}

export function countProductReportFilters(filters: ProductReportFilters) {
  let count = countDateFilters(filters);
  if (filters.granularity !== "daily") count += 1;
  if (filters.search.trim()) count += 1;
  if (filters.categoryId.trim()) count += 1;
  if (filters.isActive !== "all") count += 1;
  return count;
}

export function countSalesReportFilters(filters: SalesReportFilters) {
  let count = countDateFilters(filters);
  if (filters.granularity !== "daily") count += 1;
  if (filters.categoryId.trim()) count += 1;
  if (filters.city.trim()) count += 1;
  return count;
}

export function countOrdersReportFilters(filters: OrdersReportFilters) {
  let count = countDateFilters(filters);
  if (filters.granularity !== "daily") count += 1;
  if (filters.status !== "all") count += 1;
  if (filters.customerId.trim()) count += 1;
  if (filters.orderNumber.trim()) count += 1;
  if (filters.customerPhone.trim()) count += 1;
  if (filters.paymentStatus !== "all") count += 1;
  if (filters.city.trim()) count += 1;
  return count;
}

export function countInventoryReportFilters(filters: InventoryReportFilters) {
  let count = 0;
  if (filters.categoryId.trim()) count += 1;
  if (filters.lowStockOnly) count += 1;
  if (filters.outOfStockOnly) count += 1;
  if (filters.isActive !== "all") count += 1;
  return count;
}

export function countCustomersReportFilters(filters: CustomersReportFilters) {
  let count = countDateFilters(filters);
  if (filters.granularity !== "daily") count += 1;
  if (filters.hasOrderInRange) count += 1;
  if (filters.city.trim()) count += 1;
  return count;
}

export function countPaymentsReportFilters(filters: PaymentsReportFilters) {
  let count = countDateFilters(filters);
  if (filters.granularity !== "daily") count += 1;
  if (filters.status !== "all") count += 1;
  if (filters.orderNumber.trim()) count += 1;
  return count;
}

export const reportTabLabels: Record<ReportKind, string> = {
  products: "Products",
  sales: "Sales",
  orders: "Orders",
  inventory: "Inventory",
  customers: "Customers",
  payments: "Payments",
};

export const reportKinds: ReportKind[] = [
  "products",
  "sales",
  "orders",
  "inventory",
  "customers",
  "payments",
];

export function reportPath(kind: ReportKind) {
  return `/reports/${kind}`;
}

export function isReportKind(value: string | undefined): value is ReportKind {
  return reportKinds.includes(value as ReportKind);
}

export function buildProductReportParams(
  filters: ProductReportFilters,
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
    granularity: filters.granularity,
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.categoryId.trim()
      ? { categoryId: Number(filters.categoryId) }
      : {}),
    ...(filters.isActive !== "all"
      ? { isActive: filters.isActive === "true" }
      : {}),
  };
}

export function buildSalesReportParams(
  filters: SalesReportFilters,
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
    granularity: filters.granularity,
    ...(filters.categoryId.trim()
      ? { categoryId: Number(filters.categoryId) }
      : {}),
    ...(filters.city.trim() ? { city: filters.city.trim() } : {}),
  };
}

export function buildOrdersReportParams(
  filters: OrdersReportFilters,
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
    granularity: filters.granularity,
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.customerId.trim()
      ? { customerId: Number(filters.customerId) }
      : {}),
    ...(filters.orderNumber.trim()
      ? { orderNumber: filters.orderNumber.trim() }
      : {}),
    ...(filters.customerPhone.trim()
      ? { customerPhone: filters.customerPhone.trim() }
      : {}),
    ...(filters.paymentStatus !== "all"
      ? { paymentStatus: filters.paymentStatus }
      : {}),
    ...(filters.city.trim() ? { city: filters.city.trim() } : {}),
  };
}

export function buildInventoryReportParams(
  filters: InventoryReportFilters,
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    ...(filters.categoryId.trim()
      ? { categoryId: Number(filters.categoryId) }
      : {}),
    ...(filters.lowStockOnly ? { lowStockOnly: true } : {}),
    ...(filters.outOfStockOnly ? { outOfStockOnly: true } : {}),
    ...(filters.isActive !== "all"
      ? { isActive: filters.isActive === "true" }
      : {}),
  };
}

export function buildCustomersReportParams(
  filters: CustomersReportFilters,
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
    granularity: filters.granularity,
    ...(filters.hasOrderInRange ? { hasOrderInRange: true } : {}),
    ...(filters.city.trim() ? { city: filters.city.trim() } : {}),
  };
}

export function buildPaymentsReportParams(
  filters: PaymentsReportFilters,
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
    granularity: filters.granularity,
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.orderNumber.trim()
      ? { orderNumber: filters.orderNumber.trim() }
      : {}),
  };
}
