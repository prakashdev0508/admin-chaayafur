import { type ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { formatCouponDiscount, getCouponStatus } from "@/lib/coupon-utils";
import { cn } from "@/lib/utils";
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
    id: "perPerson",
    header: "Per customer",
    cell: ({ row }) => {
      const limit = row.original.perPersonAllowed;
      return limit !== null ? limit : "∞";
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
      <div className="flex items-center gap-1">
        <Link
          to={`/coupons/${row.original.id}`}
          aria-label="View coupon details"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8")}
        >
          <Eye className="size-4" />
        </Link>
        <Link
          to={`/coupons/${row.original.id}/edit`}
          aria-label="Edit coupon"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8")}
        >
          <Pencil className="size-4" />
        </Link>
      </div>
    ),
  },
];
