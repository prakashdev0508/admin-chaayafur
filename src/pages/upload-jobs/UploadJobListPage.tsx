import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileClock, ImageUp, Loader2, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import {
  createUploadJobColumns,
  type UploadJobDownloadKind,
} from "@/components/data-table/upload-job-columns";
import { BulkProductImageUploadDialog } from "@/components/products/BulkProductImageUploadDialog";
import { ProductBulkUploadDialog } from "@/components/products/ProductBulkUploadDialog";
import { UploadJobFilterSheet } from "@/components/upload-jobs/UploadJobFilterSheet";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api";
import { triggerBrowserDownload } from "@/lib/download";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import {
  countActiveUploadJobFilters,
  defaultUploadJobFilters,
  uploadJobFiltersToParams,
  type UploadJobFilters,
} from "@/lib/upload-job-filters";
import {
  downloadUploadJobFile,
  listUploadJobs,
} from "@/services/upload-jobs.service";
import type { UploadJob } from "@/types/upload-job";

export function UploadJobListPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_PRODUCTS);
  const canCreate = hasPermission(PERMISSIONS.CREATE_PRODUCTS);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<UploadJobFilters>(
    defaultUploadJobFilters,
  );
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [productUploadOpen, setProductUploadOpen] = useState(false);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...uploadJobFiltersToParams(filters),
    }),
    [page, pageSize, filters],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.uploadJobs.list(params),
    queryFn: () => listUploadJobs(params),
    enabled: canView,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const hasActive = items.some(
        (job) => job.status === "PENDING" || job.status === "PROCESSING",
      );
      return hasActive ? 4000 : false;
    },
  });

  const handleDownload = async (
    job: UploadJob,
    kind: UploadJobDownloadKind,
  ) => {
    const key = `${job.id}:${kind}`;
    setDownloadingKey(key);
    try {
      const { blob, filename } = await downloadUploadJobFile(job.id, kind);
      const fallback =
        kind === "result"
          ? `upload-job-${job.id}-result.xlsx`
          : `upload-job-${job.id}-uploaded`;
      triggerBrowserDownload(blob, filename || fallback);
      toast.success(kind === "result" ? "Result downloaded" : "File downloaded");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Download failed";
      toast.error(message);
    } finally {
      setDownloadingKey(null);
    }
  };

  const columns = useMemo(
    () =>
      createUploadJobColumns({
        downloadingKey,
        onDownload: (job, kind) => {
          void handleDownload(job, kind);
        },
      }),
    [downloadingKey],
  );

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Upload jobs"
          description="Background product image staging and Excel imports."
        />
        <EmptyState
          icon={FileClock}
          title="Access restricted"
          description="You do not have permission to view upload jobs."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Upload jobs"
        description="Upload product images and sheets, then track processing here."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canCreate && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setImageUploadOpen(true)}
                >
                  <ImageUp className="size-4" />
                  Upload images
                </Button>
                <Button onClick={() => setProductUploadOpen(true)}>
                  <Upload className="size-4" />
                  Upload products
                </Button>
              </>
            )}
            <UploadJobFilterSheet
              filters={filters}
              activeCount={countActiveUploadJobFilters(filters)}
              onApply={(next) => {
                setFilters(next);
                setPage(0);
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
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
          {error instanceof Error ? error.message : "Failed to load upload jobs"}
        </p>
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={FileClock}
          title="No upload jobs yet"
          description={
            countActiveUploadJobFilters(filters) > 0
              ? "No jobs match the current filters."
              : "Upload a product image ZIP or an Excel sheet to get started."
          }
          action={
            canCreate && countActiveUploadJobFilters(filters) === 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImageUploadOpen(true)}
                >
                  <ImageUp className="size-4" />
                  Upload images
                </Button>
                <Button onClick={() => setProductUploadOpen(true)}>
                  <Upload className="size-4" />
                  Upload products
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          pageCount={data?.meta.totalPages ?? 0}
          pageIndex={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          totalRows={data?.meta.total ?? 0}
          manualPagination
        />
      )}

      {canCreate && (
        <>
          <BulkProductImageUploadDialog
            open={imageUploadOpen}
            onOpenChange={setImageUploadOpen}
          />
          <ProductBulkUploadDialog
            open={productUploadOpen}
            onOpenChange={setProductUploadOpen}
            onImportSuccess={() => {
              void queryClient.invalidateQueries({
                queryKey: queryKeys.uploadJobs.all,
              });
            }}
          />
        </>
      )}
    </div>
  );
}
