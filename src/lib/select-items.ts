import type { ReactNode } from "react";
import { getOrderStatusLabel, orderStatusLabels } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";

export type SelectOption = {
  label: ReactNode;
  value: string;
};

export const ADDRESS_TYPE_ITEMS: SelectOption[] = [
  { value: "SHIPPING", label: "Shipping" },
  { value: "BILLING", label: "Billing" },
];

export const COUPON_TYPE_ITEMS: SelectOption[] = [
  { value: "FLAT_CART", label: "Flat amount (₹)" },
  { value: "PERCENTAGE_CART", label: "Percentage (%)" },
];

export const COUPON_VISIBILITY_ITEMS: SelectOption[] = [
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE", label: "Private" },
];

export const ACTIVE_FILTER_ITEMS: SelectOption[] = [
  { value: "all", label: "All" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

export const ORDER_STATUS_FILTER_ITEMS: SelectOption[] = [
  { value: "all", label: "All statuses" },
  ...(
    Object.entries(orderStatusLabels) as [OrderStatus, string][]
  ).map(([value, label]) => ({ value, label })),
];

export const PAYMENT_STATUS_FILTER_ITEMS: SelectOption[] = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

export const AUDIT_ENTITY_TYPE_ITEMS: SelectOption[] = [
  { value: "all", label: "All types" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "ADDRESS", label: "Address" },
  { value: "ORDER", label: "Order" },
  { value: "ORDER_ITEM", label: "Order item" },
  { value: "PAYMENT", label: "Payment" },
];

export const PRODUCT_VISIBILITY_FILTER_ITEMS: SelectOption[] = [
  { value: "all", label: "All products" },
  { value: "active", label: "Active only" },
  { value: "inactive", label: "Inactive only" },
];

export const PRODUCT_STOCK_FILTER_ITEMS: SelectOption[] = [
  { value: "all", label: "All stock levels" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

export const PRODUCT_SORT_BY_ITEMS: SelectOption[] = [
  { value: "createdAt", label: "Date created" },
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
];

export const PRODUCT_TAG_FILTER_ITEMS: SelectOption[] = [
  { value: "all", label: "All tags" },
  { value: "isFeaturedProduct", label: "Featured" },
  { value: "isBestSeller", label: "Best seller" },
  { value: "isMostPopular", label: "Most popular" },
  { value: "isNewArrival", label: "New arrival" },
];

export const SORT_ORDER_ITEMS: SelectOption[] = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

export function toOrderStatusSelectItems(
  currentStatus: OrderStatus,
  transitions: OrderStatus[],
): SelectOption[] {
  return [
    {
      value: currentStatus,
      label: `${getOrderStatusLabel(currentStatus)} (current)`,
    },
    ...transitions.map((status) => ({
      value: status,
      label: getOrderStatusLabel(status),
    })),
  ];
}
