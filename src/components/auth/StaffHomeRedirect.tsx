import { Navigate } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";

/** Redirects `/` (or catch-all) to the first route the staff user can access. */
export function StaffHomeRedirect() {
  const { defaultHomePath } = usePermission();
  return <Navigate to={defaultHomePath} replace />;
}
