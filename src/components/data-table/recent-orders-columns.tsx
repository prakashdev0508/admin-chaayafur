import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/format";
import type { RecentOrderRow } from "@/types";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";

export const recentOrdersColumns: ColumnDef<RecentOrderRow>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("orderNumber")}</span>
    ),
  },
  {
    accessorKey: "customer",
    header: "Customer",
  },
  {
    accessorKey: "item",
    header: "Item",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("item")}</span>
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
      const status = row.getValue("status") as import("@/types/order").OrderStatus;
      return (
        <StatusBadge variant={getOrderStatusVariant(status)}>
          {getOrderStatusLabel(status)}
        </StatusBadge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link
        to={`/orders/${row.original.id}`}
        aria-label="View order details"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8")}
      >
        <Eye className="size-4" />
      </Link>
    ),
  },
];
