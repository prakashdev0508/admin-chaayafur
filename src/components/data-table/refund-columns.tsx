import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { getOrderStatusLabel } from "@/lib/order-status";
import {
  refundStatusLabels,
  refundStatusVariants,
} from "@/lib/refund-status";
import { cn } from "@/lib/utils";
import type { RefundListItem } from "@/types/refund";

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export const refundColumns: ColumnDef<RefundListItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link
        to={`/refunds/${row.original.id}`}
        onClick={stopRowClick}
        className="font-medium hover:underline"
      >
        #{row.original.id}
      </Link>
    ),
  },
  {
    id: "order",
    header: "Order",
    cell: ({ row }) => {
      const order = row.original.order;
      const orderId = order?.id ?? row.original.orderId;
      const label = order?.orderNumber ?? `Order #${orderId}`;
      return (
        <Link
          to={`/orders/${orderId}`}
          onClick={stopRowClick}
          className="text-muted-foreground hover:underline"
        >
          {label}
        </Link>
      );
    },
  },
  {
    id: "orderStatus",
    header: "Order status",
    cell: ({ row }) => {
      const status = row.original.order?.status;
      return status ? getOrderStatusLabel(status) : "—";
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.amount),
  },
  {
    accessorKey: "status",
    header: "Refund status",
    cell: ({ row }) => (
      <StatusBadge variant={refundStatusVariants[row.original.status]}>
        {refundStatusLabels[row.original.status]}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-[220px] text-muted-foreground">
        {row.original.reason || "—"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link
        to={`/refunds/${row.original.id}`}
        onClick={stopRowClick}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
      >
        <Eye className="size-4" />
      </Link>
    ),
  },
];
