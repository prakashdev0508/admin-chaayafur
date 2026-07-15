import { Link } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { formatStaffName, formatRoleLabel, isSuperAdminSlug } from "@/lib/staff-utils";
import type { StaffListItem } from "@/types/auth";

export const staffColumns: ColumnDef<StaffListItem>[] = [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <Link
        to={`/staff/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.getValue("email")}
      </Link>
    ),
  },
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => formatStaffName(row.original),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const slug = row.original.roleSlug ?? row.original.role;
      return (
        <StatusBadge variant={isSuperAdminSlug(slug) ? "brand" : "neutral"}>
          {formatRoleLabel(row.original)}
        </StatusBadge>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant={row.original.isActive ? "success" : "danger"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </StatusBadge>
    ),
  },
  {
    id: "creator",
    header: "Created by",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatStaffName(row.original.creator)}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
];
