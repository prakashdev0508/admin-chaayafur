import { useLocation, Link } from "react-router-dom";
import { Search } from "lucide-react";
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
import { reportSegmentLabel } from "@/components/layout/ReportsSidebarNav";
import { Button } from "@/components/ui/button";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  reports: "Reports",
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  payments: "Payments",
  refunds: "Refunds",
  coupons: "Coupons",
  customers: "Customers",
  carts: "Carts",
  contact: "Contact",
  "audit-logs": "Audit Logs",
  new: "Add product",
};

type SiteHeaderProps = {
  onOpenSearch?: () => void;
};

function segmentLabel(segments: string[], index: number) {
  const segment = segments[index]!;
  if (segments[0] === "reports" && index === 1) {
    return reportSegmentLabel(segment);
  }
  return routeLabels[segment] ?? segment;
}

export function SiteHeader({ onOpenSearch }: SiteHeaderProps) {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const currentLabel =
    segments.length === 0
      ? "Dashboard"
      : segmentLabel(segments, segments.length - 1);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:h-16">
      <div className="flex w-full min-w-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 hidden h-4 sm:block" />

        {/* Mobile: current page only to avoid overflow */}
        <p className="min-w-0 truncate text-sm font-medium sm:hidden">
          {currentLabel}
        </p>

        <Breadcrumb className="hidden min-w-0 sm:block">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/">Home</Link>} />
            </BreadcrumbItem>
            {segments.map((_segment, index) => {
              const isLast = index === segments.length - 1;
              const path = `/${segments.slice(0, index + 1).join("/")}`;
              const label = segmentLabel(segments, index);
              const hideMiddleOnMd =
                segments.length > 2 && index > 0 && !isLast;

              return (
                <span
                  key={path}
                  className={hideMiddleOnMd ? "contents max-md:hidden" : "contents"}
                >
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="max-w-[12rem] truncate">
                    {isLast ? (
                      <BreadcrumbPage className="truncate">{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        className="truncate"
                        render={<Link to={path}>{label}</Link>}
                      />
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {onOpenSearch ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto shrink-0"
            onClick={onOpenSearch}
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
