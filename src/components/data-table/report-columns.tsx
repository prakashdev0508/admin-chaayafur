import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { getOrderStatusLabel, orderStatusVariants } from "@/lib/order-status";
import {
  paymentStatusLabels,
  paymentStatusVariants,
} from "@/lib/payment-status";
import type {
  CustomerReportRow,
  InventoryReportRow,
  OrderReportRow,
  PaymentReportRow,
  ProductReportRow,
  SalesReportRow,
} from "@/types/reports";
import type { OrderStatus } from "@/types/order";
import type { PaymentStatus } from "@/types/payment";

function formatReportPeriod(period: string) {
  return formatDate(period, { dateStyle: "medium", timeStyle: undefined });
}

export const productReportColumns: ColumnDef<ProductReportRow>[] = [
  { accessorKey: "name", header: "Product" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "subCategory", header: "Subcategory" },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.stock}</span>
    ),
  },
  {
    accessorKey: "unitsSold",
    header: "Units sold",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.unitsSold}</span>
    ),
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    cell: ({ row }) => formatCurrency(row.original.revenue),
  },
  {
    accessorKey: "avgSellingPrice",
    header: "Avg price",
    cell: ({ row }) =>
      row.original.avgSellingPrice
        ? formatCurrency(row.original.avgSellingPrice)
        : "—",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

export const salesReportColumns: ColumnDef<SalesReportRow>[] = [
  {
    accessorKey: "period",
    header: "Period",
    cell: ({ row }) => formatReportPeriod(row.original.period),
  },
  {
    accessorKey: "orderCount",
    header: "Orders",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.orderCount}</span>
    ),
  },
  {
    accessorKey: "grossRevenue",
    header: "Gross revenue",
    cell: ({ row }) => formatCurrency(row.original.grossRevenue),
  },
  {
    accessorKey: "subtotal",
    header: "Subtotal",
    cell: ({ row }) => formatCurrency(row.original.subtotal),
  },
  {
    accessorKey: "discount",
    header: "Discount",
    cell: ({ row }) => formatCurrency(row.original.discount),
  },
  {
    accessorKey: "shipping",
    header: "Shipping",
    cell: ({ row }) => formatCurrency(row.original.shipping),
  },
  {
    accessorKey: "refundsProcessed",
    header: "Refunds",
    cell: ({ row }) => formatCurrency(row.original.refundsProcessed),
  },
];

export const orderReportColumns: ColumnDef<OrderReportRow>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <Link to={`/orders/${row.original.id}`} className="font-medium hover:underline">
        {row.original.orderNumber}
      </Link>
    ),
  },
  {
    accessorKey: "customerPhone",
    header: "Customer",
    cell: ({ row }) => formatPhone(row.original.customerPhone),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant={orderStatusVariants[row.original.status]}>
        {getOrderStatusLabel(row.original.status)}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => formatCurrency(row.original.totalAmount),
  },
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => row.original.city ?? "—",
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const status = row.original.paymentStatus as PaymentStatus | null;
      if (!status) return "—";
      return (
        <StatusBadge variant={paymentStatusVariants[status] ?? "neutral"}>
          {paymentStatusLabels[status] ?? status}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

export const inventoryReportColumns: ColumnDef<InventoryReportRow>[] = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <Link
        to={`/products/${row.original.productId}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "category", header: "Category" },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.stock}</span>
    ),
  },
  {
    accessorKey: "unitPrice",
    header: "Unit price",
    cell: ({ row }) => formatCurrency(row.original.unitPrice),
  },
  {
    accessorKey: "stockValue",
    header: "Stock value",
    cell: ({ row }) => formatCurrency(row.original.stockValue),
  },
  {
    id: "flags",
    header: "Flags",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.isLowStock && (
          <Badge variant="outline" className="text-amber-700">
            Low stock
          </Badge>
        )}
        {!row.original.isActive && (
          <Badge variant="secondary">Inactive</Badge>
        )}
      </div>
    ),
  },
];

export const customerReportColumns: ColumnDef<CustomerReportRow>[] = [
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <Link
        to={`/customers/${row.original.customerId}`}
        className="font-medium hover:underline"
      >
        {formatPhone(row.original.phone)}
      </Link>
    ),
  },
  {
    accessorKey: "registeredAt",
    header: "Registered",
    cell: ({ row }) => formatDate(row.original.registeredAt),
  },
  {
    accessorKey: "orderCount",
    header: "Orders",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.orderCount}</span>
    ),
  },
  {
    accessorKey: "totalSpent",
    header: "Total spent",
    cell: ({ row }) => formatCurrency(row.original.totalSpent),
  },
  {
    accessorKey: "lastOrderAt",
    header: "Last order",
    cell: ({ row }) =>
      row.original.lastOrderAt ? formatDate(row.original.lastOrderAt) : "—",
  },
  {
    accessorKey: "primaryCity",
    header: "City",
    cell: ({ row }) => row.original.primaryCity ?? "—",
  },
];

export const paymentReportColumns: ColumnDef<PaymentReportRow>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => row.original.orderNumber,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.amount),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status as PaymentStatus;
      return (
        <StatusBadge variant={paymentStatusVariants[status] ?? "neutral"}>
          {paymentStatusLabels[status] ?? status}
        </StatusBadge>
      );
    },
  },
  { accessorKey: "paymentMethod", header: "Method" },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

export function formatOrderSummaryStatus(status: string) {
  if (status in orderStatusVariants) {
    return getOrderStatusLabel(status as OrderStatus);
  }
  return status;
}
