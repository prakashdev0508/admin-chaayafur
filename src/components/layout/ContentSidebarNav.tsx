import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Clapperboard, Film } from "lucide-react";
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

export function ContentSidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: sidebarState } = useSidebar();
  const { hasPermission } = usePermission();
  const isCollapsed = sidebarState === "collapsed";

  const canViewInstagram = hasPermission(PERMISSIONS.VIEW_INSTAGRAM);

  const subItems = useMemo(() => {
    const items: Array<{
      label: string;
      path: string;
      icon: typeof Film;
    }> = [];
    if (canViewInstagram) {
      items.push({
        label: "Instagram",
        path: "/content/instagram",
        icon: Film,
      });
    }
    return items;
  }, [canViewInstagram]);

  const onContentRoute = location.pathname.startsWith("/content");
  const [subOpen, setSubOpen] = useState(onContentRoute);

  useEffect(() => {
    if (onContentRoute) {
      setSubOpen(true);
    }
  }, [onContentRoute]);

  if (subItems.length === 0) {
    return null;
  }

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-full"
            render={
              <SidebarMenuButton tooltip="Content" isActive={onContentRoute}>
                <Clapperboard />
                <span>Content</span>
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
        isActive={onContentRoute}
        tooltip="Content"
        onClick={() => setSubOpen((open) => !open)}
      >
        <Clapperboard />
        <span>Content</span>
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
