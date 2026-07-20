import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { refundColumns } from "@/components/data-table/refund-columns";
import { RefundFilterSheet } from "@/components/refunds/RefundFilterSheet";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  countActiveRefundFilters,
  defaultRefundFilters,
  type RefundFilters,
} from "@/lib/refund-filters";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import { listRefunds } from "@/services/refunds.service";
import type { RefundStatus } from "@/types/refund";

export function RefundListPage() {
  const { hasAnyPermission } = usePermission();
  const canView = hasAnyPermission([
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.VIEW_ORDERS,
  ]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<RefundFilters>(defaultRefundFilters);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(filters.status !== "all"
        ? { status: filters.status as RefundStatus }
        : {}),
      ...(filters.orderId.trim()
        ? { orderId: Number(filters.orderId) }
        : {}),
      ...(filters.orderNumber.trim()
        ? { orderNumber: filters.orderNumber.trim() }
        : {}),
      ...(filters.createdFrom.trim()
        ? { createdFrom: filters.createdFrom.trim() }
        : {}),
      ...(filters.createdTo.trim()
        ? { createdTo: filters.createdTo.trim() }
        : {}),
    }),
    [page, pageSize, filters],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.refunds.list(params),
    queryFn: () => listRefunds(params),
    enabled: canView,
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Refunds"
          description="Staff refund inbox across all orders."
        />
        <EmptyState
          icon={RotateCcw}
          title="Access restricted"
          description="You do not have permission to view refunds."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Refunds"
        description="Track initiated, processing, and completed refunds."
        action={
          <div className="flex gap-2">
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
            <RefundFilterSheet
              filters={filters}
              activeCount={countActiveRefundFilters(filters)}
              onApply={(next) => {
                setFilters(next);
                setPage(0);
              }}
            />
          </div>
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load refunds"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={refundColumns}
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
