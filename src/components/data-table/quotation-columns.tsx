import { type ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import {
  quotationStatusLabel,
  quotationStatusVariant,
} from "@/lib/quotation";
import { cn } from "@/lib/utils";
import type { QuotationListItem } from "@/types/quotation";

export const quotationColumns: ColumnDef<QuotationListItem>[] = [
  {
    accessorKey: "quotationNumber",
    header: "Number",
    cell: ({ row }) => (
      <Link
        to={`/quotations/${row.original.id}`}
        className="font-mono font-medium hover:underline"
      >
        {row.getValue("quotationNumber")}
      </Link>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "mobileNumber",
    header: "Mobile",
    cell: ({ row }) => formatPhone(row.original.mobileNumber),
  },
  {
    accessorKey: "totalPrice",
    header: "Total",
    cell: ({ row }) => formatCurrency(row.original.totalPrice),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant={quotationStatusVariant(row.original.status)}>
        {quotationStatusLabel(row.original.status)}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "validUntil",
    header: "Valid until",
    cell: ({ row }) =>
      formatDate(row.original.validUntil, {
        dateStyle: "medium",
        timeStyle: undefined,
      }),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) =>
      formatDate(row.original.createdAt, {
        dateStyle: "medium",
        timeStyle: undefined,
      }),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Link
          to={`/quotations/${row.original.id}`}
          aria-label="View quotation"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "size-8",
          )}
        >
          <Eye className="size-4" />
        </Link>
        <Link
          to={`/quotations/${row.original.id}/edit`}
          aria-label="Edit quotation"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "size-8",
          )}
        >
          <Pencil className="size-4" />
        </Link>
      </div>
    ),
  },
];
