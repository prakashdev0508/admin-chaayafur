import type { RefundStatus } from "@/types/refund";

export type RefundFilters = {
  status: RefundStatus | "all";
  orderId: string;
  orderNumber: string;
  createdFrom: string;
  createdTo: string;
};

export const defaultRefundFilters: RefundFilters = {
  status: "all",
  orderId: "",
  orderNumber: "",
  createdFrom: "",
  createdTo: "",
};

export function countActiveRefundFilters(filters: RefundFilters) {
  let count = 0;
  if (filters.status !== "all") count += 1;
  if (filters.orderId.trim()) count += 1;
  if (filters.orderNumber.trim()) count += 1;
  if (filters.createdFrom.trim()) count += 1;
  if (filters.createdTo.trim()) count += 1;
  return count;
}
