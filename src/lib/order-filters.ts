export type OrderFilters = {
  status: string;
  customerId: string;
};

export const defaultOrderFilters: OrderFilters = {
  status: "all",
  customerId: "",
};

export function countActiveOrderFilters(filters: OrderFilters) {
  let count = 0;
  if (filters.status !== "all") count += 1;
  if (filters.customerId.trim()) count += 1;
  return count;
}
