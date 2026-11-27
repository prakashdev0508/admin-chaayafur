import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquareQuote, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { createAdminReviewColumns } from "@/components/data-table/admin-review-columns";
import { DataTable } from "@/components/data-table/data-table";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminReviewFormDialog } from "@/components/reviews/AdminReviewFormDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermission } from "@/hooks/usePermission";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import {
  createAdminReview,
  listAdminReviews,
} from "@/services/admin-reviews.service";
import type { CreateAdminReviewPayload } from "@/types/admin-review";

type StatusFilter = "all" | "active" | "hidden";
type HomeFilter = "all" | "home" | "off";

const STATUS_ITEMS = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
];

const HOME_ITEMS = [
  { value: "all", label: "All home" },
  { value: "home", label: "On home" },
  { value: "off", label: "Off home" },
];

function statusToParam(value: StatusFilter) {
  if (value === "active") return true;
  if (value === "hidden") return false;
  return undefined;
}

function homeToParam(value: HomeFilter) {
  if (value === "home") return true;
  if (value === "off") return false;
  return undefined;
}

export function AdminReviewListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_ADMIN_REVIEWS);
  const canCreate = hasPermission(PERMISSIONS.CREATE_ADMIN_REVIEWS);
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [homeFilter, setHomeFilter] = useState<HomeFilter>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [status, homeFilter]);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      ...(statusToParam(status) !== undefined
        ? { isActive: statusToParam(status) }
        : {}),
      ...(homeToParam(homeFilter) !== undefined
        ? { showOnHome: homeToParam(homeFilter) }
        : {}),
    }),
    [page, pageSize, status, homeFilter],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.admin.reviews.list(params),
    queryFn: () => listAdminReviews(params),
    enabled: canView,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminReviewPayload) =>
      createAdminReview(payload),
    onSuccess: (review) => {
      toast.success("Review created");
      setDialogOpen(false);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.reviews.all,
      });
      navigate(`/content/admin-reviews/${review.id}`);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to create review",
      );
    },
  });

  const columns = useMemo(() => createAdminReviewColumns(), []);

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Admin reviews"
          description="Staff-authored product testimonials."
        />
        <EmptyState
          icon={MessageSquareQuote}
          title="Access restricted"
          description="You do not have permission to view admin reviews."
        />
      </div>
    );
  }

  const filtered = status !== "all" || homeFilter !== "all";
  const isEmpty = !isLoading && (data?.items.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Admin reviews"
        description="Staff-authored testimonials shown on products and home."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={status}
          onValueChange={(value) => {
            if (value === "all" || value === "active" || value === "hidden") {
              setStatus(value);
            }
          }}
          items={STATUS_ITEMS}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={homeFilter}
          onValueChange={(value) => {
            if (value === "all" || value === "home" || value === "off") {
              setHomeFilter(value);
            }
          }}
          items={HOME_ITEMS}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOME_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          aria-label="Refresh admin reviews"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
        {canCreate ? (
          <Button className="ml-auto" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Add review
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load admin reviews"}
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={MessageSquareQuote}
          title={filtered ? "No reviews match" : "No admin reviews yet"}
          description={
            filtered
              ? "Try another status or home filter."
              : "Add a testimonial linked to a product for the storefront."
          }
          action={
            canCreate && !filtered ? (
              <Button onClick={() => setDialogOpen(true)}>Add review</Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
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

      <AdminReviewFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        loading={createMutation.isPending}
        onSubmit={(payload) =>
          createMutation.mutateAsync(payload as CreateAdminReviewPayload)
        }
      />
    </div>
  );
}
