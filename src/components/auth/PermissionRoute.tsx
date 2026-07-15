import { Navigate, Outlet } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Permission } from "@/lib/roles";

type PermissionRouteProps = {
  permission?: Permission | string;
  permissions?: Array<Permission | string>;
  requireAll?: boolean;
};

export function PermissionRoute({
  permission,
  permissions = [],
  requireAll = false,
}: PermissionRouteProps) {
  const { hasPermission, hasAnyPermission, defaultHomePath } = usePermission();

  const required = permission ? [permission, ...permissions] : permissions;

  const allowed = requireAll
    ? required.every((p) => hasPermission(p))
    : required.length === 0 || hasAnyPermission(required);

  if (!allowed) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Access denied"
          description="You do not have permission to view this page."
        />
        <Button
          variant="outline"
          render={<Link to={defaultHomePath}>Go to home</Link>}
        />
      </div>
    );
  }

  return <Outlet />;
}

export function PermissionRedirect({
  permission,
  to,
}: {
  permission: string;
  to?: string;
}) {
  const { hasPermission, defaultHomePath } = usePermission();
  if (!hasPermission(permission)) {
    return <Navigate to={to ?? defaultHomePath} replace />;
  }
  return <Outlet />;
}
