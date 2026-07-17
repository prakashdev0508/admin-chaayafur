import { formatCurrency, formatPhone } from "@/lib/format";
import type {
  CustomersReportKpis,
  InventoryReportKpis,
  OrdersReportKpis,
  PaymentsReportKpis,
  ProductReportKpis,
  SalesReportKpis,
} from "@/types/reports";

export type ReportKpiCard = {
  label: string;
  value: string;
  description?: string;
};

export function productReportKpis(kpis: ProductReportKpis): ReportKpiCard[] {
  return [
    {
      label: "Total products",
      value: String(kpis.totalProducts),
      description: `${kpis.activeProducts} active in catalog`,
    },
    {
      label: "Units sold",
      value: String(kpis.unitsSold),
      description: "In selected period",
    },
    {
      label: "Gross revenue",
      value: formatCurrency(kpis.grossRevenue),
      description: `Avg ${formatCurrency(kpis.avgSellingPrice)} / unit`,
    },
    {
      label: "Top product",
      value: kpis.topProduct?.name ?? "—",
      description: kpis.topProduct
        ? `${kpis.topProduct.units} units sold`
        : "No sales in period",
    },
  ];
}

export function salesReportKpis(kpis: SalesReportKpis): ReportKpiCard[] {
  return [
    {
      label: "Orders",
      value: String(kpis.orderCount),
      description: `AOV ${formatCurrency(kpis.averageOrderValue)}`,
    },
    {
      label: "Gross revenue",
      value: formatCurrency(kpis.grossRevenue),
      description: "Countable orders",
    },
    {
      label: "Net revenue",
      value: formatCurrency(kpis.netRevenue),
      description: `${formatCurrency(kpis.refundsProcessed)} refunded`,
    },
    {
      label: "Discounts & shipping",
      value: formatCurrency(kpis.totalDiscount),
      description: `Shipping ${formatCurrency(kpis.totalShipping)}`,
    },
  ];
}

export function ordersReportKpis(kpis: OrdersReportKpis): ReportKpiCard[] {
  return [
    {
      label: "Total orders",
      value: String(kpis.totalOrders),
      description: "Matching filters",
    },
    {
      label: "Gross revenue",
      value: formatCurrency(kpis.grossRevenue),
      description: `AOV ${formatCurrency(kpis.averageOrderValue)}`,
    },
    {
      label: "Delivered",
      value: String(kpis.deliveredCount),
      description: `${kpis.pendingCount} pending`,
    },
    {
      label: "Cancelled",
      value: String(kpis.cancelledCount),
      description: "In period",
    },
  ];
}

export function inventoryReportKpis(kpis: InventoryReportKpis): ReportKpiCard[] {
  return [
    {
      label: "SKUs",
      value: String(kpis.totalSkus),
      description: `${kpis.totalStockUnits} total units`,
    },
    {
      label: "Inventory value",
      value: formatCurrency(kpis.inventoryValue),
      description: "Stock × price",
    },
    {
      label: "Low stock",
      value: String(kpis.lowStockCount),
      description: "At or below threshold",
    },
    {
      label: "Out of stock",
      value: String(kpis.outOfStockCount),
      description: "Zero units on hand",
    },
  ];
}

export function customersReportKpis(
  kpis: CustomersReportKpis,
): ReportKpiCard[] {
  return [
    {
      label: "Customers",
      value: String(kpis.totalCustomers),
      description: `${kpis.newCustomers} new in period`,
    },
    {
      label: "With orders",
      value: String(kpis.customersWithOrders),
      description: "At least one completed sale",
    },
    {
      label: "Repeat buyers",
      value: String(kpis.repeatCustomers),
      description: "Two or more orders in period",
    },
    {
      label: "Total spent",
      value: formatCurrency(kpis.totalSpent),
      description: "Completed sales in period",
    },
  ];
}

export function paymentsReportKpis(kpis: PaymentsReportKpis): ReportKpiCard[] {
  return [
    {
      label: "Payments",
      value: String(kpis.paymentCount),
      description: "Matching filters",
    },
    {
      label: "Total amount",
      value: formatCurrency(kpis.totalAmount),
      description: `${formatCurrency(kpis.completedAmount)} completed`,
    },
    {
      label: "Failed",
      value: String(kpis.failedCount),
      description: `${kpis.pendingCount} pending`,
    },
    {
      label: "Refunded",
      value: formatCurrency(kpis.refundedAmount),
      description: "Refunded volume",
    },
  ];
}

export function formatCustomerChartName(name: string) {
  if (/^\d{10}$/.test(name)) {
    return formatPhone(name);
  }
  return name;
}
