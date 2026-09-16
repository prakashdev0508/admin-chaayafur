import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { customerColumns } from "@/components/data-table/customer-columns";
import { CustomerListMobileCards } from "@/components/customers/CustomerListMobileCards";
import { TodaysFollowUpsDialog } from "@/components/customers/TodaysFollowUpsDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { queryKeys } from "@/lib/query-keys";
import { listCustomers } from "@/services/customers.service";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";

export function CustomerListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [phone, setPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [followUpsOpen, setFollowUpsOpen] = useState(false);

  const params = {
    page: page + 1,
    limit: pageSize,
    ...(searchPhone.trim() ? { phone: searchPhone.trim() } : {}),
  };

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => listCustomers(params),
    enabled: hasPermission(PERMISSIONS.VIEW_CUSTOMERS),
  });

  const items = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const hasSearch = Boolean(searchPhone.trim());

  const clearSearch = () => {
    setPhone("");
    setSearchPhone("");
    setPage(0);
  };

  if (!hasPermission(PERMISSIONS.VIEW_CUSTOMERS)) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Customers" description="Manage customer accounts." />
        <EmptyState
          icon={Users}
          title="Access restricted"
          description="You do not have permission to view customers."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Customers"
        description={
          isLoading
            ? "View and manage customer accounts."
            : `${total.toLocaleString("en-IN")} customer${total === 1 ? "" : "s"}`
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setFollowUpsOpen(true)}>
              <CalendarClock className="size-4" />
              <span className="max-sm:hidden">Today&apos;s follow-ups</span>
              <span className="sm:hidden">Follow-ups</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            {hasPermission(PERMISSIONS.UPDATE_CUSTOMERS) && (
              <Button
                render={
                  <Link to="/customers/new">
                    <Plus className="size-4" />
                    Add customer
                  </Link>
                }
              />
            )}
          </div>
        }
      />

      <TodaysFollowUpsDialog
        open={followUpsOpen}
        onOpenChange={setFollowUpsOpen}
      />

      <Card className="overflow-hidden shadow-xs">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Directory</CardTitle>
              <CardDescription className="mt-1">
                Search by phone number to find an account.
              </CardDescription>
            </div>
            <form
              className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                setSearchPhone(phone);
                setPage(0);
              }}
            >
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone-search"
                  placeholder="Search phone…"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                  inputMode="tel"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isFetching}>
                  Search
                </Button>
                {hasSearch && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </form>
          </div>
          {hasSearch && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing results for{" "}
              <span className="font-medium text-foreground">
                {searchPhone.trim()}
              </span>
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-5">
          {error && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Failed to load customers"}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Users}
              title={hasSearch ? "No customers found" : "No customers yet"}
              description={
                hasSearch
                  ? "Try a different phone number, or clear the search."
                  : "Add a customer to start managing accounts and follow-ups."
              }
              className="py-10"
              action={
                hasSearch ? (
                  <Button variant="outline" onClick={clearSearch}>
                    Clear search
                  </Button>
                ) : hasPermission(PERMISSIONS.UPDATE_CUSTOMERS) ? (
                  <Button
                    render={
                      <Link to="/customers/new">
                        <Plus className="size-4" />
                        Add customer
                      </Link>
                    }
                  />
                ) : undefined
              }
            />
          ) : (
            <div className="relative space-y-4">
              {isFetching && (
                <div className="pointer-events-none absolute inset-0 z-10 rounded-md bg-background/50" />
              )}
              <CustomerListMobileCards customers={items} />
              <div className="hidden md:block">
                <DataTable
                  columns={customerColumns}
                  data={items}
                  manualPagination
                  pageIndex={page}
                  pageSize={pageSize}
                  pageCount={data?.meta.totalPages ?? 1}
                  totalRows={total}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(0);
                  }}
                  onRowClick={(row) => navigate(`/customers/${row.id}`)}
                />
              </div>
              <div className="flex items-center justify-between gap-3 md:hidden">
                <p className="text-sm text-muted-foreground">
                  {total} customer{total === 1 ? "" : "s"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11"
                    disabled={page <= 0}
                    onClick={() => setPage(Math.max(0, page - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-16 text-center text-sm tabular-nums">
                    {page + 1} / {Math.max(1, data?.meta.totalPages ?? 1)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11"
                    disabled={page + 1 >= (data?.meta.totalPages ?? 1)}
                    onClick={() => setPage(page + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
