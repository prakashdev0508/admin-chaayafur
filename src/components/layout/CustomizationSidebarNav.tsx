import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Palette, Shirt, Trees } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";
import { cn } from "@/lib/utils";

const subItems = [
  { label: "Woods", path: "/woods", icon: Trees },
  { label: "Fabrics", path: "/fabrics", icon: Shirt },
] as const;

export function CustomizationSidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: sidebarState } = useSidebar();
  const { hasPermission } = usePermission();
  const isCollapsed = sidebarState === "collapsed";

  const onCustomizationRoute =
    location.pathname.startsWith("/woods") ||
    location.pathname.startsWith("/fabrics");
  const [subOpen, setSubOpen] = useState(onCustomizationRoute);

  useEffect(() => {
    if (onCustomizationRoute) {
      setSubOpen(true);
    }
  }, [onCustomizationRoute]);

  if (!hasPermission(PERMISSIONS.VIEW_PRODUCTS)) {
    return null;
  }

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-full"
            render={
              <SidebarMenuButton
                tooltip="Customization"
                isActive={onCustomizationRoute}
              >
                <Palette />
                <span>Customization</span>
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent side="right" align="start" sideOffset={4}>
            {subItems.map((item) => (
              <DropdownMenuItem
                key={item.path}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="size-4" />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={onCustomizationRoute}
        tooltip="Customization"
        onClick={() => setSubOpen((open) => !open)}
      >
        <Palette />
        <span>Customization</span>
        <ChevronRight
          className={cn(
            "ml-auto size-4 transition-transform",
            subOpen && "rotate-90",
          )}
        />
      </SidebarMenuButton>
      {subOpen && (
        <SidebarMenuSub>
          {subItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <SidebarMenuSubItem key={item.path}>
                <SidebarMenuSubButton
                  isActive={active}
                  render={<Link to={item.path}>{item.label}</Link>}
                />
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
