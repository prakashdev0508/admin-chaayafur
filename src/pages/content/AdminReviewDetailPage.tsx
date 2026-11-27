import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Home,
  Loader2,
  MessageSquareQuote,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminReviewFormDialog } from "@/components/reviews/AdminReviewFormDialog";
import { StarRating } from "@/components/reviews/StarRating";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePermission } from "@/hooks/usePermission";
import { formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { cn } from "@/lib/utils";
import {
  deleteAdminReview,
  getAdminReview,
  updateAdminReview,
} from "@/services/admin-reviews.service";
import type { UpdateAdminReviewPayload } from "@/types/admin-review";

export function AdminReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const reviewId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.VIEW_ADMIN_REVIEWS);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_ADMIN_REVIEWS);
  const canDelete = hasPermission(PERMISSIONS.DELETE_ADMIN_REVIEWS);

  const [editOpen, setEditOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "active" | "home" | null
  >(null);

  const reviewQuery = useQuery({
    queryKey: queryKeys.admin.reviews.detail(reviewId),
    queryFn: () => getAdminReview(reviewId),
    enabled: canView && Number.isFinite(reviewId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.admin.reviews.all,
    });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateAdminReviewPayload) =>
      updateAdminReview(reviewId, payload),
    onSuccess: (review) => {
      toast.success("Review updated");
      queryClient.setQueryData(
        queryKeys.admin.reviews.detail(reviewId),
        review,
      );
      invalidate();
      setEditOpen(false);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update review",
      );
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      updateAdminReview(reviewId, { isActive }),
    onMutate: () => setPendingAction("active"),
    onSuccess: (review) => {
      toast.success(review.isActive ? "Review shown" : "Review hidden");
      queryClient.setQueryData(
        queryKeys.admin.reviews.detail(reviewId),
        review,
      );
      invalidate();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update visibility",
      );
    },
    onSettled: () => setPendingAction(null),
  });

  const toggleHomeMutation = useMutation({
    mutationFn: (showOnHome: boolean) =>
      updateAdminReview(reviewId, { showOnHome }),
    onMutate: () => setPendingAction("home"),
    onSuccess: (review) => {
      toast.success(
        review.showOnHome ? "Added to home" : "Removed from home",
      );
      queryClient.setQueryData(
        queryKeys.admin.reviews.detail(reviewId),
        review,
      );
      invalidate();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update home flag",
      );
    },
    onSettled: () => setPendingAction(null),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminReview(reviewId),
    onSuccess: () => {
      toast.success("Review deleted");
      invalidate();
      navigate("/content/admin-reviews");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete review",
      );
    },
  });

  if (!canView) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Admin review"
          description="Staff-authored product testimonial."
        />
        <EmptyState
          icon={MessageSquareQuote}
          title="Access restricted"
          description="You do not have permission to view admin reviews."
        />
      </div>
    );
  }

  if (reviewQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reviewQuery.isError || !reviewQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Admin review"
          description="Staff-authored product testimonial."
        />
        <EmptyState
          icon={MessageSquareQuote}
          title="Review not found"
          description={
            reviewQuery.error instanceof Error
              ? reviewQuery.error.message
              : "Could not load this admin review."
          }
        />
        <Link
          to="/content/admin-reviews"
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        >
          Back to admin reviews
        </Link>
      </div>
    );
  }

  const review = reviewQuery.data;
  const images = review.images ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={review.displayName}
        description={
          review.location
            ? `${review.location} · Updated ${formatDate(review.updatedAt)}`
            : `Updated ${formatDate(review.updatedAt)}`
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              render={
                <Link to="/content/admin-reviews">
                  <ArrowLeft className="size-4" />
                  Back
                </Link>
              }
            />
            {canUpdate ? (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                onClick={() => setPendingDelete(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge variant={review.isActive ? "success" : "neutral"}>
                  {review.isActive ? "Active" : "Hidden"}
                </StatusBadge>
                {review.showOnHome ? (
                  <StatusBadge variant="brand">On home</StatusBadge>
                ) : (
                  <StatusBadge variant="neutral">Off home</StatusBadge>
                )}
              </div>
              <div className="space-y-2">
                <StarRating value={review.rating} />
                <CardTitle className="text-base font-medium">
                  Testimonial
                </CardTitle>
                <CardDescription>
                  Linked to{" "}
                  {review.product ? (
                    <Link
                      to={`/products/${review.product.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {review.product.name}
                    </Link>
                  ) : (
                    `product #${review.productId}`
                  )}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {review.comment ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {review.comment}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No comment.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Images</CardTitle>
              <CardDescription>
                {images.length > 0
                  ? `${images.length} photo${images.length === 1 ? "" : "s"}`
                  : "No images attached"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {images.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((image) => (
                    <figure
                      key={image.id ?? image.url}
                      className="overflow-hidden rounded-xl border bg-muted/20"
                    >
                      <img
                        src={image.url}
                        alt={image.altText || review.displayName}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      {image.altText ? (
                        <figcaption className="border-t px-3 py-2 text-xs text-muted-foreground">
                          {image.altText}
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                  Add photos from Edit to show this review with visuals.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Display name</p>
                <p className="mt-1 font-medium">{review.displayName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="mt-1">{review.location || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sort order</p>
                <p className="mt-1 tabular-nums">{review.sortOrder}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-1">{formatDate(review.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="mt-1">{formatDate(review.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {canUpdate ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick actions</CardTitle>
                <CardDescription>
                  Toggle storefront visibility without opening the editor.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={pendingAction !== null}
                  onClick={() =>
                    toggleActiveMutation.mutate(!review.isActive)
                  }
                >
                  {review.isActive ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                  {review.isActive ? "Hide review" : "Show review"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={pendingAction !== null}
                  onClick={() =>
                    toggleHomeMutation.mutate(!review.showOnHome)
                  }
                >
                  <Home className="size-4" />
                  {review.showOnHome ? "Remove from home" : "Show on home"}
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <AdminReviewFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={review}
        loading={updateMutation.isPending}
        onSubmit={(payload) =>
          updateMutation.mutateAsync(payload as UpdateAdminReviewPayload)
        }
      />

      <ConfirmDialog
        open={pendingDelete}
        onOpenChange={setPendingDelete}
        title="Delete admin review"
        description="This permanently removes the review and its images."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutateAsync()}
      />
    </div>
  );
}
