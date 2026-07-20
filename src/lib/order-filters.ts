export type OrderFilters = {
  status: string;
  refundStatus: string;
  customerId: string;
  orderNumber: string;
  customerPhone: string;
  createdFrom: string;
  createdTo: string;
};

export const defaultOrderFilters: OrderFilters = {
  status: "all",
  refundStatus: "all",
  customerId: "",
  orderNumber: "",
  customerPhone: "",
  createdFrom: "",
  createdTo: "",
};

export function countActiveOrderFilters(filters: OrderFilters) {
  let count = 0;
  if (filters.status !== "all") count += 1;
  if (filters.refundStatus !== "all") count += 1;
  if (filters.customerId.trim()) count += 1;
  if (filters.orderNumber.trim()) count += 1;
  if (filters.customerPhone.trim()) count += 1;
  if (filters.createdFrom.trim()) count += 1;
  if (filters.createdTo.trim()) count += 1;
  return count;
}
