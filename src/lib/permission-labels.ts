import { PERMISSIONS, type Permission } from "@/lib/roles";

/** Human-readable labels for permission keys (from auth docs). */
export const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.ALL]: "Full access",
  [PERMISSIONS.CREATE_STAFF]: "Create staff",
  [PERMISSIONS.UPDATE_STAFF]: "Update staff",
  [PERMISSIONS.DELETE_STAFF]: "Delete staff",
  [PERMISSIONS.VIEW_STAFF]: "View staff",
  [PERMISSIONS.CREATE_PRODUCTS]: "Create products",
  [PERMISSIONS.UPDATE_PRODUCTS]: "Update products",
  [PERMISSIONS.DELETE_PRODUCTS]: "Delete products",
  [PERMISSIONS.VIEW_PRODUCTS]: "View products",
  [PERMISSIONS.CREATE_CATEGORIES]: "Create categories",
  [PERMISSIONS.UPDATE_CATEGORIES]: "Update categories",
  [PERMISSIONS.DELETE_CATEGORIES]: "Delete categories",
  [PERMISSIONS.VIEW_CATEGORIES]: "View categories",
  [PERMISSIONS.CREATE_ORDERS]: "Create orders",
  [PERMISSIONS.UPDATE_ORDERS]: "Update orders",
  [PERMISSIONS.VIEW_ORDERS]: "View orders",
  [PERMISSIONS.CREATE_PAYMENTS]: "Create payments",
  [PERMISSIONS.UPDATE_PAYMENTS]: "Update payments / refunds",
  [PERMISSIONS.VIEW_PAYMENTS]: "View payments",
  [PERMISSIONS.CREATE_REPORTS]: "Create reports",
  [PERMISSIONS.UPDATE_REPORTS]: "Update reports",
  [PERMISSIONS.VIEW_REPORTS]: "View reports",
  [PERMISSIONS.CREATE_SETTINGS]: "Create settings",
  [PERMISSIONS.UPDATE_SETTINGS]: "Update settings",
  [PERMISSIONS.VIEW_SETTINGS]: "View settings",
  [PERMISSIONS.VIEW_CUSTOMERS]: "View customers",
  [PERMISSIONS.UPDATE_CUSTOMERS]: "Update customers",
  [PERMISSIONS.CREATE_COUPONS]: "Create coupons",
  [PERMISSIONS.UPDATE_COUPONS]: "Update coupons",
  [PERMISSIONS.VIEW_COUPONS]: "View coupons",
  [PERMISSIONS.VIEW_ORDER_SUPPORT]: "View support tickets",
  [PERMISSIONS.UPDATE_ORDER_SUPPORT]: "Update support tickets",
  [PERMISSIONS.CREATE_BANNERS]: "Create banners",
  [PERMISSIONS.UPDATE_BANNERS]: "Update banners",
  [PERMISSIONS.VIEW_BANNERS]: "View banners",
  [PERMISSIONS.VIEW_REVIEWS]: "View reviews",
  [PERMISSIONS.MODERATE_REVIEWS]: "Moderate reviews",
  [PERMISSIONS.VIEW_DASHBOARD]: "View dashboard",
};

export function formatPermissionLabel(key: string) {
  return PERMISSION_LABELS[key] ?? key.replaceAll("-", " ");
}

export type PermissionGroup = {
  title: string;
  permissions: string[];
};

const GROUP_DEFS: { title: string; keys: Permission[] }[] = [
  {
    title: "Dashboard",
    keys: [PERMISSIONS.VIEW_DASHBOARD],
  },
  {
    title: "Staff",
    keys: [
      PERMISSIONS.VIEW_STAFF,
      PERMISSIONS.CREATE_STAFF,
      PERMISSIONS.UPDATE_STAFF,
      PERMISSIONS.DELETE_STAFF,
    ],
  },
  {
    title: "Products",
    keys: [
      PERMISSIONS.VIEW_PRODUCTS,
      PERMISSIONS.CREATE_PRODUCTS,
      PERMISSIONS.UPDATE_PRODUCTS,
      PERMISSIONS.DELETE_PRODUCTS,
    ],
  },
  {
    title: "Categories",
    keys: [
      PERMISSIONS.VIEW_CATEGORIES,
      PERMISSIONS.CREATE_CATEGORIES,
      PERMISSIONS.UPDATE_CATEGORIES,
      PERMISSIONS.DELETE_CATEGORIES,
    ],
  },
  {
    title: "Orders",
    keys: [
      PERMISSIONS.VIEW_ORDERS,
      PERMISSIONS.CREATE_ORDERS,
      PERMISSIONS.UPDATE_ORDERS,
    ],
  },
  {
    title: "Payments",
    keys: [
      PERMISSIONS.VIEW_PAYMENTS,
      PERMISSIONS.CREATE_PAYMENTS,
      PERMISSIONS.UPDATE_PAYMENTS,
    ],
  },
  {
    title: "Customers",
    keys: [PERMISSIONS.VIEW_CUSTOMERS, PERMISSIONS.UPDATE_CUSTOMERS],
  },
  {
    title: "Coupons",
    keys: [
      PERMISSIONS.VIEW_COUPONS,
      PERMISSIONS.CREATE_COUPONS,
      PERMISSIONS.UPDATE_COUPONS,
    ],
  },
  {
    title: "Support",
    keys: [PERMISSIONS.VIEW_ORDER_SUPPORT, PERMISSIONS.UPDATE_ORDER_SUPPORT],
  },
  {
    title: "Website",
    keys: [
      PERMISSIONS.VIEW_BANNERS,
      PERMISSIONS.CREATE_BANNERS,
      PERMISSIONS.UPDATE_BANNERS,
    ],
  },
  {
    title: "Reviews",
    keys: [PERMISSIONS.VIEW_REVIEWS, PERMISSIONS.MODERATE_REVIEWS],
  },
  {
    title: "Settings",
    keys: [
      PERMISSIONS.VIEW_SETTINGS,
      PERMISSIONS.CREATE_SETTINGS,
      PERMISSIONS.UPDATE_SETTINGS,
    ],
  },
  {
    title: "Reports",
    keys: [
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.CREATE_REPORTS,
      PERMISSIONS.UPDATE_REPORTS,
    ],
  },
];

export function groupPermissions(catalog: string[]): PermissionGroup[] {
  const available = new Set(catalog.filter((p) => p !== PERMISSIONS.ALL));
  const grouped: PermissionGroup[] = [];
  const used = new Set<string>();

  for (const group of GROUP_DEFS) {
    const permissions = group.keys.filter((key) => available.has(key));
    if (permissions.length === 0) continue;
    permissions.forEach((p) => used.add(p));
    grouped.push({ title: group.title, permissions });
  }

  const other = [...available].filter((p) => !used.has(p)).sort();
  if (other.length > 0) {
    grouped.push({ title: "Other", permissions: other });
  }

  return grouped;
}
