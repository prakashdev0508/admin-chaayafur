import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw, Ticket } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { couponColumns } from "@/components/data-table/coupon-columns";
import { EmptyState } from "@/components/shared/EmptyState";
import { queryKeys } from "@/lib/query-keys";
import { listCoupons } from "@/services/coupons.service";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";

export function CouponListPage() {
  const { hasPermission } = usePermission();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const params = { page: page + 1, limit: pageSize };

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.coupons.list(params),
    queryFn: () => listCoupons(params),
    enabled: hasPermission(PERMISSIONS.VIEW_COUPONS),
  });

  if (!hasPermission(PERMISSIONS.VIEW_COUPONS)) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Coupons" description="Manage discount codes." />
        <EmptyState
          icon={Ticket}
          title="Access restricted"
          description="You do not have permission to view coupons."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Coupons"
        description="Create and manage discount codes for your store."
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
            {hasPermission(PERMISSIONS.CREATE_COUPONS) && (
              <Button render={<Link to="/coupons/new"><Plus className="size-4" />New coupon</Link>} />
            )}
          </div>
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load coupons"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No coupons yet"
          description="Create your first discount code to boost sales."
          action={
            hasPermission(PERMISSIONS.CREATE_COUPONS) ? (
              <Button render={<Link to="/coupons/new">Create coupon</Link>} />
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={couponColumns}
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
