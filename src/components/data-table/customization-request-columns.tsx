import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { CustomizationRequestStatusBadge } from "@/components/customization-requests/CustomizationRequestStatusBadge";
import { formatDate, formatPhone } from "@/lib/format";
import type { CustomizationRequest } from "@/types/customization-request";

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export const customizationRequestColumns: ColumnDef<CustomizationRequest>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link
        to={`/customization-requests/${row.original.id}`}
        onClick={stopRowClick}
        className="font-medium hover:underline"
      >
        #{row.original.id}
      </Link>
    ),
  },
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-[240px] font-medium">
        {row.original.productName}
      </span>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) =>
      row.original.customer
        ? formatPhone(row.original.customer.phone)
        : "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <CustomizationRequestStatusBadge status={row.original.status} />
    ),
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => row.original.quantity,
  },
  {
    accessorKey: "createdAt",
    header: "Submitted",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];
