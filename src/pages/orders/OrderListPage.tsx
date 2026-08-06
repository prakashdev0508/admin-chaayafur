import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { orderColumns } from "@/components/data-table/order-columns";
import { OrderFilterSheet } from "@/components/orders/OrderFilterSheet";
import { OrderListMobileCards } from "@/components/orders/OrderListMobileCards";
import {
  countActiveOrderFilters,
  defaultOrderFilters,
  type OrderFilters,
} from "@/lib/order-filters";
import { queryKeys } from "@/lib/query-keys";
import { listOrders } from "@/services/orders.service";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";
import type { OrderStatus } from "@/types/order";
import { EmptyState } from "@/components/shared/EmptyState";

export function OrderListPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_ORDERS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<OrderFilters>(defaultOrderFilters);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(filters.status !== "all"
        ? { status: filters.status as OrderStatus }
        : {}),
      ...(filters.refundStatus !== "all"
        ? {
            refundStatus:
              filters.refundStatus as import("@/types/refund").RefundStatus,
          }
        : {}),
      ...(filters.customerId.trim()
        ? { customerId: Number(filters.customerId) }
        : {}),
      ...(filters.orderNumber.trim()
        ? { orderNumber: filters.orderNumber.trim() }
        : {}),
      ...(filters.customerPhone.trim()
        ? { customerPhone: filters.customerPhone.trim() }
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
    queryKey: queryKeys.orders.list(params),
    queryFn: () => listOrders(params),
    enabled: canView,
  });

  const activeFilterCount = countActiveOrderFilters(filters);

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Orders" description="Track and fulfill customer orders." />
        <EmptyState
          icon={ShoppingCart}
          title="Access restricted"
          description="You do not have permission to view orders."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Orders"
        description="Track and fulfill customer orders from your store."
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
            <OrderFilterSheet
              filters={filters}
              activeCount={activeFilterCount}
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
          {error instanceof Error ? error.message : "Failed to load orders"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <OrderListMobileCards orders={data?.items ?? []} />

          <div className="hidden md:block">
            <DataTable
              columns={orderColumns}
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
          </div>

          <div className="flex items-center justify-between gap-3 md:hidden">
            <p className="text-sm text-muted-foreground">
              {data?.meta.total ?? 0} order
              {(data?.meta.total ?? 0) === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-11"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
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
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
