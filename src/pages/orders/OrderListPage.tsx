import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { orderColumns } from "@/components/data-table/order-columns";
import { OrderFilterSheet } from "@/components/orders/OrderFilterSheet";
import {
  OrderActiveFilters,
  removeOrderFilter,
} from "@/components/orders/OrderActiveFilters";
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
import type { OrderStatus, OrderType } from "@/types/order";
import { EmptyState } from "@/components/shared/EmptyState";

const ORDER_TYPE_VALUES = new Set(["all", "CHECKOUT", "MANUAL"]);
const REFUND_STATUS_VALUES = new Set([
  "all",
  "INITIATED",
  "PROCESSING",
  "PROCESSED",
  "FAILED",
  "CANCELLED",
]);

function filtersFromSearchParams(
  searchParams: URLSearchParams,
): OrderFilters {
  const orderType = searchParams.get("orderType");
  const refundStatus = searchParams.get("refundStatus");

  return {
    status: searchParams.get("status") ?? defaultOrderFilters.status,
    orderType:
      orderType && ORDER_TYPE_VALUES.has(orderType)
        ? orderType
        : defaultOrderFilters.orderType,
    refundStatus:
      refundStatus && REFUND_STATUS_VALUES.has(refundStatus)
        ? refundStatus
        : defaultOrderFilters.refundStatus,
    customerId:
      searchParams.get("customerId") ?? defaultOrderFilters.customerId,
    orderNumber:
      searchParams.get("orderNumber") ?? defaultOrderFilters.orderNumber,
    customerPhone:
      searchParams.get("customerPhone") ?? defaultOrderFilters.customerPhone,
    createdFrom:
      searchParams.get("createdFrom") ?? defaultOrderFilters.createdFrom,
    createdTo: searchParams.get("createdTo") ?? defaultOrderFilters.createdTo,
  };
}

function paginationFromSearchParams(searchParams: URLSearchParams) {
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const limitRaw = Number(searchParams.get("limit") ?? "10");
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const limit =
    Number.isFinite(limitRaw) && limitRaw >= 1 && limitRaw <= 100
      ? limitRaw
      : 10;
  return { pageIndex: page - 1, pageSize: limit };
}

function searchParamsFromState(
  filters: OrderFilters,
  pageIndex: number,
  pageSize: number,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.status !== defaultOrderFilters.status) {
    params.set("status", filters.status);
  }
  if (filters.orderType !== defaultOrderFilters.orderType) {
    params.set("orderType", filters.orderType);
  }
  if (filters.refundStatus !== defaultOrderFilters.refundStatus) {
    params.set("refundStatus", filters.refundStatus);
  }
  if (filters.customerId.trim()) {
    params.set("customerId", filters.customerId.trim());
  }
  if (filters.orderNumber.trim()) {
    params.set("orderNumber", filters.orderNumber.trim());
  }
  if (filters.customerPhone.trim()) {
    params.set("customerPhone", filters.customerPhone.trim());
  }
  if (filters.createdFrom.trim()) {
    params.set("createdFrom", filters.createdFrom.trim());
  }
  if (filters.createdTo.trim()) {
    params.set("createdTo", filters.createdTo.trim());
  }
  if (pageIndex > 0) params.set("page", String(pageIndex + 1));
  if (pageSize !== 10) params.set("limit", String(pageSize));

  return params;
}

