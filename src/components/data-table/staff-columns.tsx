import { type ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import type { StaffListItem } from "@/types/auth";

function formatName(staff: StaffListItem) {
  const name = [staff.firstName, staff.lastName].filter(Boolean).join(" ");
  return name || "—";
}

function formatCreator(staff: StaffListItem) {
  if (!staff.creator) return "—";
  const name = [staff.creator.firstName, staff.creator.lastName]
    .filter(Boolean)
    .join(" ");
  return name || staff.creator.email;
}

const roleLabels: Record<StaffListItem["role"], string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ORDER_MANAGER: "Order Manager",
};

export const staffColumns: ColumnDef<StaffListItem>[] = [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("email")}</span>
    ),
  },
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => formatName(row.original),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as StaffListItem["role"];
      return (
        <StatusBadge variant={role === "SUPER_ADMIN" ? "brand" : "neutral"}>
          {roleLabels[role]}
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
        {formatCreator(row.original)}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
];
