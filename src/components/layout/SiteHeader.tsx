import { useLocation, Link } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  products: "Products",
  orders: "Orders",
  payments: "Payments",
  coupons: "Coupons",
  customers: "Customers",
  "audit-logs": "Audit Logs",
  new: "Add product",
};

export function SiteHeader() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/">Home</Link>} />
            </BreadcrumbItem>
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;
              const path = `/${segments.slice(0, index + 1).join("/")}`;
              const label = routeLabels[segment] ?? segment;

              return (
                <span key={path} className="contents">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link to={path}>{label}</Link>} />
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="w-64 pl-8" />
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
          </Button>
        </div>
      </div>
    </header>
  );
}
