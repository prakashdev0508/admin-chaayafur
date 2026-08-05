import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { referralColumns } from "@/components/data-table/referral-columns";
import { ReferralFilterSheet } from "@/components/referrals/ReferralFilterSheet";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  countActiveReferralFilters,
  defaultReferralFilters,
  type ReferralFilters,
} from "@/lib/referral-filters";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import { listAdminReferrals } from "@/services/referrals.service";
import type { ReferralStatus } from "@/types/referral";

export function ReferralListPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_REFERRALS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<ReferralFilters>(
    defaultReferralFilters,
  );

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(filters.status !== "all"
        ? { status: filters.status as ReferralStatus }
        : {}),
    }),
    [page, pageSize, filters],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.referrals.list(params),
    queryFn: () => listAdminReferrals(params),
    enabled: canView,
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Referrals"
          description="Track referral commissions across customers."
        />
        <EmptyState
          icon={Gift}
          title="Access restricted"
          description="You do not have permission to view referrals."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Referrals"
        description="Commission credits land in the referrer wallet when the friend’s order is delivered."
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
            <ReferralFilterSheet
              filters={filters}
              activeCount={countActiveReferralFilters(filters)}
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
          {error instanceof Error ? error.message : "Failed to load referrals"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={referralColumns}
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
