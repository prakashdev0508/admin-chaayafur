import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  CreditCard,
  RotateCcw,
  LifeBuoy,
  Ticket,
  Users,
  MessageSquareQuote,
  ScrollText,
  Settings,
  HelpCircle,
  ChevronsUpDown,
  UserPlus,
  Globe,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";
import { formatRoleLabel, isSuperAdminSlug } from "@/lib/staff-utils";
import { ReportsSidebarNav } from "@/components/layout/ReportsSidebarNav";

function getInitials(firstName: string | null, lastName: string | null, email: string) {
  const first = firstName?.[0] ?? "";
  const last = lastName?.[0] ?? "";
  const initials = `${first}${last}`.trim();
  return initials ? initials.toUpperCase() : email.slice(0, 2).toUpperCase();
}

function getDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string,
) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  return fullName || email;
}

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: string | null;
  /** Any of these permissions grants access (OR). */
  permissions?: string[];
  superAdminOnly?: boolean;
};

const navMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
    permission: PERMISSIONS.VIEW_PRODUCTS,
  },
  {
    title: "Categories",
    url: "/categories",
    icon: FolderTree,
    permission: PERMISSIONS.VIEW_CATEGORIES,
  },
  {
    title: "Website",
    url: "/website/home",
    icon: Globe,
    permission: PERMISSIONS.VIEW_BANNERS,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
    permission: PERMISSIONS.VIEW_ORDERS,
  },
  {
    title: "Support",
    url: "/support-tickets",
    icon: LifeBuoy,
    permission: PERMISSIONS.VIEW_ORDER_SUPPORT,
  },
  {
    title: "Payments",
    url: "/payments",
    icon: CreditCard,
    permission: PERMISSIONS.VIEW_PAYMENTS,
  },
  {
    title: "Refunds",
    url: "/refunds",
    icon: RotateCcw,
    permissions: [PERMISSIONS.VIEW_PAYMENTS, PERMISSIONS.VIEW_ORDERS],
  },
];

const navMore: NavItem[] = [
  {
    title: "Coupons",
    url: "/coupons",
    icon: Ticket,
    permission: PERMISSIONS.VIEW_COUPONS,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
    permission: PERMISSIONS.VIEW_CUSTOMERS,
  },
  {
    title: "Reviews",
    url: "/reviews",
    icon: MessageSquareQuote,
    permission: PERMISSIONS.VIEW_REVIEWS,
  },
  {
    title: "Audit Logs",
    url: "/audit-logs",
    icon: ScrollText,
    permission: PERMISSIONS.VIEW_ORDERS,
  },
  {
    title: "Staff",
    url: "/staff",
    icon: UserPlus,
    permission: PERMISSIONS.VIEW_STAFF,
  },
  {
    title: "Roles",
    url: "/roles",
    icon: Shield,
    superAdminOnly: true,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, myPermissions } = useAuth();
  const { hasPermission, hasAnyPermission, defaultHomePath } = usePermission();
  const isSuperAdmin = isSuperAdminSlug(
    myPermissions?.roleSlug ?? myPermissions?.role,
  );

  const isActive = (url: string) =>
    url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);

  const filterNav = (items: NavItem[]) =>
    items.filter((item) => {
      if (item.superAdminOnly) return isSuperAdmin;
      if (item.permissions?.length) {
        return hasAnyPermission(item.permissions);
      }
      return !item.permission || hasPermission(item.permission);
    });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link to={defaultHomePath}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <span className="text-sm font-semibold">CF</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Chaya Furnitures</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Admin panel
                    </span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterNav(navMain).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    render={
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
              <ReportsSidebarNav />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filterNav(navMore).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>More</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterNav(navMore).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      render={
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {hasPermission(PERMISSIONS.VIEW_SETTINGS) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isActive("/settings")}
                tooltip="Settings"
                render={
                  <Link to="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                }
              />
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Get Help"
              render={
                <button type="button">
                  <HelpCircle />
                  <span>Get Help</span>
                </button>
              }
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-hidden hover:bg-sidebar-accent"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                    {getInitials(
                      user?.firstName ?? null,
                      user?.lastName ?? null,
                      user?.email ?? "CF",
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user
                      ? getDisplayName(
                          user.firstName,
                          user.lastName,
                          user.email,
                        )
                      : "Staff user"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {formatRoleLabel(
                      myPermissions?.roleSlug ??
                        myPermissions?.role ??
                        user?.role,
                    )}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" sideOffset={4}>
                <DropdownMenuItem onClick={() => navigate("/account")}>
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
