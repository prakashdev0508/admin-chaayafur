import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Star } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/reviews/StarRating";
import { ReviewFormDialog } from "@/components/reviews/ReviewFormDialog";
import { OTPLoginDialog } from "@/components/shop/OTPLoginDialog";
import { getProduct } from "@/services/products.service";
import {
  createProductReview,
  getMyReviews,
  listProductReviews,
} from "@/services/reviews.service";
import {
  getShopOrder,
  listShopOrders,
} from "@/services/shop-orders.service";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getActiveProductTags,
  getStockStatus,
  productTagLabels,
} from "@/lib/product-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ProductReview } from "@/types/review";
import type { Order } from "@/types/order";

async function resolveProductReviewEligibility(productId: number): Promise<{
  existing: ProductReview | undefined;
  orderId: number | null;
}> {
  const [myReviews, delivered] = await Promise.all([
    getMyReviews(),
    listShopOrders({ status: "DELIVERED", limit: 50 }),
  ]);

  const existing = myReviews.productReviews.find(
    (review) => review.productId === productId,
  );

  if (existing?.orderId) {
    return { existing, orderId: existing.orderId };
  }

  for (const summary of delivered.items) {
    const order: Order =
      Array.isArray(summary.items) && summary.items.length > 0
        ? summary
        : await getShopOrder(summary.id);

    if (order.items.some((item) => item.productId === productId)) {
      return { existing, orderId: order.id };
    }
  }

  return { existing, orderId: null };
}

