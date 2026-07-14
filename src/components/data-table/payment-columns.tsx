import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/format";
import {
  paymentStatusLabels,
  paymentStatusVariants,
} from "@/lib/payment-status";
import { cn } from "@/lib/utils";
import type { Payment, PaymentStatus } from "@/types/payment";

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export const paymentColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link
        to={`/payments/${row.original.id}`}
        onClick={stopRowClick}
        className="font-medium hover:underline"
      >
        #{row.original.id}
      </Link>
    ),
  },
  {
    id: "orderNumber",
    header: "Order",
    cell: ({ row }) => {
      const orderId = row.original.order?.id ?? row.original.orderId;
      const label =
        row.original.order?.orderNumber ?? `Order #${row.original.orderId}`;

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
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.getValue("amount")),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as PaymentStatus;
      return (
        <StatusBadge variant={paymentStatusVariants[status] ?? "neutral"}>
          {paymentStatusLabels[status] ?? status}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: "paymentMethod",
    header: "Method",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) =>
      new Date(row.getValue("createdAt")).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
  },
  {
    id: "actions",
    header: " ",
    cell: ({ row }) => (
      <div className="relative z-10 flex justify-end" onClick={stopRowClick}>
        <Link
          to={`/payments/${row.original.id}`}
          aria-label="View payment details"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "size-8 text-foreground",
          )}
        >
          <Eye className="size-4" />
        </Link>
      </div>
    ),
  },
];
