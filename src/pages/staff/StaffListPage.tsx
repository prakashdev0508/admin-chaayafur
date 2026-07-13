import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { staffColumns } from "@/components/data-table/staff-columns";
import { StaffFilterSheet } from "@/components/staff/StaffFilterSheet";
import { EmptyState } from "@/components/shared/EmptyState";
import { queryKeys } from "@/lib/query-keys";
import {
  countActiveStaffFilters,
  defaultStaffFilters,
  staffFiltersToParams,
  type StaffFilters,
} from "@/lib/staff-filters";
import { listStaff } from "@/services/auth.service";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";

export function StaffListPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<StaffFilters>(defaultStaffFilters);

  const params = useMemo(
    () => staffFiltersToParams(filters, page, pageSize),
    [filters, page, pageSize],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.staff.list(params),
    queryFn: () => listStaff(params),
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Staff" description="Manage admin panel users." />
        <EmptyState
          icon={UserPlus}
          title="Access restricted"
          description="Only Super Admins can view staff users."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Staff"
        description="View and manage admin panel users."
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
            <StaffFilterSheet
              filters={filters}
              activeCount={countActiveStaffFilters(filters)}
              onApply={(next) => {
                setFilters(next);
                setPage(0);
              }}
            />
            {hasPermission("create-staff") && (
              <Button render={<Link to="/staff/new"><Plus className="size-4" />Add staff</Link>} />
            )}
          </div>
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load staff"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No staff users found"
          description="Try adjusting your filters or add a new staff member."
          action={
            hasPermission("create-staff") ? (
              <Button render={<Link to="/staff/new">Add staff</Link>} />
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={staffColumns}
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
