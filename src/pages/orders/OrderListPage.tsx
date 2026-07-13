import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { orderColumns } from "@/components/data-table/order-columns";
import {
  OrderFilterSheet,
} from "@/components/orders/OrderFilterSheet";
import {
  countActiveOrderFilters,
  defaultOrderFilters,
  type OrderFilters,
} from "@/lib/order-filters";
import { queryKeys } from "@/lib/query-keys";
import { listOrders } from "@/services/orders.service";
import { usePermission } from "@/hooks/usePermission";
import type { OrderStatus } from "@/types/order";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShoppingCart } from "lucide-react";

export function OrderListPage() {
  const { hasPermission } = usePermission();
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
      ...(filters.customerId.trim()
        ? { customerId: Number(filters.customerId) }
        : {}),
    }),
    [page, pageSize, filters],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => listOrders(params),
    enabled: hasPermission("view-orders"),
  });

  const activeFilterCount = countActiveOrderFilters(filters);

  if (!hasPermission("view-orders")) {
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
      )}
    </div>
  );
}
