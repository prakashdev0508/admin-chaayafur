import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { StarRating } from "@/components/reviews/StarRating";
import { formatDate, formatPhone } from "@/lib/format";
import type { OrderReview, ProductReview, ReviewKind } from "@/types/review";

export type ReviewRowActions = {
  canModerate: boolean;
  onToggleVisibility: (review: ProductReview | OrderReview) => void;
};

export function createReviewColumns(
  kind: ReviewKind,
  actions: ReviewRowActions,
): ColumnDef<ProductReview | OrderReview>[] {
  const columns: ColumnDef<ProductReview | OrderReview>[] = [
    {
      id: "rating",
      header: "Rating",
      cell: ({ row }) => <StarRating value={row.original.rating} size="sm" />,
    },
    {
      accessorKey: "comment",
      header: "Comment",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-[280px] text-sm">
          {row.original.comment?.trim() || "—"}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original.customer;
        if (!customer) return "—";
        return (
          <Link
            to={`/customers/${customer.id}`}
            className="hover:underline"
          >
            {formatPhone(customer.phone)}
          </Link>
        );
      },
    },
  ];

  if (kind === "product") {
    columns.push({
      id: "product",
      header: "Product",
      cell: ({ row }) => {
        const review = row.original as ProductReview;
        if (review.product) {
          return (
            <Link
              to={`/products/${review.product.id}`}
              className="hover:underline"
            >
              {review.product.name}
            </Link>
          );
        }
        return review.productId ? (
          <Link to={`/products/${review.productId}`} className="hover:underline">
            Product #{review.productId}
          </Link>
        ) : (
          "—"
        );
      },
    });
  }

  columns.push(
    {
      id: "order",
      header: "Order",
      cell: ({ row }) => {
        const orderId =
          "orderId" in row.original ? row.original.orderId : null;
        const orderNumber = row.original.order?.orderNumber;
        if (!orderId) return "—";
        return (
          <Link to={`/orders/${orderId}`} className="hover:underline">
            {orderNumber ?? `Order #${orderId}`}
          </Link>
        );
      },
    },
    {
      id: "visibility",
      header: "Visibility",
      cell: ({ row }) => (
        <StatusBadge variant={row.original.isVisible ? "success" : "neutral"}>
          {row.original.isVisible ? "Visible" : "Hidden"}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) =>
        formatDate(row.getValue("createdAt"), {
          dateStyle: "medium",
          timeStyle: undefined,
        }),
    },
  );

  if (actions.canModerate) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const review = row.original;
        const nextVisible = !review.isVisible;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => actions.onToggleVisibility(review)}
          >
            {nextVisible ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
            {nextVisible ? "Show" : "Hide"}
          </Button>
        );
      },
    });
  }

  return columns;
}
