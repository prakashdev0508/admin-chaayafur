import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/lib/order-status";
import type { OrderListItem } from "@/types/order";

type OrderListMobileCardsProps = {
  orders: OrderListItem[];
};

export function OrderListMobileCards({ orders }: OrderListMobileCardsProps) {
  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        No orders match these filters.
      </p>
    );
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
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {order.customerPhone ?? `Customer #${order.customerId}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.orderType === "MANUAL" ? "Manual" : "Checkout"}
              </p>
            </div>
            <StatusBadge variant={getOrderStatusVariant(order.status)}>
              {getOrderStatusLabel(order.status)}
            </StatusBadge>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-base font-semibold tabular-nums">
              {formatCurrency(order.totalAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
