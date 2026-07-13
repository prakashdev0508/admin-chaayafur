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
import { formatDate, formatPhone } from "@/lib/format";
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
            <Link to={`/customers/${row.original.id}`}>View profile</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
