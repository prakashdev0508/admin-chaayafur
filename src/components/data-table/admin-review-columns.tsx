import { type ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminReview } from "@/types/admin-review";

export function createAdminReviewColumns(): ColumnDef<AdminReview>[] {
  return [
    {
      id: "review",
      header: "Review",
      cell: ({ row }) => {
        const review = row.original;
        const thumb = review.images?.[0];
        return (
          <Link
            to={`/content/admin-reviews/${review.id}`}
            className="flex min-w-[200px] items-center gap-3"
          >
            {thumb?.url ? (
              <img
                src={thumb.url}
                alt=""
                className="size-11 shrink-0 rounded-md border object-cover"
              />
            ) : (
              <div className="flex size-11 shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                {review.rating}★
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium hover:underline">
                {review.displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {review.location || "No location"}
                {review.comment ? ` · ${review.comment}` : ""}
              </p>
            </div>
          </Link>
        );
      },
    },
    {
      id: "product",
      header: "Product",
      cell: ({ row }) => {
        const product = row.original.product;
        if (!product) {
          return (
            <span className="text-muted-foreground">
              #{row.original.productId}
            </span>
          );
        }
        return (
          <span className="line-clamp-2 max-w-[200px] text-sm">
            {product.name}
          </span>
        );
      },
    },
    {
      id: "rating",
      header: "Rating",
      cell: ({ row }) => (
        <StarRating value={row.original.rating} size="sm" />
      ),
    },
    {
      id: "flags",
      header: "Visibility",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge
            variant={row.original.isActive ? "success" : "neutral"}
          >
            {row.original.isActive ? "Active" : "Hidden"}
          </StatusBadge>
          {row.original.showOnHome ? (
            <StatusBadge variant="brand">Home</StatusBadge>
          ) : null}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            render={
              <Link to={`/content/admin-reviews/${row.original.id}`}>
                View
                <ArrowRight className="size-3.5" />
              </Link>
            }
          />
        </div>
      ),
    },
  ];
}
