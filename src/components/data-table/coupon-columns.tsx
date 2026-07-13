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
import { formatDate } from "@/lib/format";
import { formatCouponDiscount, getCouponStatus } from "@/lib/coupon-utils";
import type { Coupon } from "@/types/coupon";

export const couponColumns: ColumnDef<Coupon>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <Link
        to={`/coupons/${row.original.id}`}
        className="font-mono font-medium hover:underline"
      >
        {row.getValue("code")}
      </Link>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("type") === "FLAT_CART" ? "Flat" : "Percentage"}
      </span>
    ),
  },
  {
    id: "discount",
    header: "Discount",
    cell: ({ row }) => formatCouponDiscount(row.original),
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => (
      <StatusBadge variant="neutral">{row.getValue("visibility")}</StatusBadge>
    ),
  },
  {
    id: "usage",
    header: "Usage",
    cell: ({ row }) => {
      const { usedCount, maxUses } = row.original;
      return maxUses !== null ? `${usedCount} / ${maxUses}` : `${usedCount} / ∞`;
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const { label, variant } = getCouponStatus(row.original);
      return <StatusBadge variant={variant}>{label}</StatusBadge>;
    },
  },
  {
    accessorKey: "expiresAt",
    header: "Expires",
    cell: ({ row }) => formatDate(row.getValue("expiresAt"), { dateStyle: "medium", timeStyle: undefined }),
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
            <Link to={`/coupons/${row.original.id}`}>View details</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link to={`/coupons/${row.original.id}/edit`}>Edit</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
