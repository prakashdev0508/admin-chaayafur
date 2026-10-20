import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Briefcase, Loader2, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { createJobPostingColumns } from "@/components/data-table/job-posting-columns";
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
import { usePermission } from "@/hooks/usePermission";
import {
  listCareerApplications,
  listJobPostings,
} from "@/services/careers.service";

const ACTIVE_FILTER_ITEMS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export function JobPostingListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_CAREERS);
  const canCreate = hasPermission(PERMISSIONS.CREATE_CAREERS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [activeFilter, setActiveFilter] = useState("all");

  const params = useMemo(() => {
    const base: { page: number; limit: number; isActive?: boolean } = {
      page: page + 1,
      limit: pageSize,
    };
    if (activeFilter === "active") base.isActive = true;
    if (activeFilter === "inactive") base.isActive = false;
    return base;
  }, [page, pageSize, activeFilter]);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.careers.jobs.list(params),
    queryFn: () => listJobPostings(params),
    enabled: canView,
  });

  const jobs = data?.items ?? [];
  const needsCountFetch = jobs.some(
    (job) => job.applicationCount === undefined,
  );

  const countQueries = useQueries({
    queries: jobs.map((job) => ({
      queryKey: queryKeys.careers.list({
        jobPostingId: job.id,
        page: 1,
        limit: 1,
      }),
      queryFn: () =>
        listCareerApplications({
          jobPostingId: job.id,
          page: 1,
          limit: 1,
        }),
      enabled: canView && needsCountFetch && job.applicationCount === undefined,
      staleTime: 30_000,
    })),
  });

  const applicationCounts = useMemo(() => {
    const counts: Record<number, number | undefined> = {};
    jobs.forEach((job, index) => {
      if (job.applicationCount !== undefined) {
        counts[job.id] = job.applicationCount;
        return;
      }
      const result = countQueries[index];
      if (result?.isSuccess) {
        counts[job.id] = result.data.meta.total;
      }
    });
    return counts;
  }, [jobs, countQueries]);

  const columns = useMemo(
    () => createJobPostingColumns(applicationCounts),
    [applicationCounts],
  );

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Careers"
          description="Manage open roles and applications."
        />
        <EmptyState
          icon={Briefcase}
          title="Access restricted"
          description="You do not have permission to view careers."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Careers"
        description="Job postings and how many applications each role received."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={activeFilter}
              onValueChange={(value) => {
                if (!value) return;
                setActiveFilter(value);
                setPage(0);
              }}
              items={[...ACTIVE_FILTER_ITEMS]}
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVE_FILTER_ITEMS.map((item) => (
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
              aria-label="Refresh job postings"
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            {canCreate ? (
              <Button
                render={
                  <Link to="/careers/new">
                    <Plus className="size-4" />
                    New posting
                  </Link>
                }
              />
            ) : null}
          </div>
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load job postings"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={jobs}
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
