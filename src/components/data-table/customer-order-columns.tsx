import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  orderStatusLabels,
  orderStatusVariants,
} from "@/lib/order-status";
import type { CustomerOrderSummary } from "@/types/customer";

export const customerOrderColumns: ColumnDef<CustomerOrderSummary>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <Link
        to={`/orders/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.getValue("orderNumber")}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as CustomerOrderSummary["status"];
      return (
        <StatusBadge variant={orderStatusVariants[status]}>
          {orderStatusLabels[status]}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.getValue("totalAmount")),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
];
