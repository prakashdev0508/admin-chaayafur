import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { isSuperAdminSlug } from "@/lib/staff-utils";

export function SuperAdminRoute() {
  const { myPermissions, isLoading } = useAuth();
  const isSuperAdmin = isSuperAdminSlug(
    myPermissions?.roleSlug ?? myPermissions?.role,
  );

  if (isLoading) return null;

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Access denied"
          description="This section is restricted to Super Admins."
        />
        <Button
          variant="outline"
          render={<Link to="/">Back to dashboard</Link>}
        />
      </div>
    );
  }

  return <Outlet />;
}

export function SuperAdminRedirect({ to = "/" }: { to?: string }) {
  const { myPermissions } = useAuth();
  const isSuperAdmin = isSuperAdminSlug(
    myPermissions?.roleSlug ?? myPermissions?.role,
  );
  if (!isSuperAdmin) {
    return <Navigate to={to} replace />;
  }
  return <Outlet />;
}
