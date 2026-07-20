import type { OrderStatus } from "@/types/order";
import type { StatusVariant } from "@/lib/status-variants";

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  CONFIRMED: "Payment received",
  UNDER_PRODUCTION: "Under production",
  PACKING: "Packing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  REFUND_INITIATED: "Refund initiated",
  PARTIALLY_REFUNDED: "Partially refunded",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

export const orderStatusVariants: Record<OrderStatus, StatusVariant> = {
  PENDING: "warning",
  CONFIRMED: "brand",
  UNDER_PRODUCTION: "brand",
  PACKING: "default",
  SHIPPED: "default",
  DELIVERED: "success",
  REFUND_INITIATED: "warning",
  PARTIALLY_REFUNDED: "warning",
  REFUNDED: "neutral",
  CANCELLED: "danger",
};

/** Staff PATCH transitions from docs/orders.md lifecycle. */
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["UNDER_PRODUCTION", "CANCELLED"],
  UNDER_PRODUCTION: ["PACKING", "CANCELLED"],
  PACKING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  REFUND_INITIATED: [],
  PARTIALLY_REFUNDED: [],
  REFUNDED: [],
  CANCELLED: [],
};

export function getOrderStatusLabel(status: string) {
  return orderStatusLabels[status as OrderStatus] ?? status;
}

export function getOrderStatusVariant(status: string): StatusVariant {
  return orderStatusVariants[status as OrderStatus] ?? "neutral";
}

export function getAllowedStatusTransitions(
  current: OrderStatus,
): OrderStatus[] {
  return allowedTransitions[current] ?? [];
}

/** Statuses set only by the refund flow — not via PATCH order status. */
export const REFUND_ORDER_STATUSES: readonly OrderStatus[] = [
  "REFUND_INITIATED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const;

export function isRefundOrderStatus(status: OrderStatus) {
  return (REFUND_ORDER_STATUSES as readonly string[]).includes(status);
}

/** Statuses staff can choose in Update order (excludes refund-driven ones). */
export const STAFF_SELECTABLE_ORDER_STATUSES: OrderStatus[] = (
  Object.keys(orderStatusLabels) as OrderStatus[]
).filter((status) => !isRefundOrderStatus(status));

export function isOrderEditable(status: OrderStatus) {
  return (
    status !== "CANCELLED" &&
    status !== "DELIVERED" &&
    !isRefundOrderStatus(status)
  );
}
