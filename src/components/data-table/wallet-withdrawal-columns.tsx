import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import {
  walletWithdrawalMethodLabels,
  walletWithdrawalStatusLabels,
  walletWithdrawalStatusVariants,
} from "@/lib/wallet-status";
import { cn } from "@/lib/utils";
import type { WalletWithdrawalListItem } from "@/types/wallet";

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

function customerIdOf(row: WalletWithdrawalListItem) {
  return row.customer?.id ?? row.customerId;
}

export const walletWithdrawalColumns: ColumnDef<WalletWithdrawalListItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link
        to={`/wallet-withdrawals/${row.original.id}`}
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
    cell: ({ row }) => {
      const id = customerIdOf(row.original);
      const phone = row.original.customer?.phone;
      if (!id) return "—";
      return (
        <Link
          to={`/customers/${id}`}
          onClick={stopRowClick}
          className="hover:underline"
        >
          {phone ? formatPhone(phone) : `Customer #${id}`}
        </Link>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.amount),
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => walletWithdrawalMethodLabels[row.original.method],
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        variant={walletWithdrawalStatusVariants[row.original.status]}
      >
        {walletWithdrawalStatusLabels[row.original.status]}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Requested",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link
        to={`/wallet-withdrawals/${row.original.id}`}
        onClick={stopRowClick}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
      >
        <Eye className="size-4" />
      </Link>
    ),
  },
];
