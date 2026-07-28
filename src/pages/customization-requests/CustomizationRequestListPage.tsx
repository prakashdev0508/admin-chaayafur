import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { customizationRequestColumns } from "@/components/data-table/customization-request-columns";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import { listCustomizationRequests } from "@/services/customization-requests.service";
import type { CustomizationRequestStatus } from "@/types/customization-request";

const statusFilterOptions: Array<{
  value: string;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CONVERTED", label: "Converted" },
];

export function CustomizationRequestListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_CUSTOMIZATION_REQUESTS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(statusFilter !== "all"
        ? { status: statusFilter as CustomizationRequestStatus }
        : {}),
    }),
    [page, pageSize, statusFilter],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.customizationRequests.list(params),
    queryFn: () => listCustomizationRequests(params),
    enabled: canView,
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Customization requests"
          description="Customer custom furniture requests."
        />
        <EmptyState
          icon={ClipboardList}
          title="Access restricted"
          description="You do not have permission to view customization requests."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Customization requests"
        description="Review customer custom orders, approve, and convert to payment links."
        action={
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (value) {
                    setStatusFilter(value);
                    setPage(0);
                  }
                }}
                items={statusFilterOptions}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load customization requests"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={customizationRequestColumns}
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
          onRowClick={(row) => navigate(`/customization-requests/${row.id}`)}
        />
      )}
    </div>
  );
}
