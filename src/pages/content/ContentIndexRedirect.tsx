import { Navigate } from "react-router-dom";
import { StaffHomeRedirect } from "@/components/auth/StaffHomeRedirect";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";

/** Sends /content to the first content section this staff user can open. */
export function ContentIndexRedirect() {
  const { hasPermission } = usePermission();

  if (hasPermission(PERMISSIONS.VIEW_INSTAGRAM)) {
    return <Navigate to="/content/instagram" replace />;
  }
  if (hasPermission(PERMISSIONS.VIEW_MEDIA)) {
    return <Navigate to="/content/media" replace />;
  }
  if (hasPermission(PERMISSIONS.VIEW_ADMIN_REVIEWS)) {
    return <Navigate to="/content/admin-reviews" replace />;
  }
  return <StaffHomeRedirect />;
}
