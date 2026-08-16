import { Link, useLocation } from "react-router-dom";
import { Palette } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";

export function CustomizationSidebarNav() {
  const location = useLocation();
  const { hasPermission } = usePermission();
  const canViewRequests = hasPermission(
    PERMISSIONS.VIEW_CUSTOMIZATION_REQUESTS,
  );

  if (!canViewRequests) {
    return null;
  }

  const isActive = location.pathname.startsWith("/customization-requests");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip="Customization"
        render={
          <Link to="/customization-requests">
            <Palette />
            <span>Customization</span>
          </Link>
        }
      />
    </SidebarMenuItem>
  );
}
