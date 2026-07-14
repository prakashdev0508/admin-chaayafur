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
import { formatCurrency } from "@/lib/format";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/lib/order-status";
import type { OrderListItem } from "@/types/order";

export const orderColumns: ColumnDef<OrderListItem>[] = [
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
    id: "customer",
    header: "Customer",
    cell: ({ row }) => row.original.customer?.phone ?? `Customer #${row.original.customerId}`,
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
    accessorKey: "totalAmount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.getValue("totalAmount")),
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
          <DropdownMenuItem
            render={<Link to={`/orders/${row.original.id}`}>View details</Link>}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
