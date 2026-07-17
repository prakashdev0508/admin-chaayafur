import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, ChevronRight } from "lucide-react";
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
import {
  isReportKind,
  reportKinds,
  reportPath,
  reportTabLabels,
} from "@/lib/report-filters";
import { cn } from "@/lib/utils";

export function ReportsSidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: sidebarState } = useSidebar();
  const { hasPermission } = usePermission();
  const isCollapsed = sidebarState === "collapsed";

  const onReportsRoute = location.pathname.startsWith("/reports");
  const [subOpen, setSubOpen] = useState(onReportsRoute);

  useEffect(() => {
    if (onReportsRoute) {
      setSubOpen(true);
    }
  }, [onReportsRoute]);

  if (!hasPermission(PERMISSIONS.VIEW_REPORTS)) {
    return null;
  }

  const subItems = reportKinds.map((kind) => ({
    kind,
    label: reportTabLabels[kind],
    path: reportPath(kind),
  }));

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-full"
            render={
              <SidebarMenuButton
                tooltip="Reports"
                isActive={onReportsRoute}
              >
                <BarChart3 />
                <span>Reports</span>
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent side="right" align="start" sideOffset={4}>
            {subItems.map((item) => (
              <DropdownMenuItem
                key={item.kind}
                onClick={() => navigate(item.path)}
              >
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
        isActive={onReportsRoute}
        tooltip="Reports"
        onClick={() => setSubOpen((open) => !open)}
      >
        <BarChart3 />
        <span>Reports</span>
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
            const active =
              location.pathname === item.path ||
              (location.pathname === "/reports" && item.kind === "products");
            return (
              <SidebarMenuSubItem key={item.kind}>
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

/** Breadcrumb / header label for current report route segment */
export function reportSegmentLabel(segment: string) {
  return isReportKind(segment) ? reportTabLabels[segment] : segment;
}
