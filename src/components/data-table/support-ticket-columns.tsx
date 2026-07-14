import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { SupportTicketStatusBadge } from "@/components/support-tickets/SupportTicketStatusBadge";
import { formatDate, formatPhone } from "@/lib/format";
import { supportTicketTypeLabels } from "@/lib/support-ticket-status";
import type { SupportTicketListItem } from "@/types/support-ticket";

export const supportTicketColumns: ColumnDef<SupportTicketListItem>[] = [
  {
    accessorKey: "ticketNumber",
    header: "Ticket",
    cell: ({ row }) => (
      <Link
        to={`/support-tickets/${row.original.id}`}
        className="font-mono font-medium hover:underline"
      >
        {row.getValue("ticketNumber")}
      </Link>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-[240px]">{row.getValue("subject")}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => supportTicketTypeLabels[row.original.type],
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <SupportTicketStatusBadge status={row.original.status} />,
  },
  {
    id: "order",
    header: "Order",
    cell: ({ row }) => (
      <Link
        to={`/orders/${row.original.orderId}`}
        className="hover:underline"
      >
        {row.original.order.orderNumber}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) =>
      row.original.customer ? (
        <Link
          to={`/customers/${row.original.customer!.id}`}
          className="hover:underline"
        >
          {formatPhone(row.original.customer.phone)}
        </Link>
      ) : (
        "—"
      ),
  },
  {
    id: "lastMessageAt",
    header: "Last message",
    cell: ({ row }) =>
      row.original.lastMessageAt
        ? formatDate(row.original.lastMessageAt)
        : formatDate(row.original.createdAt),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) =>
      formatDate(row.getValue("createdAt"), {
        dateStyle: "medium",
        timeStyle: undefined,
      }),
  },
];
