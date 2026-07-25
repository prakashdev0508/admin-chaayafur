import type { LucideIcon } from "lucide-react";
import {
  FolderTree,
  CreditCard,
  LifeBuoy,
  Package,
  Receipt,
  ShoppingCart,
  Ticket,
  Users,
} from "lucide-react";
import type { AdminSearchHit, AdminSearchHitType } from "@/types/search";

export const ADMIN_SEARCH_TYPE_LABELS: Record<AdminSearchHitType, string> = {
  product: "Product",
  category: "Category",
  subcategory: "Subcategory",
  order: "Order",
  invoice: "Invoice",
  customer: "Customer",
  coupon: "Coupon",
  support_ticket: "Support",
  payment: "Payment",
};

export const ADMIN_SEARCH_TYPE_ICONS: Record<AdminSearchHitType, LucideIcon> = {
  product: Package,
  category: FolderTree,
  subcategory: FolderTree,
  order: ShoppingCart,
  invoice: Receipt,
  customer: Users,
  coupon: Ticket,
  support_ticket: LifeBuoy,
  payment: CreditCard,
};

/** Map a search hit to an in-app SPA path (no `/admin` prefix). */
export function getAdminSearchPath(hit: AdminSearchHit): string {
  switch (hit.type) {
    case "product":
      return `/products/${hit.id}`;
    case "category":
    case "subcategory":
      return "/categories";
    case "order":
      return `/orders/${hit.id}`;
    case "invoice":
      return `/orders/${hit.orderId ?? hit.id}`;
    case "customer":
      return `/customers/${hit.id}`;
    case "coupon":
      return `/coupons/${hit.id}`;
    case "support_ticket":
      return `/support-tickets/${hit.id}`;
    case "payment":
      return `/payments/${hit.id}`;
    default:
      return "/";
  }
}

export function groupAdminSearchHits(items: AdminSearchHit[]) {
  const groups: Partial<Record<AdminSearchHitType, AdminSearchHit[]>> = {};
  for (const item of items) {
    const list = groups[item.type] ?? [];
    list.push(item);
    groups[item.type] = list;
  }
  return groups;
}
