import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CustomerListItem } from "@/types/customer";

export const customerColumns: ColumnDef<CustomerListItem>[] = [
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <Link
        to={`/customers/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {formatPhone(row.getValue("phone"))}
      </Link>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant={row.original.isActive ? "success" : "danger"}>
        {row.original.isActive ? "Active" : "Blocked"}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "orderCount",
    header: "Orders",
  },
  {
    accessorKey: "reviewCount",
    header: "Reviews",
  },
  {
    accessorKey: "lastLogin",
    header: "Last login",
    cell: ({ row }) => {
      const val = row.getValue("lastLogin") as string | null;
      return val ? formatDate(val) : "—";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link
        to={`/customers/${row.original.id}`}
        aria-label="View customer profile"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8")}
      >
        <Eye className="size-4" />
      </Link>
    ),
  },
];
