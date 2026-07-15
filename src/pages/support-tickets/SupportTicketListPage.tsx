import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LifeBuoy, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { supportTicketColumns } from "@/components/data-table/support-ticket-columns";
import { SupportTicketFilterSheet } from "@/components/support-tickets/SupportTicketFilterSheet";
import { EmptyState } from "@/components/shared/EmptyState";
import { queryKeys } from "@/lib/query-keys";
import {
  countActiveSupportTicketFilters,
  defaultSupportTicketFilters,
  supportTicketFiltersToParams,
  type SupportTicketFilters,
} from "@/lib/support-ticket-filters";
import { listSupportTickets } from "@/services/support-tickets.service";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";

export function SupportTicketListPage() {
  const { hasPermission } = usePermission();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<SupportTicketFilters>(
    defaultSupportTicketFilters,
  );

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...supportTicketFiltersToParams(filters),
    }),
    [page, pageSize, filters],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.supportTickets.list(params),
    queryFn: () => listSupportTickets(params),
    enabled: hasPermission(PERMISSIONS.VIEW_ORDER_SUPPORT),
  });

  if (!hasPermission(PERMISSIONS.VIEW_ORDER_SUPPORT)) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Support"
          description="Customer order support tickets."
        />
        <EmptyState
          icon={LifeBuoy}
          title="Access restricted"
          description="You do not have permission to view support tickets."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Support"
        description="Review customer questions and problem reports on orders."
        action={
          <div className="flex gap-2">
            <SupportTicketFilterSheet
              filters={filters}
              activeCount={countActiveSupportTicketFilters(filters)}
              onApply={(next) => {
                setFilters(next);
                setPage(0);
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load tickets"}
        </p>
      ) : (
        <DataTable
          columns={supportTicketColumns}
          data={data?.items ?? []}
          pageCount={data?.meta.totalPages ?? 0}
          pageIndex={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          totalRows={data?.meta.total ?? 0}
        />
      )}
    </div>
  );
}
