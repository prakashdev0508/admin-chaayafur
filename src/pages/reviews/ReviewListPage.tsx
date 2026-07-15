import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquareQuote, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { createReviewColumns } from "@/components/data-table/review-columns";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";
import { queryKeys } from "@/lib/query-keys";
import {
  listReviews,
  updateOrderReviewVisibility,
  updateProductReviewVisibility,
} from "@/services/reviews.service";
import type { OrderReview, ProductReview, ReviewKind } from "@/types/review";

export function ReviewListPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_REVIEWS);
  const canModerate = hasPermission(PERMISSIONS.MODERATE_REVIEWS);
  const queryClient = useQueryClient();

  const [kind, setKind] = useState<ReviewKind>("product");
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "true" | "false"
  >("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pendingToggle, setPendingToggle] = useState<
    ProductReview | OrderReview | null
  >(null);

  const params = useMemo(
    () => ({
      kind,
      page: page + 1,
      limit: pageSize,
      ...(visibilityFilter !== "all"
        ? { isVisible: visibilityFilter === "true" }
        : {}),
    }),
    [kind, page, pageSize, visibilityFilter],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: queryKeys.reviews.list(params),
    queryFn: () => listReviews(params),
    enabled: canView,
  });

  const visibilityMutation = useMutation({
    mutationFn: async (review: ProductReview | OrderReview) => {
      const payload = { isVisible: !review.isVisible };
      if (kind === "product") {
        return updateProductReviewVisibility(review.id, payload);
      }
      return updateOrderReviewVisibility(review.id, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      toast.success("Review visibility updated");
      setPendingToggle(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update visibility",
      );
    },
  });

  const columns = useMemo(
    () =>
      createReviewColumns(kind, {
        canModerate,
        onToggleVisibility: setPendingToggle,
      }),
    [kind, canModerate],
  );

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Reviews"
          description="Moderate product and order reviews."
        />
        <EmptyState
          icon={MessageSquareQuote}
          title="Access restricted"
          description="You do not have permission to view reviews."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Reviews"
        description="Product and order reviews from delivered purchases."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={visibilityFilter}
              onValueChange={(value) => {
                if (value === "all" || value === "true" || value === "false") {
                  setVisibilityFilter(value);
                  setPage(0);
                }
              }}
              items={[
                { value: "all", label: "All visibility" },
                { value: "true", label: "Visible" },
                { value: "false", label: "Hidden" },
              ]}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All visibility</SelectItem>
                <SelectItem value="true">Visible</SelectItem>
                <SelectItem value="false">Hidden</SelectItem>
              </SelectContent>
            </Select>
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

      <Tabs
        value={kind}
        onValueChange={(value) => {
          setKind(value as ReviewKind);
          setPage(0);
        }}
      >
        <TabsList>
          <TabsTrigger value="product">Product reviews</TabsTrigger>
          <TabsTrigger value="order">Order reviews</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load reviews"}
        </p>
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
        />
      )}

      <ConfirmDialog
        open={pendingToggle !== null}
        onOpenChange={(open) => {
          if (!open) setPendingToggle(null);
        }}
        title={
          pendingToggle?.isVisible ? "Hide this review?" : "Show this review?"
        }
        description={
          pendingToggle?.isVisible
            ? "Hidden reviews are excluded from the storefront and product rating averages."
            : "This review will appear on the storefront again and count toward ratings."
        }
        confirmLabel={pendingToggle?.isVisible ? "Hide" : "Show"}
        variant={pendingToggle?.isVisible ? "destructive" : "default"}
        loading={visibilityMutation.isPending}
        onConfirm={() => {
          if (!pendingToggle) return Promise.resolve();
          return visibilityMutation.mutateAsync(pendingToggle);
        }}
      />
    </div>
  );
}
