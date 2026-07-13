export type PaymentFilters = {
  status: string;
  orderId: string;
  customerId: string;
};

export const defaultPaymentFilters: PaymentFilters = {
  status: "all",
  orderId: "",
  customerId: "",
};

export function countActivePaymentFilters(filters: PaymentFilters) {
  let count = 0;
  if (filters.status !== "all") count += 1;
  if (filters.orderId.trim()) count += 1;
  if (filters.customerId.trim()) count += 1;
  return count;
}
