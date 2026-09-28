import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/lib/order-status";
import type { CustomerOrderSummary } from "@/types/customer";

type CustomerOrderMobileCardsProps = {
  orders: CustomerOrderSummary[];
};

export function CustomerOrderMobileCards({
  orders,
}: CustomerOrderMobileCardsProps) {
  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 md:hidden">
      {orders.map((order) => (
        <Link
          key={order.id}
          to={`/orders/${order.id}`}
          className="block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30 active:scale-[0.99]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold tracking-tight">{order.orderNumber}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <StatusBadge variant={getOrderStatusVariant(order.status)}>
              {getOrderStatusLabel(order.status)}
            </StatusBadge>
          </div>
          <p className="mt-3 text-base font-semibold tabular-nums">
            {formatCurrency(order.totalAmount)}
          </p>
        </Link>
      ))}
    </div>
  );
}
