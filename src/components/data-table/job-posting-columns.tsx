import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { JobPosting } from "@/types/career";

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export function createJobPostingColumns(
  applicationCounts: Record<number, number | undefined>,
): ColumnDef<JobPosting>[] {
  return [
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
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <p className="max-w-60 font-medium line-clamp-2">{row.original.title}</p>
      ),
    },
    {
      id: "applications",
      header: "Applications",
      cell: ({ row }) => {
        const count =
          row.original.applicationCount ??
          applicationCounts[row.original.id];
        return (
          <span className="tabular-nums text-muted-foreground">
            {count === undefined ? "…" : count}
          </span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={row.original.isActive ? "success" : "neutral"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link
          to={`/careers/${row.original.id}`}
          onClick={stopRowClick}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          aria-label={`View job posting #${row.original.id}`}
        >
          <Eye className="size-4" />
        </Link>
      ),
    },
  ];
}
