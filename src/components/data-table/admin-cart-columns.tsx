import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminCartListItem } from "@/types/cart";

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export const adminCartColumns: ColumnDef<AdminCartListItem>[] = [
  {
    accessorKey: "id",
    header: "Cart",
    cell: ({ row }) => (
      <Link
        to={`/carts/${row.original.id}`}
        onClick={stopRowClick}
        className="font-medium hover:underline"
      >
        #{row.original.id}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <Link
        to={`/customers/${row.original.customerId}`}
        onClick={stopRowClick}
        className="hover:underline"
      >
        {formatPhone(row.original.customerPhone)}
      </Link>
    ),
  },
  {
    accessorKey: "itemCount",
    header: "Qty",
  },
  {
    accessorKey: "lineCount",
    header: "Lines",
  },
  {
    accessorKey: "subtotalAmount",
    header: "Subtotal",
    cell: ({ row }) => formatCurrency(row.original.subtotalAmount),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => formatDate(row.original.updatedAt),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link
        to={`/carts/${row.original.id}`}
        onClick={stopRowClick}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
      >
        <Eye className="size-4" />
      </Link>
    ),
  },
];
