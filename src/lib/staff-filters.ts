import type { StaffRole } from "@/types/auth";

export type StaffFilters = {
  role: string;
  isActive: string;
  email: string;
};

export const defaultStaffFilters: StaffFilters = {
  role: "all",
  isActive: "all",
  email: "",
};

export function countActiveStaffFilters(filters: StaffFilters) {
  let count = 0;
  if (filters.role !== "all") count += 1;
  if (filters.isActive !== "all") count += 1;
  if (filters.email.trim()) count += 1;
  return count;
}

export function staffFiltersToParams(filters: StaffFilters, page: number, limit: number) {
  return {
    page: page + 1,
    limit,
    ...(filters.role !== "all" ? { role: filters.role as StaffRole } : {}),
    ...(filters.isActive !== "all"
      ? { isActive: filters.isActive === "true" }
      : {}),
    ...(filters.email.trim() ? { email: filters.email.trim() } : {}),
  };
}