export function OrderListPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_ORDERS);
  const canCreate = hasPermission(PERMISSIONS.CREATE_ORDERS);
  const [searchParams, setSearchParams] = useSearchParams();

  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<OrderFilters>(() =>
    filtersFromSearchParams(searchParams),
  );
  const [draftFilters, setDraftFilters] = useState<OrderFilters>(() =>
    filtersFromSearchParams(searchParams),
  );

  const initialPagination = paginationFromSearchParams(searchParams);
  const [pageIndex, setPageIndex] = useState(initialPagination.pageIndex);
  const [pageSize, setPageSize] = useState(initialPagination.pageSize);

  const syncUrl = useCallback(
    (filters: OrderFilters, nextPageIndex: number, nextPageSize: number) => {
      setSearchParams(
        searchParamsFromState(filters, nextPageIndex, nextPageSize),
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const params = useMemo(
    () => ({
      page: pageIndex + 1,
      limit: pageSize,
      ...(appliedFilters.status !== "all"
        ? { status: appliedFilters.status as OrderStatus }
        : {}),
      ...(appliedFilters.orderType !== "all"
        ? { orderType: appliedFilters.orderType as OrderType }
        : {}),
      ...(appliedFilters.refundStatus !== "all"
        ? {
            refundStatus:
              appliedFilters.refundStatus as import("@/types/refund").RefundStatus,
          }
        : {}),
      ...(appliedFilters.customerId.trim()
        ? { customerId: Number(appliedFilters.customerId) }
        : {}),
      ...(appliedFilters.orderNumber.trim()
        ? { orderNumber: appliedFilters.orderNumber.trim() }
        : {}),
      ...(appliedFilters.customerPhone.trim()
        ? { customerPhone: appliedFilters.customerPhone.trim() }
        : {}),
      ...(appliedFilters.createdFrom.trim()
        ? { createdFrom: appliedFilters.createdFrom.trim() }
        : {}),
      ...(appliedFilters.createdTo.trim()
        ? { createdTo: appliedFilters.createdTo.trim() }
        : {}),
    }),
    [pageIndex, pageSize, appliedFilters],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => listOrders(params),
    enabled: canView,
  });

  const activeFilterCount = countActiveOrderFilters(appliedFilters);

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setPageIndex(0);
    syncUrl(draftFilters, 0, pageSize);
    setFilterOpen(false);
  };

  const handleClear = () => {
    setDraftFilters(defaultOrderFilters);
    setAppliedFilters(defaultOrderFilters);
    setPageIndex(0);
    syncUrl(defaultOrderFilters, 0, pageSize);
    setFilterOpen(false);
  };

  const handleRemoveFilter = (key: keyof OrderFilters) => {
    const next = removeOrderFilter(appliedFilters, key);
    setAppliedFilters(next);
    setPageIndex(0);
    syncUrl(next, 0, pageSize);
  };

  const handlePageChange = (nextPage: number) => {
    setPageIndex(nextPage);
    syncUrl(appliedFilters, nextPage, pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageIndex(0);
    syncUrl(appliedFilters, 0, size);
  };

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Orders"
          description="Track and fulfill customer orders."
        />
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
          <div className="flex items-center gap-2">
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
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={openFilters}
            >
              <Filter className="size-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {canCreate && (
              <Button
                variant="outline"
                render={
                  <Link to="/orders/manual/new">
                    <Plus className="size-4" />
                    New manual order
                  </Link>
                }
              />
            )}
          </div>
        }
      />

      <OrderActiveFilters
        filters={appliedFilters}
        onRemove={handleRemoveFilter}
        onClearAll={handleClear}
      />

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load orders"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading orders...
            </div>
          </div>
        )}

        {isLoading && !data ? (
          <div className="flex h-48 items-center justify-center rounded-md border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading orders...
            </div>
          </div>
        ) : (
          <>
            <OrderListMobileCards orders={data?.items ?? []} />

            <div className="hidden md:block">
              <DataTable
                columns={orderColumns}
                data={data?.items ?? []}
                manualPagination
                pageIndex={pageIndex}
                pageSize={pageSize}
                pageCount={data?.meta.totalPages ?? 1}
                totalRows={data?.meta.total}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
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
                  disabled={pageIndex <= 0}
                  onClick={() => handlePageChange(Math.max(0, pageIndex - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-16 text-center text-sm tabular-nums">
                  {pageIndex + 1} / {Math.max(1, data?.meta.totalPages ?? 1)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  disabled={pageIndex + 1 >= (data?.meta.totalPages ?? 1)}
                  onClick={() => handlePageChange(pageIndex + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <OrderFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        onApply={handleApply}
        onClear={handleClear}
      />
    </div>
  );
}
