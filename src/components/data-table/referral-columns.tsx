import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import {
  referralStatusLabels,
  referralStatusVariants,
} from "@/lib/referral-status";
import { cn } from "@/lib/utils";
import type { AdminReferralListItem } from "@/types/referral";

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export const referralColumns: ColumnDef<AdminReferralListItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-medium">#{row.original.id}</span>
    ),
  },
  {
    id: "referrer",
    header: "Referrer",
    cell: ({ row }) => {
      const referrer = row.original.referrer;
      return (
        <div className="space-y-0.5">
          <Link
            to={`/customers/${referrer.id}`}
            onClick={stopRowClick}
            className="font-medium hover:underline"
          >
            {formatPhone(referrer.phone)}
          </Link>
          {referrer.referralCode && (
            <p className="font-mono text-xs text-muted-foreground">
              {referrer.referralCode}
            </p>
          )}
        </div>
      );
    },
  },
  {
    id: "referee",
    header: "Referee",
    cell: ({ row }) => (
      <Link
        to={`/customers/${row.original.referee.id}`}
        onClick={stopRowClick}
        className="text-muted-foreground hover:underline"
      >
        {formatPhone(row.original.referee.phone)}
      </Link>
    ),
  },
  {
    id: "order",
    header: "Order",
    cell: ({ row }) => (
      <Link
        to={`/orders/${row.original.order.id}`}
        onClick={stopRowClick}
        className="hover:underline"
      >
        {row.original.order.orderNumber}
      </Link>
    ),
  },
  {
    accessorKey: "orderTotalAmount",
    header: "Order total",
    cell: ({ row }) => formatCurrency(row.original.orderTotalAmount),
  },
  {
    accessorKey: "commissionAmount",
    header: "Commission",
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <p>{formatCurrency(row.original.commissionAmount)}</p>
        <p className="text-xs text-muted-foreground">
          {(Number(row.original.commissionRate) * 100).toFixed(0)}%
        </p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant={referralStatusVariants[row.original.status]}>
        {referralStatusLabels[row.original.status]}
      </StatusBadge>
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
        to={`/orders/${row.original.order.id}`}
        onClick={stopRowClick}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        title="View order"
      >
        <Eye className="size-4" />
      </Link>
    ),
  },
];
