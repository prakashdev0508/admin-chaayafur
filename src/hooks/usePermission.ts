import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS, type Permission } from "@/lib/roles";

/** Route → required permission(s). Empty means any authenticated staff. */
const routePermissions: Record<string, Permission | Permission[] | []> = {
  "/": [],
  "/products": PERMISSIONS.VIEW_PRODUCTS,
  "/products/new": PERMISSIONS.CREATE_PRODUCTS,
  "/categories": PERMISSIONS.VIEW_CATEGORIES,
  "/website": PERMISSIONS.VIEW_BANNERS,
  "/website/home": PERMISSIONS.VIEW_BANNERS,
  "/orders": PERMISSIONS.VIEW_ORDERS,
  "/support-tickets": PERMISSIONS.VIEW_ORDER_SUPPORT,
  "/payments": PERMISSIONS.VIEW_PAYMENTS,
  "/coupons": PERMISSIONS.VIEW_COUPONS,
  "/coupons/new": PERMISSIONS.CREATE_COUPONS,
  "/customers": PERMISSIONS.VIEW_CUSTOMERS,
  "/customers/new": PERMISSIONS.UPDATE_CUSTOMERS,
  "/reviews": PERMISSIONS.VIEW_REVIEWS,
  "/audit-logs": PERMISSIONS.VIEW_ORDERS,
  "/staff": PERMISSIONS.VIEW_STAFF,
  "/staff/new": PERMISSIONS.CREATE_STAFF,
  "/account": [],
  "/settings": PERMISSIONS.VIEW_SETTINGS,
};

export function usePermission() {
  const { user, myPermissions } = useAuth();

  const hasPermission = (permission: string) => {
    if (!user || !myPermissions) return false;
    const perms = myPermissions.permissions;
    if (perms.includes(PERMISSIONS.ALL)) return true;
    return perms.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]) =>
    permissions.some((p) => hasPermission(p));

  const hasAllPermissions = (permissions: string[]) =>
    permissions.every((p) => hasPermission(p));

  const canAccessRoute = (path: string) => {
    const basePath = path.split("/").slice(0, 2).join("/") || "/";
    const exact = routePermissions[path];
    const base = routePermissions[basePath];

    const required = exact ?? base;
    if (!required || (Array.isArray(required) && required.length === 0)) {
      return true;
    }
    if (typeof required === "string") return hasPermission(required);
    return hasAnyPermission(required);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    myPermissions,
  };
}
