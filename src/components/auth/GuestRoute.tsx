import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { defaultHomePath } = usePermission();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={defaultHomePath} replace />;
  }

  return <Outlet />;
}
