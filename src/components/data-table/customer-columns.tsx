import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, NotebookPen, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CustomerListItem } from "@/types/customer";

export const customerColumns: ColumnDef<CustomerListItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link
        to={`/customers/${row.original.id}`}
        className="font-medium tabular-nums hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        #{row.original.id}
      </Link>
    ),
  },
  {
    accessorKey: "phone",
    header: "Customer",
    cell: ({ row }) => (
      <Link
        to={`/customers/${row.original.id}`}
        className="font-medium tracking-tight hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        {formatPhone(row.original.phone)}
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
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 tabular-nums text-muted-foreground">
        <ShoppingBag className="size-3.5 opacity-60" />
        {row.original.orderCount}
      </span>
    ),
  },
  {
    accessorKey: "followUpCount",
    header: "Follow-ups",
    cell: ({ row }) => (
      <Link
        to={`/customers/${row.original.id}?tab=follow-ups`}
        className="inline-flex items-center gap-1.5 tabular-nums text-muted-foreground hover:text-foreground"
        onClick={(event) => event.stopPropagation()}
      >
        <NotebookPen className="size-3.5 opacity-60" />
        {row.original.followUpCount}
      </Link>
    ),
  },
  {
    accessorKey: "lastLogin",
    header: "Last login",
    cell: ({ row }) => {
      const val = row.original.lastLogin;
      if (!val) {
        return <span className="text-muted-foreground">Never</span>;
      }
      return (
        <span className="text-muted-foreground">
          {formatDate(val, { dateStyle: "medium", timeStyle: "short" })}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <Link
        to={`/customers/${row.original.id}`}
        aria-label="Open customer"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "text-muted-foreground",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        Open
        <ArrowUpRight className="size-3.5" />
      </Link>
    ),
  },
];
