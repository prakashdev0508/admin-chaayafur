import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { walletWithdrawalColumns } from "@/components/data-table/wallet-withdrawal-columns";
import { WalletWithdrawalFilterSheet } from "@/components/wallet/WalletWithdrawalFilterSheet";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  countActiveWalletWithdrawalFilters,
  defaultWalletWithdrawalFilters,
  type WalletWithdrawalFilters,
} from "@/lib/wallet-filters";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import { listWalletWithdrawals } from "@/services/wallets.service";
import type { WalletWithdrawalStatus } from "@/types/wallet";

function filtersFromSearchParams(
  searchParams: URLSearchParams,
): WalletWithdrawalFilters {
  const customerId = searchParams.get("customerId") ?? "";
  const statusParam = searchParams.get("status");
  const status =
    statusParam === "all" ||
    statusParam === "PENDING" ||
    statusParam === "PROCESSING" ||
    statusParam === "SUCCESS" ||
    statusParam === "FAILED" ||
    statusParam === "REJECTED"
      ? statusParam
      : customerId
        ? "all"
        : defaultWalletWithdrawalFilters.status;

  return { status, customerId };
}

export function WalletWithdrawalListPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_WALLETS);
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<WalletWithdrawalFilters>(() =>
    filtersFromSearchParams(searchParams),
  );

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(filters.status !== "all"
        ? { status: filters.status as WalletWithdrawalStatus }
        : {}),
      ...(filters.customerId.trim()
        ? { customerId: Number(filters.customerId) }
        : {}),
    }),
    [page, pageSize, filters],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.walletWithdrawals.list(params),
    queryFn: () => listWalletWithdrawals(params),
    enabled: canView,
  });

  function applyFilters(next: WalletWithdrawalFilters) {
    setFilters(next);
    setPage(0);
    const nextParams = new URLSearchParams();
    if (next.status !== "all") nextParams.set("status", next.status);
    if (next.customerId.trim()) {
      nextParams.set("customerId", next.customerId.trim());
    }
    setSearchParams(nextParams, { replace: true });
  }

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Withdrawals"
          description="Review and approve wallet payout requests."
        />
        <EmptyState
          icon={Wallet}
          title="Access restricted"
          description="You do not have permission to view wallet withdrawals."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Withdrawals"
        description="Approve UPI or bank (IMPS) payouts from referral wallets."
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
            <WalletWithdrawalFilterSheet
              filters={filters}
              activeCount={countActiveWalletWithdrawalFilters(filters)}
              onApply={applyFilters}
            />
          </div>
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load withdrawals"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={walletWithdrawalColumns}
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
