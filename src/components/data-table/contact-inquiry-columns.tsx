import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ContactInquiry } from "@/types/contact";

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export const contactInquiryColumns: ColumnDef<ContactInquiry>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link
        to={`/contact/${row.original.id}`}
        onClick={stopRowClick}
        className="font-medium hover:underline"
      >
        #{row.original.id}
      </Link>
    ),
  },
  {
    accessorKey: "fullName",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.fullName}</p>
        {row.original.companyName && (
          <p className="text-xs text-muted-foreground">
            {row.original.companyName}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    id: "phone",
    header: "Phone",
    cell: ({ row }) =>
      row.original.phone ? formatPhone(row.original.phone) : "—",
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-[220px] text-muted-foreground">
        {row.original.subject || "—"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.repliedAt ? (
        <StatusBadge variant="success">Replied</StatusBadge>
      ) : (
        <StatusBadge variant="warning">New</StatusBadge>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Received",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link
        to={`/contact/${row.original.id}`}
        onClick={stopRowClick}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        aria-label={`View inquiry #${row.original.id}`}
      >
        <Eye className="size-4" />
      </Link>
    ),
  },
];
