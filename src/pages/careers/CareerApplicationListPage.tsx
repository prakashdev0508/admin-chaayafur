import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { careerApplicationColumns } from "@/components/data-table/career-application-columns";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { CAREER_STATUS_FILTER_ITEMS } from "@/lib/select-items";
import { usePermission } from "@/hooks/usePermission";
import { listCareerApplications } from "@/services/careers.service";
import type { CareerApplicationStatus } from "@/types/career";

export function CareerApplicationListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_CAREERS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("all");

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(status !== "all"
        ? { status: status as CareerApplicationStatus }
        : {}),
    }),
    [page, pageSize, status],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.careers.list(params),
    queryFn: () => listCareerApplications(params),
    enabled: canView,
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Careers"
          description="Website career applications."
        />
        <EmptyState
          icon={Briefcase}
          title="Access restricted"
          description="You do not have permission to view career applications."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Careers"
        description="Review applications submitted from the shop careers page."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) => {
                if (!value) return;
                setStatus(value);
                setPage(0);
              }}
              items={CAREER_STATUS_FILTER_ITEMS}
            >
              <SelectTrigger className="h-9 w-45">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {CAREER_STATUS_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh applications"
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load career applications"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={careerApplicationColumns}
          data={data?.items ?? []}
          manualPagination
          pageCount={data?.meta.totalPages ?? 0}
          pageIndex={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          totalRows={data?.meta.total ?? 0}
          onRowClick={(row) => navigate(`/careers/${row.id}`)}
        />
      )}
    </div>
  );
}
