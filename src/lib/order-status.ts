import type { OrderStatus } from "@/types/order";
import type { StatusVariant } from "@/lib/status-variants";

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Awaiting Razorpay payment",
  CONFIRMED: "Payment received",
  SHIPPED: "Order shipped",
  DELIVERED: "Order delivered",
  REFUND_INITIATED: "Staff started a refund",
  PARTIALLY_REFUNDED: "Partially refunded",
  REFUNDED: "Refund completed",
  CANCELLED: "Cancelled",
};

export const orderStatusVariants: Record<OrderStatus, StatusVariant> = {
  PENDING: "warning",
  CONFIRMED: "brand",
  SHIPPED: "default",
  DELIVERED: "success",
  REFUND_INITIATED: "warning",
  PARTIALLY_REFUNDED: "warning",
  REFUNDED: "neutral",
  CANCELLED: "danger",
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
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

export function isOrderEditable(status: OrderStatus) {
  return (
    status !== "CANCELLED" &&
    status !== "DELIVERED" &&
    status !== "REFUND_INITIATED" &&
    status !== "PARTIALLY_REFUNDED" &&
    status !== "REFUNDED"
  );
}
