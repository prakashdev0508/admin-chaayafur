import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { customerColumns } from "@/components/data-table/customer-columns";
import { EmptyState } from "@/components/shared/EmptyState";
import { queryKeys } from "@/lib/query-keys";
import { listCustomers } from "@/services/customers.service";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";

export function CustomerListPage() {
  const { hasPermission } = usePermission();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [phone, setPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

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
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Customers"
        description="View and manage customer accounts and addresses."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            {hasPermission(PERMISSIONS.UPDATE_CUSTOMERS) && (
              <Button render={<Link to="/customers/new"><Plus className="size-4" />Add customer</Link>} />
            )}
          </div>
        }
      />

      <form
        className="flex flex-wrap items-end gap-4 rounded-lg border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSearchPhone(phone);
          setPage(0);
        }}
      >
        <div className="min-w-[200px] flex-1 space-y-2">
          <Label htmlFor="phone-search">Search by phone</Label>
          <Input
            id="phone-search"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
        {searchPhone && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPhone("");
              setSearchPhone("");
              setPage(0);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load customers"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={customerColumns}
          data={data?.items ?? []}
          manualPagination
          pageIndex={page}
          pageSize={pageSize}
          pageCount={data?.meta.totalPages ?? 1}
          totalRows={data?.meta.total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      )}
    </div>
  );
}
