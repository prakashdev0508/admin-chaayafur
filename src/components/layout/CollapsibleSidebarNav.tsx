import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

export type CollapsibleNavSubItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

type CollapsibleSidebarNavProps = {
  label: string;
  icon: LucideIcon;
  items: CollapsibleNavSubItem[];
};

export function CollapsibleSidebarNav({
  label,
  icon: Icon,
  items,
}: CollapsibleSidebarNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  const onSectionRoute = items.some((item) =>
    location.pathname.startsWith(item.path),
  );
  const [subOpen, setSubOpen] = useState(onSectionRoute);

  useEffect(() => {
    if (onSectionRoute) {
      setSubOpen(true);
    }
  }, [onSectionRoute]);

  if (items.length === 0) {
    return null;
  }

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-full"
            render={
              <SidebarMenuButton tooltip={label} isActive={onSectionRoute}>
                <Icon />
                <span>{label}</span>
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent side="right" align="start" sideOffset={4}>
            {items.map((item) => (
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
        isActive={onSectionRoute}
        tooltip={label}
        onClick={() => setSubOpen((open) => !open)}
      >
        <Icon />
        <span>{label}</span>
        <ChevronRight
          className={cn(
            "ml-auto size-4 transition-transform",
            subOpen && "rotate-90",
          )}
        />
      </SidebarMenuButton>
      {subOpen && (
        <SidebarMenuSub>
          {items.map((item) => {
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
