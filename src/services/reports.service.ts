import { buildQueryString } from "@/lib/build-query";
import { apiBlobRequest, apiRequest } from "@/lib/api";
import type {
  CustomersReportParams,
  CustomersReportResponse,
  InventoryReportParams,
  InventoryReportResponse,
  OrdersReportParams,
  OrdersReportResponse,
  PaymentsReportParams,
  PaymentsReportResponse,
  ProductReportParams,
  ProductReportResponse,
  ReportKind,
  SalesReportParams,
  SalesReportResponse,
} from "@/types/reports";

export function getProductReport(params: ProductReportParams = {}) {
  return apiRequest<ProductReportResponse>(
    `/admin/reports/products${buildQueryString(params)}`,
  );
}

export function getSalesReport(params: SalesReportParams = {}) {
  return apiRequest<SalesReportResponse>(
    `/admin/reports/sales${buildQueryString(params)}`,
  );
}

export function getOrdersReport(params: OrdersReportParams = {}) {
  return apiRequest<OrdersReportResponse>(
    `/admin/reports/orders${buildQueryString(params)}`,
  );
}

export function getInventoryReport(params: InventoryReportParams = {}) {
  return apiRequest<InventoryReportResponse>(
    `/admin/reports/inventory${buildQueryString(params)}`,
  );
}

export function getCustomersReport(params: CustomersReportParams = {}) {
  return apiRequest<CustomersReportResponse>(
    `/admin/reports/customers${buildQueryString(params)}`,
  );
}

export function getPaymentsReport(params: PaymentsReportParams = {}) {
  return apiRequest<PaymentsReportResponse>(
    `/admin/reports/payments${buildQueryString(params)}`,
  );
}

/** @deprecated Use get*Report — kept as alias during migration */
export const listProductReport = getProductReport;
export const listSalesReport = getSalesReport;
export const listOrdersReport = getOrdersReport;
export const listInventoryReport = getInventoryReport;
export const listCustomersReport = getCustomersReport;
export const listPaymentsReport = getPaymentsReport;

const exportPaths: Record<ReportKind, string> = {
  products: "/admin/reports/products/export",
  sales: "/admin/reports/sales/export",
  orders: "/admin/reports/orders/export",
  inventory: "/admin/reports/inventory/export",
  customers: "/admin/reports/customers/export",
  payments: "/admin/reports/payments/export",
};

export function exportReport(
  kind: ReportKind,
  params: Record<string, unknown> = {},
) {
  const {
    page: _page,
    limit: _limit,
    granularity,
    ...rest
  } = params;

  const exportParams: Record<string, unknown> = { ...rest };
  if (kind === "sales" && granularity !== undefined && granularity !== "") {
    exportParams.granularity = granularity;
  }

  return apiBlobRequest(`${exportPaths[kind]}${buildQueryString(exportParams)}`);
}
