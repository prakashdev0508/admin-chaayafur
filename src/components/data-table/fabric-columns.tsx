import { type ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { Fabric } from "@/types/fabric";

export const fabricColumns: ColumnDef<Fabric>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        to={`/fabrics/${row.original.id}/edit`}
        className="flex items-center gap-2 font-medium hover:underline"
      >
        <span
          className="size-4 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: row.original.color }}
          aria-hidden
        />
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.getValue("slug")}
      </span>
    ),
  },
  {
    accessorKey: "color",
    header: "Color",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.getValue("color")}
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) =>
      row.original.isActive ? (
        <StatusBadge variant="success">Active</StatusBadge>
      ) : (
        <StatusBadge variant="neutral">Inactive</StatusBadge>
      ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <Link
        to={`/fabrics/${row.original.id}/edit`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        aria-label={`Edit ${row.original.name}`}
      >
        <Pencil className="size-4" />
      </Link>
    ),
  },
];
