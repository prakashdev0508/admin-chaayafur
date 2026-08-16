import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  ShoppingBag,
  LifeBuoy,
  Ticket,
  Users,
  MessageSquareQuote,
  ScrollText,
  Settings,
  ChevronsUpDown,
  UserPlus,
  Globe,
  Shield,
  Mail,
  Briefcase,
  FileClock,
  FileText,
  Gift,
  Search,
  Megaphone,
  Server,
  KeyRound,
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
  SidebarTrigger,
  useSidebar,
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
import { ADMIN_SEARCH_PERMISSIONS } from "@/components/layout/AdminSearchOverlay";
import { PERMISSIONS } from "@/lib/roles";
import { formatRoleLabel, isSuperAdminSlug } from "@/lib/staff-utils";
import { CollapsibleSidebarNav } from "@/components/layout/CollapsibleSidebarNav";
import { CustomizationSidebarNav } from "@/components/layout/CustomizationSidebarNav";
import { FinanceSidebarNav } from "@/components/layout/FinanceSidebarNav";
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
  permissions?: string[];
  superAdminOnly?: boolean;
};

type MoreDropdown = {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
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
    title: "Quotations",
    url: "/quotations",
    icon: FileText,
    permission: PERMISSIONS.VIEW_QUOTATIONS,
  },
  {
    title: "Support",
    url: "/support-tickets",
    icon: LifeBuoy,
    permission: PERMISSIONS.VIEW_ORDER_SUPPORT,
  },
];

const moreDropdowns: MoreDropdown[] = [
  {
    label: "Promotions",
    icon: Megaphone,
    items: [
      {
        title: "Coupons",
        url: "/coupons",
        icon: Ticket,
        permission: PERMISSIONS.VIEW_COUPONS,
      },
      {
        title: "Referrals",
        url: "/referrals",
        icon: Gift,
        permission: PERMISSIONS.VIEW_REFERRALS,
      },
    ],
  },
  {
    label: "Customers",
    icon: Users,
    items: [
      {
        title: "Customers",
        url: "/customers",
        icon: Users,
        permission: PERMISSIONS.VIEW_CUSTOMERS,
      },
      {
        title: "Carts",
        url: "/carts",
        icon: ShoppingBag,
        permission: PERMISSIONS.VIEW_CUSTOMERS,
      },
      {
        title: "Reviews",
        url: "/reviews",
        icon: MessageSquareQuote,
        permission: PERMISSIONS.VIEW_REVIEWS,
      },
      {
        title: "Contact",
        url: "/contact",
        icon: Mail,
        permission: PERMISSIONS.VIEW_SETTINGS,
      },
      {
        title: "Careers",
        url: "/careers",
        icon: Briefcase,
        permission: PERMISSIONS.VIEW_CAREERS,
      },
    ],
  },
  {
    label: "System",
    icon: Server,
    items: [
      {
        title: "Audit logs",
        url: "/audit-logs",
        icon: ScrollText,
        permission: PERMISSIONS.VIEW_ORDERS,
      },
      {
        title: "Upload jobs",
        url: "/upload-jobs",
        icon: FileClock,
        permission: PERMISSIONS.VIEW_PRODUCTS,
      },
    ],
  },
  {
    label: "Access",
    icon: KeyRound,
    items: [
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
    ],
  },
];

type AppSidebarProps = {
  onOpenSearch?: () => void;
};

export function AppSidebar({ onOpenSearch }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, myPermissions } = useAuth();
  const { hasPermission, hasAnyPermission, defaultHomePath } = usePermission();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const canSearch = hasAnyPermission(ADMIN_SEARCH_PERMISSIONS);
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

  const visibleMoreDropdowns = moreDropdowns
    .map((section) => ({
      ...section,
      items: filterNav(section.items).map((item) => ({
        label: item.title,
        path: item.url,
        icon: item.icon,
      })),
    }))
    .filter((section) => section.items.length > 0);

  const brandContent = (
    <>
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <span className="text-sm font-semibold">CF</span>
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">Chaya Furnitures</span>
        <span className="truncate text-xs text-muted-foreground">
          Admin panel
        </span>
      </div>
    </>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-1">
          <SidebarMenu className="min-w-0 flex-1">
            <SidebarMenuItem>
              {isCollapsed ? (
                <SidebarMenuButton
                  size="lg"
                  tooltip="Expand sidebar"
                  onClick={toggleSidebar}
                >
                  {brandContent}
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  size="lg"
                  render={
                    <Link to={defaultHomePath}>{brandContent}</Link>
                  }
                />
              )}
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarTrigger className="shrink-0 group-data-[collapsible=icon]:hidden" />
        </div>
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
              <FinanceSidebarNav />
              <CustomizationSidebarNav />
              <ReportsSidebarNav />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleMoreDropdowns.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>More</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMoreDropdowns.map((section) => (
                  <CollapsibleSidebarNav
                    key={section.label}
                    label={section.label}
                    icon={section.icon}
                    items={section.items}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <hr className="mx-2" />

      <SidebarFooter>
        <SidebarMenu>
          {canSearch && onOpenSearch && (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Search"
                render={
                  <button type="button" onClick={onOpenSearch}>
                    <Search />
                    <span>Search</span>
                  </button>
                }
              />
            </SidebarMenuItem>
          )}
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
<hr className="my-1" />
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
