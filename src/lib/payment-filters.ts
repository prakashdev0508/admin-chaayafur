export type PaymentFilters = {
  status: string;
  orderId: string;
  customerId: string;
  orderNumber: string;
  customerPhone: string;
  createdFrom: string;
  createdTo: string;
};

export const defaultPaymentFilters: PaymentFilters = {
  status: "all",
  orderId: "",
  customerId: "",
  orderNumber: "",
  customerPhone: "",
  createdFrom: "",
  createdTo: "",
};

export function countActivePaymentFilters(filters: PaymentFilters) {
  let count = 0;
  if (filters.status !== "all") count += 1;
  if (filters.orderId.trim()) count += 1;
  if (filters.customerId.trim()) count += 1;
  if (filters.orderNumber.trim()) count += 1;
  if (filters.customerPhone.trim()) count += 1;
  if (filters.createdFrom.trim()) count += 1;
  if (filters.createdTo.trim()) count += 1;
  return count;
}
