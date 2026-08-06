import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  CreditCard,
  Landmark,
  RotateCcw,
  Wallet,
} from "lucide-react";
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

export function FinanceSidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: sidebarState } = useSidebar();
  const { hasAnyPermission } = usePermission();
  const isCollapsed = sidebarState === "collapsed";

  const canViewPayments = hasAnyPermission([PERMISSIONS.VIEW_PAYMENTS]);
  const canViewRefunds = hasAnyPermission([
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.VIEW_ORDERS,
  ]);
  const canViewWithdrawals = hasAnyPermission([PERMISSIONS.VIEW_WALLETS]);

  const subItems = useMemo(() => {
    const items: Array<{
      label: string;
      path: string;
      icon: typeof CreditCard;
    }> = [];
    if (canViewPayments) {
      items.push({
        label: "Payments",
        path: "/payments",
        icon: CreditCard,
      });
    }
    if (canViewRefunds) {
      items.push({
        label: "Refunds",
        path: "/refunds",
        icon: RotateCcw,
      });
    }
    if (canViewWithdrawals) {
      items.push({
        label: "Withdrawals",
        path: "/wallet-withdrawals",
        icon: Wallet,
      });
    }
    return items;
  }, [canViewPayments, canViewRefunds, canViewWithdrawals]);

  const onFinanceRoute =
    location.pathname.startsWith("/payments") ||
    location.pathname.startsWith("/refunds") ||
    location.pathname.startsWith("/wallet-withdrawals");
  const [subOpen, setSubOpen] = useState(onFinanceRoute);

  useEffect(() => {
    if (onFinanceRoute) {
      setSubOpen(true);
    }
  }, [onFinanceRoute]);

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
              <SidebarMenuButton
                tooltip="Finance"
                isActive={onFinanceRoute}
              >
                <Landmark />
                <span>Finance</span>
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
        isActive={onFinanceRoute}
        tooltip="Finance"
        onClick={() => setSubOpen((open) => !open)}
      >
        <Landmark />
        <span>Finance</span>
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
