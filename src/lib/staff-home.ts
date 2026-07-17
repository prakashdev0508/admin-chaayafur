import { PERMISSIONS, type Permission } from "@/lib/roles";
import { SUPER_ADMIN_SLUG } from "@/types/auth";

export type StaffHomeCandidate = {
  path: string;
  /** Required permission; omit for any authenticated staff */
  permission?: Permission;
  superAdminOnly?: boolean;
};

/**
 * Preferred landing routes in sidebar order.
 * First match the user can access becomes the post-login / fallback home.
 */
export const STAFF_HOME_CANDIDATES: StaffHomeCandidate[] = [
  { path: "/", permission: PERMISSIONS.VIEW_DASHBOARD },
  { path: "/reports/products", permission: PERMISSIONS.VIEW_REPORTS },
  { path: "/products", permission: PERMISSIONS.VIEW_PRODUCTS },
  { path: "/categories", permission: PERMISSIONS.VIEW_CATEGORIES },
  { path: "/website/home", permission: PERMISSIONS.VIEW_BANNERS },
  { path: "/orders", permission: PERMISSIONS.VIEW_ORDERS },
  { path: "/support-tickets", permission: PERMISSIONS.VIEW_ORDER_SUPPORT },
  { path: "/payments", permission: PERMISSIONS.VIEW_PAYMENTS },
  { path: "/coupons", permission: PERMISSIONS.VIEW_COUPONS },
  { path: "/customers", permission: PERMISSIONS.VIEW_CUSTOMERS },
  { path: "/reviews", permission: PERMISSIONS.VIEW_REVIEWS },
  { path: "/audit-logs", permission: PERMISSIONS.VIEW_ORDERS },
  { path: "/staff", permission: PERMISSIONS.VIEW_STAFF },
  { path: "/roles", superAdminOnly: true },
  { path: "/settings", permission: PERMISSIONS.VIEW_SETTINGS },
  { path: "/account" },
];

const ROUTE_PERMISSIONS: Record<string, Permission | null> = {
  "/": PERMISSIONS.VIEW_DASHBOARD,
  "/reports": PERMISSIONS.VIEW_REPORTS,
  "/products": PERMISSIONS.VIEW_PRODUCTS,
  "/categories": PERMISSIONS.VIEW_CATEGORIES,
  "/website": PERMISSIONS.VIEW_BANNERS,
  "/website/home": PERMISSIONS.VIEW_BANNERS,
  "/orders": PERMISSIONS.VIEW_ORDERS,
  "/support-tickets": PERMISSIONS.VIEW_ORDER_SUPPORT,
  "/payments": PERMISSIONS.VIEW_PAYMENTS,
  "/coupons": PERMISSIONS.VIEW_COUPONS,
  "/customers": PERMISSIONS.VIEW_CUSTOMERS,
  "/reviews": PERMISSIONS.VIEW_REVIEWS,
  "/audit-logs": PERMISSIONS.VIEW_ORDERS,
  "/staff": PERMISSIONS.VIEW_STAFF,
  "/roles": null,
  "/settings": PERMISSIONS.VIEW_SETTINGS,
  "/account": null,
};

function hasPerm(
  permissions: string[] | null | undefined,
  permission: string,
) {
  if (!permissions) return false;
  return (
    permissions.includes(PERMISSIONS.ALL) || permissions.includes(permission)
  );
}

export function getDefaultStaffHomePath(
  permissions: string[] | null | undefined,
  roleSlug?: string | null,
): string {
  const isSuperAdmin = roleSlug === SUPER_ADMIN_SLUG;

  for (const candidate of STAFF_HOME_CANDIDATES) {
    if (candidate.superAdminOnly) {
      if (isSuperAdmin || hasPerm(permissions, PERMISSIONS.ALL)) {
        return candidate.path;
      }
      continue;
    }
    if (!candidate.permission) return candidate.path;
    if (hasPerm(permissions, candidate.permission)) return candidate.path;
  }

  return "/account";
}

function canAccessPath(
  path: string,
  permissions: string[] | null | undefined,
  roleSlug?: string | null,
) {
  const normalized = path.split("?")[0] || "/";
  const base = normalized.split("/").slice(0, 2).join("/") || "/";

  if (normalized === "/roles" || base === "/roles") {
    return (
      roleSlug === SUPER_ADMIN_SLUG || hasPerm(permissions, PERMISSIONS.ALL)
    );
  }

  const required =
    ROUTE_PERMISSIONS[normalized] !== undefined
      ? ROUTE_PERMISSIONS[normalized]
      : ROUTE_PERMISSIONS[base];

  if (required === null || required === undefined) {
    return true;
  }

  return hasPerm(permissions, required);
}

/** If `from` is missing, `/`, or inaccessible, use the first allowed home. */
export function resolvePostLoginPath(
  from: string | null | undefined,
  permissions: string[] | null | undefined,
  roleSlug?: string | null,
): string {
  const fallback = getDefaultStaffHomePath(permissions, roleSlug);
  if (!from || from === "/login") return fallback;
  if (!canAccessPath(from, permissions, roleSlug)) return fallback;
  return from;
}
