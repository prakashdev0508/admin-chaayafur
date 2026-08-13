import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  careerStatusLabels,
  careerStatusVariants,
} from "@/lib/career-status";
import { formatDate, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CareerApplication } from "@/types/career";

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export const careerApplicationColumns: ColumnDef<CareerApplication>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link
        to={`/careers/${row.original.id}`}
        onClick={stopRowClick}
        className="font-medium hover:underline"
      >
        #{row.original.id}
      </Link>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <p className="font-medium">{row.original.name}</p>
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
    accessorKey: "contactNumber",
    header: "Phone",
    cell: ({ row }) => formatPhone(row.original.contactNumber),
  },
  {
    accessorKey: "designation",
    header: "Designation",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-50">
        {row.original.designation}
      </span>
    ),
  },
  {
    accessorKey: "experience",
    header: "Experience",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.experience}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant={careerStatusVariants[row.original.status]}>
        {careerStatusLabels[row.original.status]}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Received",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "resume",
    header: "Resume",
    cell: ({ row }) =>
      row.original.resumeUrl ? (
        <a
          href={row.original.resumeUrl}
          target="_blank"
          rel="noreferrer"
          onClick={stopRowClick}
          className="text-sm font-medium hover:underline"
        >
          PDF
        </a>
      ) : (
        "—"
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link
        to={`/careers/${row.original.id}`}
        onClick={stopRowClick}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        aria-label={`View application #${row.original.id}`}
      >
        <Eye className="size-4" />
      </Link>
    ),
  },
];
