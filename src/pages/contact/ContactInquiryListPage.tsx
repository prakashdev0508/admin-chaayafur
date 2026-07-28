import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { contactInquiryColumns } from "@/components/data-table/contact-inquiry-columns";
import { EmptyState } from "@/components/shared/EmptyState";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { usePermission } from "@/hooks/usePermission";
import { listContactInquiries } from "@/services/contact.service";

export function ContactInquiryListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_SETTINGS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
    }),
    [page, pageSize],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.contactInquiries.list(params),
    queryFn: () => listContactInquiries(params),
    enabled: canView,
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Contact enquiries"
          description="Website Contact Us form submissions."
        />
        <EmptyState
          icon={Mail}
          title="Access restricted"
          description="You do not have permission to view contact enquiries."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Contact enquiries"
        description="Review and reply to website Contact Us submissions."
        action={
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
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load contact enquiries"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={contactInquiryColumns}
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
          onRowClick={(row) => navigate(`/contact/${row.id}`)}
        />
      )}
    </div>
  );
}
