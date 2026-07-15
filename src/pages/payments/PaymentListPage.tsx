import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { paymentColumns } from "@/components/data-table/payment-columns";
import {
  PaymentFilterSheet,
} from "@/components/payments/PaymentFilterSheet";
import {
  countActivePaymentFilters,
  defaultPaymentFilters,
  type PaymentFilters,
} from "@/lib/payment-filters";
import { EmptyState } from "@/components/shared/EmptyState";
import { queryKeys } from "@/lib/query-keys";
import { listPayments } from "@/services/payments.service";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";
import type { PaymentStatus } from "@/types/payment";

export function PaymentListPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_PAYMENTS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<PaymentFilters>(defaultPaymentFilters);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(filters.status !== "all"
        ? { status: filters.status as PaymentStatus }
        : {}),
      ...(filters.orderId.trim() ? { orderId: Number(filters.orderId) } : {}),
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
    queryKey: queryKeys.payments.list(params),
    queryFn: () => listPayments(params),
    enabled: canView,
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Payments" description="View payment transactions." />
        <EmptyState
          icon={CreditCard}
          title="Access restricted"
          description="You do not have permission to view payments."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Payments"
        description="Monitor Razorpay payment status across all orders."
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
            <PaymentFilterSheet
              filters={filters}
              activeCount={countActivePaymentFilters(filters)}
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
          {error instanceof Error ? error.message : "Failed to load payments"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={paymentColumns}
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
