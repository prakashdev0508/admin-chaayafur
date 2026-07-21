export type CartFilters = {
  customerPhone: string;
  customerId: string;
  hasItems: "all" | "true" | "false";
};

export const defaultCartFilters: CartFilters = {
  customerPhone: "",
  customerId: "",
  hasItems: "all",
};

export function countActiveCartFilters(filters: CartFilters) {
  let count = 0;
  if (filters.customerPhone.trim()) count += 1;
  if (filters.customerId.trim()) count += 1;
  if (filters.hasItems !== "all") count += 1;
  return count;
}
