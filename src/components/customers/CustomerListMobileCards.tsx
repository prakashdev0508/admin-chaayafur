import { Link } from "react-router-dom";
import { NotebookPen, ShoppingBag } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatPhone } from "@/lib/format";
import type { CustomerListItem } from "@/types/customer";

type CustomerListMobileCardsProps = {
  customers: CustomerListItem[];
};

export function CustomerListMobileCards({
  customers,
}: CustomerListMobileCardsProps) {
  if (customers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground md:hidden">
        No customers match this search.
      </p>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {customers.map((customer) => (
        <Link
          key={customer.id}
          to={`/customers/${customer.id}`}
          className="block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30 active:scale-[0.99]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold tracking-tight">
                {formatPhone(customer.phone)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                #{customer.id}
              </p>
            </div>
            <StatusBadge variant={customer.isActive ? "success" : "danger"}>
              {customer.isActive ? "Active" : "Blocked"}
            </StatusBadge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <ShoppingBag className="size-3.5 opacity-60" />
              {customer.orderCount} orders
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <NotebookPen className="size-3.5 opacity-60" />
              {customer.followUpCount} follow-ups
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {customer.lastLogin
              ? `Last login ${formatDate(customer.lastLogin)}`
              : "Never logged in"}
          </p>
        </Link>
      ))}
    </div>
  );
}
