import { useAuth } from "@/contexts/AuthContext";

const routePermissions: Record<string, string | string[]> = {
  "/": [],
  "/products": [],
  "/products/new": "create-products",
  "/categories": "view-categories",
  "/website": "view-banners",
  "/website/home": "view-banners",
  "/orders": "view-orders",
  "/support-tickets": "view-order-support",
  "/payments": "view-payments",
  "/coupons": "view-coupons",
  "/coupons/new": "create-coupons",
  "/customers": "view-customers",
  "/customers/new": "update-customers",
  "/reviews": "view-reviews",
  "/audit-logs": "view-orders",
  "/staff": [],
  "/staff/new": "create-staff",
  "/settings": "view-settings",
};

export function usePermission() {
  const { user, rolesPermissions } = useAuth();

  const hasPermission = (permission: string) => {
    if (!user || !rolesPermissions) return false;
    const roleEntry = rolesPermissions[user.role];
    if (!roleEntry) return false;
    if (roleEntry.permissions.includes("all")) return true;
    return roleEntry.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]) =>
    permissions.some((p) => hasPermission(p));

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

  return { hasPermission, hasAnyPermission, canAccessRoute };
}
