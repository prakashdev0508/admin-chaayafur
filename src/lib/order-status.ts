import type { OrderStatus } from "@/types/order";
import type { StatusVariant } from "@/lib/status-variants";

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const orderStatusVariants: Record<OrderStatus, StatusVariant> = {
  PENDING: "warning",
  CONFIRMED: "brand",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function getAllowedStatusTransitions(
  current: OrderStatus,
): OrderStatus[] {
  return allowedTransitions[current] ?? [];
}

export function isOrderEditable(status: OrderStatus) {
  return status !== "CANCELLED" && status !== "DELIVERED";
}
