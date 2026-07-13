import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatCurrency,
  paymentStatusLabels,
  paymentStatusVariants,
} from "@/data/mockPayments";
import type { Payment } from "@/types";

export const paymentColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link
        to={`/payments/${row.original.id}`}
        className="font-medium hover:underline"
      >
        #{row.getValue("id")}
      </Link>
    ),
  },
  {
    id: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <Link
        to={`/orders/${row.original.orderId}`}
        className="text-muted-foreground hover:underline"
      >
        {row.original.order.orderNumber}
      </Link>
    ),
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
      const status = row.getValue("status") as string;
      return (
        <StatusBadge variant={paymentStatusVariants[status]}>
          {paymentStatusLabels[status]}
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
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Link to={`/payments/${row.original.id}`}>View details</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
