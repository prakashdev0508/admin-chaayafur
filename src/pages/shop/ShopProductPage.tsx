import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Star } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/reviews/StarRating";
import { ReviewFormDialog } from "@/components/reviews/ReviewFormDialog";
import { OTPLoginDialog } from "@/components/shop/OTPLoginDialog";
import { ProductDescription } from "@/components/shop/ProductDescription";
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
  computeCustomizationUnitPrice,
  formatPriceAdjustment,
  formatUnitPriceAmount,
} from "@/lib/customization-pricing";
import {
  getActiveProductTags,
  getStockStatus,
  productTagLabels,
} from "@/lib/product-utils";
import { getSelectableProductWoods } from "@/types/wood";
import { getSelectableProductFabrics } from "@/types/fabric";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ProductReview } from "@/types/review";
import type { Order } from "@/types/order";
import type { ProductPolish } from "@/types/wood";
import type { CartItem } from "@/types/cart";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addItem } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedWoodId, setSelectedWoodId] = useState<number | null>(null);
  const [selectedPolishId, setSelectedPolishId] = useState<number | null>(null);
  const [selectedFabricId, setSelectedFabricId] = useState<number | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adding, setAdding] = useState(false);

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
  const productWoods = product?.woods ?? [];
  const selectableWoods = getSelectableProductWoods(productWoods);
  const showWoodSection = productWoods.length > 0;
  const selectedWood = selectableWoods.find((w) => w.id === selectedWoodId);
  const woodPolishes = (selectedWood?.polishes ?? []).filter(
    (p: ProductPolish) => p.isAvailable !== false,
  );
  const selectedPolish =
    woodPolishes.find((p) => p.id === selectedPolishId) ?? null;
  const productFabrics = product?.fabrics ?? [];
  const selectableFabrics = getSelectableProductFabrics(productFabrics);
  const showFabricSection = productFabrics.length > 0;
  const selectedFabric =
    selectableFabrics.find((f) => f.id === selectedFabricId) ?? null;
  const canPurchase = stockStatus === "in_stock" || stockStatus === "low_stock";
  const sortedImages = [...(product?.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const activeImage = sortedImages[activeImageIndex] ?? sortedImages[0];
  const mrp = product?.priceWithoutDiscount
    ? parseFloat(product.priceWithoutDiscount)
    : null;
  const unitPrice = product
    ? computeCustomizationUnitPrice(product.price, {
        wood: selectedWood,
        polish: selectedPolish,
        fabric: selectedFabric,
      })
    : 0;
  const showMrp = mrp != null && !Number.isNaN(mrp) && mrp > unitPrice;
  const ratingAverage =
    product?.ratingAverage ?? reviewsQuery.data?.meta.ratingAverage ?? null;
  const reviewCount =
    product?.reviewCount ?? reviewsQuery.data?.meta.reviewCount ?? 0;

  const existingReview = eligibilityQuery.data?.existing;
  const eligibleOrderId = eligibilityQuery.data?.orderId ?? null;
  const canWriteReview = Boolean(isAuthenticated && eligibleOrderId);

  async function buildCartLine(): Promise<Omit<CartItem, "quantity"> | null> {
    if (!product) return null;
    const wood = selectableWoods.find((w) => w.id === selectedWoodId);
    const polish =
      woodPolishes.find((p) => p.id === selectedPolishId) ?? null;
    const fabric =
      selectableFabrics.find((f) => f.id === selectedFabricId) ?? null;
    const computed = computeCustomizationUnitPrice(product.price, {
      wood,
      polish,
      fabric,
    });
    return {
      productId: product.id,
      name: product.name,
      price: formatUnitPriceAmount(computed),
      slug: product.slug,
      imageUrl: sortedImages[0]?.url,
      basePrice: product.price,
      ...(wood
        ? {
            woodId: wood.id,
            woodName: wood.name,
            woodColor: wood.color,
            woodPriceAdjustment: wood.priceAdjustment ?? "0",
          }
        : {}),
      ...(polish
        ? {
            polishId: polish.id,
            polishName: polish.name,
            polishColor: polish.color,
            polishPriceAdjustment: polish.priceAdjustment ?? "0",
          }
        : {}),
      ...(fabric
        ? {
            fabricId: fabric.id,
            fabricName: fabric.name,
            fabricColor: fabric.color,
            fabricPriceAdjustment: fabric.priceAdjustment ?? "0",
          }
        : {}),
    };
  }

  async function handleAddToCart(thenCheckout = false) {
    if (!canPurchase || adding) return;
    setAdding(true);
    try {
      const line = await buildCartLine();
      if (!line) return;
      await addItem(line, quantity);
      toast.success(thenCheckout ? "Added — continue to checkout" : "Added to cart");
      if (thenCheckout) {
        navigate(isAuthenticated ? "/shop/checkout" : "/shop/cart?login=1");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add to cart",
      );
    } finally {
      setAdding(false);
    }
  }

  if (productQuery.isLoading) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <Skeleton className="aspect-square rounded-[2rem]" />
          <div className="flex gap-3">
            <Skeleton className="size-20 rounded-2xl" />
            <Skeleton className="size-20 rounded-2xl" />
            <Skeleton className="size-20 rounded-2xl" />
          </div>
        </div>
        <div className="space-y-5 py-2">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-12 w-full" />
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

  const featurePreview = product.productFeatures.slice(0, 4);

  return (
    <div className="space-y-16">
      <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#F4EEE6]">
            <div className="aspect-square">
              {activeImage ? (
                <img
                  src={activeImage.url}
                  alt={activeImage.altText || product.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  No image available
                </div>
              )}
            </div>
          </div>

          {sortedImages.length > 1 && (
            <div className="flex flex-wrap gap-3">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id ?? image.url}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={cn(
                    "size-20 overflow-hidden rounded-2xl border-2 bg-[#F4EEE6] transition-shadow sm:size-24",
                    index === activeImageIndex
                      ? "border-[#3D2B1F] shadow-sm"
                      : "border-transparent opacity-80 hover:opacity-100",
                  )}
                >
                  <img
                    src={image.url}
                    alt={image.altText || product.name}
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-7 lg:pt-2">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#9A8B7A] uppercase">
              {product.subCategory.category.name}
              <span className="mx-1.5 text-[#D9CBB8]">·</span>
              {product.subCategory.name}
            </p>
            <h1 className="mt-3 text-[2rem] leading-tight font-semibold tracking-tight text-[#1F1610] sm:text-[2.5rem]">
              {product.name}
            </h1>

            {activeTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {activeTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#F4EEE6] px-2.5 py-0.5 text-[11px] font-medium text-[#8B5E3C]"
                  >
                    {productTagLabels[tag]}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#6B5C4F]">
              {ratingAverage != null ? (
                <>
                  <Star className="size-4 fill-[#C47A3A] text-[#C47A3A]" />
                  <span className="font-medium text-[#1F1610]">
                    {ratingAverage.toFixed(1)}
                    <span className="font-normal text-[#9A8B7A]">/5</span>
                  </span>
                  <span className="text-[#D9CBB8]">·</span>
                  <span>
                    {reviewCount} review{reviewCount === 1 ? "" : "s"}
                  </span>
                </>
              ) : (
                <span>No reviews yet</span>
              )}
            </div>
          </div>

          {showWoodSection && (
            <OptionSwatches
              label="Wood"
              optional
              clearable={selectedWoodId != null}
              onClear={() => {
                setSelectedWoodId(null);
                setSelectedPolishId(null);
              }}
            >
              {productWoods.map((wood) => {
                const available = wood.isAvailable;
                const selected = selectedWoodId === wood.id;
                return (
                  <SwatchButton
                    key={wood.id}
                    name={wood.name}
                    color={wood.color}
                    selected={selected}
                    disabled={!available}
                    adjustment={formatPriceAdjustment(wood.priceAdjustment)}
                    onClick={() => {
                      if (!available) return;
                      setSelectedWoodId(wood.id);
                      setSelectedPolishId(null);
                    }}
                  />
                );
              })}
            </OptionSwatches>
          )}

          {woodPolishes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#1F1610]">
                  Polish
                  <span className="ml-1 font-normal text-[#9A8B7A]">
                    (optional)
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {woodPolishes.map((polish) => {
                  const selected = selectedPolishId === polish.id;
                  return (
                    <button
                      key={polish.id}
                      type="button"
                      onClick={() =>
                        setSelectedPolishId(selected ? null : polish.id)
                      }
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        selected
                          ? "border-[#1F1610] bg-[#1F1610] text-white"
                          : "border-[#E8DFD3] bg-white text-[#6B5C4F] hover:border-[#C9B59A]",
                      )}
                    >
                      <span
                        className="size-3 rounded-full border border-black/10"
                        style={{ backgroundColor: polish.color }}
                        aria-hidden
                      />
                      {polish.name}
                      {formatPriceAdjustment(polish.priceAdjustment) && (
                        <span
                          className={cn(
                            "text-xs",
                            selected ? "text-white/70" : "text-[#9A8B7A]",
                          )}
                        >
                          {formatPriceAdjustment(polish.priceAdjustment)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showFabricSection && (
            <OptionSwatches
              label="Fabric"
              optional
              clearable={selectedFabricId != null}
              onClear={() => setSelectedFabricId(null)}
            >
              {productFabrics.map((fabric) => {
                const available = fabric.isAvailable;
                const selected = selectedFabricId === fabric.id;
                return (
                  <SwatchButton
                    key={fabric.id}
                    name={fabric.name}
                    color={fabric.color}
                    selected={selected}
                    disabled={!available}
                    adjustment={formatPriceAdjustment(fabric.priceAdjustment)}
                    onClick={() => {
                      if (!available) return;
                      setSelectedFabricId(selected ? null : fabric.id);
                    }}
                  />
                );
              })}
            </OptionSwatches>
          )}

          {product.description && (
            <ProductDescription description={product.description} />
          )}

          {featurePreview.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-[#E8DFD3]">
              <div
                className={cn(
                  "grid divide-x divide-[#E8DFD3]",
                  featurePreview.length === 1 && "grid-cols-1",
                  featurePreview.length === 2 && "grid-cols-2",
                  featurePreview.length === 3 && "grid-cols-3",
                  featurePreview.length >= 4 && "grid-cols-2 sm:grid-cols-4",
                )}
              >
                {featurePreview.map((feature) => (
                  <div key={feature} className="px-4 py-3">
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-[#9A8B7A] uppercase">
                      Feature
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#1F1610]">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              <p className="text-3xl font-semibold tracking-tight text-[#1F1610] tabular-nums">
                {formatCurrency(unitPrice)}
              </p>
              {showMrp && (
                <p className="text-lg text-[#9A8B7A] line-through tabular-nums">
                  {formatCurrency(product.priceWithoutDiscount!)}
                </p>
              )}
            </div>
            <p className="mt-1.5 text-sm text-[#9A8B7A]">
              {canPurchase
                ? `${product.stock} in stock`
                : "Currently unavailable"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex h-12 items-center rounded-full border border-[#E8DFD3] bg-white px-1">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                className="flex size-10 items-center justify-center rounded-full text-[#1F1610] transition-colors hover:bg-[#F4EEE6] disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                disabled={quantity >= product.stock}
                onClick={() =>
                  setQuantity((v) => Math.min(product.stock, v + 1))
                }
                className="flex size-10 items-center justify-center rounded-full bg-[#1F1610] text-white transition-transform active:scale-95 disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <div className="flex flex-1 gap-2">
              <Button
                variant="outline"
                disabled={!canPurchase || adding}
                onClick={() => void handleAddToCart(false)}
                className="h-12 flex-1 rounded-full border-[#1F1610]/20 text-[#1F1610] hover:bg-[#F4EEE6]"
              >
                Add to cart
              </Button>
              <Button
                disabled={!canPurchase || adding}
                onClick={() => void handleAddToCart(true)}
                className="h-12 flex-1 rounded-full bg-[#1F1610] text-white hover:bg-[#3D2B1F]"
              >
                Buy now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="space-y-5 border-t border-[#E8DFD3] pt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1F1610]">Reviews</h2>
            <p className="mt-1 text-sm text-[#9A8B7A]">
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
            <p className="text-sm text-[#9A8B7A]">
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
          <p className="rounded-2xl border border-dashed border-[#E8DFD3] p-6 text-sm text-[#9A8B7A]">
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
                  <span className="text-xs text-[#9A8B7A]">
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
                <p className="mt-2 text-xs text-[#9A8B7A]">
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
                <span className="text-sm text-[#9A8B7A]">
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

function OptionSwatches({
  label,
  optional,
  clearable,
  onClear,
  children,
}: {
  label: string;
  optional?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#1F1610]">
          {label}
          {optional && (
            <span className="ml-1 font-normal text-[#9A8B7A]">(optional)</span>
          )}
        </p>
        {clearable && onClear && (
          <button
            type="button"
            className="text-xs text-[#9A8B7A] underline-offset-2 hover:underline"
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-4">{children}</div>
    </div>
  );
}

function SwatchButton({
  name,
  color,
  selected,
  disabled,
  adjustment,
  onClick,
}: {
  name: string;
  color: string;
  selected: boolean;
  disabled?: boolean;
  adjustment?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={
        disabled
          ? `${name} — not available`
          : adjustment
            ? `${name} (${adjustment})`
            : name
      }
      className={cn(
        "group flex flex-col items-center gap-2 transition-transform active:scale-[0.97]",
        disabled && "cursor-not-allowed opacity-40",
      )}
      aria-pressed={selected}
      aria-disabled={disabled}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full border-2 transition-shadow",
          selected
            ? "border-[#1F1610] shadow-[0_0_0_3px_rgba(31,22,16,0.12)]"
            : "border-transparent group-hover:border-[#D9CBB8]",
        )}
      >
        <span
          className="size-8 rounded-full border border-black/10 shadow-inner"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      </span>
      <span className="max-w-18 text-center text-[11px] leading-tight text-[#6B5C4F]">
        <span className="block truncate font-medium text-[#1F1610]">{name}</span>
        {adjustment && (
          <span className="text-[#9A8B7A]">{adjustment}</span>
        )}
      </span>
    </button>
  );
}