export function ShopProductPage() {
  const { id } = useParams();
  const productId = Number(id);
  const queryClient = useQueryClient();
  const { addItem } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const [quantity, setQuantity] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const productQuery = useQuery({
    queryKey: queryKeys.shop.products.detail(productId),
    queryFn: () => getProduct(productId),
    enabled: Number.isFinite(productId),
  });

  const reviewsQuery = useQuery({
    queryKey: queryKeys.shop.reviews.product(productId, {
      page: reviewsPage,
      limit: 5,
    }),
    queryFn: () =>
      listProductReviews(productId, { page: reviewsPage, limit: 5 }),
    enabled: Number.isFinite(productId),
  });

  const eligibilityQuery = useQuery({
    queryKey: [...queryKeys.shop.reviews.mine, "eligibility", productId],
    queryFn: () => resolveProductReviewEligibility(productId),
    enabled: isAuthenticated && Number.isFinite(productId),
  });

  const reviewMutation = useMutation({
    mutationFn: createProductReview,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shop.reviews.mine,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shop.reviews.product(productId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.shop.products.detail(productId),
      });
      toast.success("Review saved");
    },
  });

  const product = productQuery.data;
  const stockStatus = product ? getStockStatus(product) : null;
  const activeTags = product ? getActiveProductTags(product) : [];
  const canPurchase = stockStatus === "in_stock" || stockStatus === "low_stock";
  const sortedImages = [...(product?.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const primaryImage = sortedImages[0];
  const ratingAverage =
    product?.ratingAverage ?? reviewsQuery.data?.meta.ratingAverage ?? null;
  const reviewCount =
    product?.reviewCount ?? reviewsQuery.data?.meta.reviewCount ?? 0;

  const existingReview = eligibilityQuery.data?.existing;
  const eligibleOrderId = eligibilityQuery.data?.orderId ?? null;
  const canWriteReview = Boolean(isAuthenticated && eligibleOrderId);

  if (productQuery.isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E8DFD3] p-10 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Link
          to="/shop/products"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
        >
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-3xl bg-[#F3EBE0]">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.altText || product.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>
          {sortedImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {sortedImages.map((image) => (
                <div
                  key={image.url}
                  className="aspect-square overflow-hidden rounded-xl bg-[#F3EBE0]"
                >
                  <img
                    src={image.url}
                    alt={image.altText || product.name}
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
              {product.subCategory.category.name} · {product.subCategory.name}
            </p>
            <h1 className="mt-2 text-4xl font-medium text-[#3D2B1F]">
              {product.name}
            </h1>
            {activeTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {activeTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-[#F8F1E8] px-2 py-0.5 text-xs font-medium text-[#8B5E3C]"
                  >
                    {productTagLabels[tag]}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {ratingAverage != null ? (
                <>
                  <StarRating value={ratingAverage} size="sm" />
                  <span className="text-sm text-muted-foreground">
                    {ratingAverage.toFixed(1)} · {reviewCount} review
                    {reviewCount === 1 ? "" : "s"}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No reviews yet
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-semibold text-[#8B5E3C]">
              {formatCurrency(product.price)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {canPurchase
                ? `${product.stock} in stock`
                : "Currently unavailable"}
            </p>
          </div>

          {product.description && (
            <p className="leading-7 text-muted-foreground">
              {product.description}
            </p>
          )}

          {product.productFeatures.length > 0 && (
            <ul className="space-y-2 text-sm text-[#3D2B1F]">
              {product.productFeatures.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-[#8B5E3C]">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-[#E8DFD3] bg-white">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={quantity <= 1}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="min-w-8 text-center text-sm font-medium">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={quantity >= product.stock}
                onClick={() =>
                  setQuantity((value) => Math.min(product.stock, value + 1))
                }
              >
                <Plus className="size-4" />
              </Button>
            </div>

            <Button
              className="flex-1 bg-[#8B5E3C] hover:bg-[#744C31]"
              disabled={!canPurchase}
              onClick={() => {
                void (async () => {
                  try {
                    await addItem(
                      {
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        slug: product.slug,
                        imageUrl: primaryImage?.url,
                      },
                      quantity,
                    );
                    toast.success("Added to cart");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Could not add to cart",
                    );
                  }
                })();
              }}
            >
              Add to cart
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-medium text-[#3D2B1F]">Reviews</h2>
            <p className="text-sm text-muted-foreground">
              From customers who purchased this product
            </p>
          </div>

          {!isAuthenticated ? (
            <Button variant="outline" onClick={() => setLoginOpen(true)}>
              <Star className="size-4" />
              Sign in to review
            </Button>
          ) : eligibilityQuery.isLoading ? (
            <Button variant="outline" disabled>
              Checking eligibility...
            </Button>
          ) : canWriteReview ? (
            <Button variant="outline" onClick={() => setReviewOpen(true)}>
              <Star className="size-4" />
              {existingReview ? "Edit your review" : "Write a review"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Available after a delivered purchase of this product
            </p>
          )}
        </div>

        {isAuthenticated && existingReview && (
          <div className="rounded-2xl border border-[#C9B59A] bg-[#F8F1E8] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-[#3D2B1F]">Your review</p>
              <StarRating value={existingReview.rating} size="sm" />
            </div>
            {existingReview.comment && (
              <p className="mt-2 text-sm leading-relaxed text-[#3D2B1F]">
                {existingReview.comment}
              </p>
            )}
          </div>
        )}

        {reviewsQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : (reviewsQuery.data?.items.length ?? 0) === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E8DFD3] p-6 text-sm text-muted-foreground">
            No reviews yet for this product.
          </p>
        ) : (
          <div className="space-y-3">
            {reviewsQuery.data?.items.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-[#E8DFD3] bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StarRating value={review.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.createdAt, {
                      dateStyle: "medium",
                      timeStyle: undefined,
                    })}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-[#3D2B1F]">
                    {review.comment}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {review.customer.phone}
                </p>
              </article>
            ))}

            {(reviewsQuery.data?.meta.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewsPage <= 1}
                  onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {reviewsPage} of {reviewsQuery.data?.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    reviewsPage >= (reviewsQuery.data?.meta.totalPages ?? 1)
                  }
                  onClick={() => setReviewsPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      <ReviewFormDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title={`Review ${product.name}`}
        description="Reviews are only for products from your delivered orders."
        initialRating={existingReview?.rating ?? 0}
        initialComment={existingReview?.comment}
        loading={reviewMutation.isPending}
        confirmLabel={existingReview ? "Update review" : "Submit review"}
        onSubmit={async ({ rating, comment }) => {
          if (!eligibleOrderId) {
            throw new Error("No delivered order found for this product");
          }
          await reviewMutation.mutateAsync({
            orderId: eligibleOrderId,
            productId: product.id,
            rating,
            comment,
          });
        }}
      />

      <OTPLoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={() => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.shop.reviews.mine,
          });
        }}
      />
    </div>
  );
}
