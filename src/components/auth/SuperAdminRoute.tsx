import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function SuperAdminRoute() {
  const { user } = useAuth();

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Access denied"
          description="This section is restricted to Super Admins."
        />
        <Button variant="outline" render={<Link to="/">Back to dashboard</Link>} />
      </div>
    );
  }

  return <Outlet />;
}

export function SuperAdminRedirect({ to = "/" }: { to?: string }) {
  const { user } = useAuth();
  if (user?.role !== "SUPER_ADMIN") {
    return <Navigate to={to} replace />;
  }
  return <Outlet />;
}
