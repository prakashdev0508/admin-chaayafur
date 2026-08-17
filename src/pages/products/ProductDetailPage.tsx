import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { StarRating } from "@/components/reviews/StarRating";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";
import { ApiError } from "@/lib/api";
import {
  formatCurrency,
  getActiveProductTags,
  getStockStatus,
  productTagLabels,
} from "@/lib/product-utils";
import {
  computeCustomizationUnitPrice,
  parseMoney,
} from "@/lib/customization-pricing";
import { cn } from "@/lib/utils";
import { getAdminProduct } from "@/services/products.service";
import { ProductDetailSkeleton } from "@/components/products/ProductPageSkeletons";
import { ProductStorefrontQr } from "@/components/products/ProductStorefrontQr";
import { ProductCustomizationGroupPickers } from "@/components/shared/ProductCustomizationGroupPickers";
import {
  maxCustomizationGroupPrices,
  resolveSelectedCustomization,
} from "@/lib/product-customization";
import type { Product } from "@/types/product";

const stockLabels = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  inactive: "Inactive",
};

const stockVariants = {
  in_stock: "success" as const,
  low_stock: "warning" as const,
  out_of_stock: "danger" as const,
  inactive: "neutral" as const,
};

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_PRODUCTS);
  const canView = hasPermission(PERMISSIONS.VIEW_PRODUCTS);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [customizationSelection, setCustomizationSelection] = useState<
    Record<string, string>
  >({});

  const productId = Number(id);

  useEffect(() => {
    if (!productId || Number.isNaN(productId)) {
      setError("Invalid product ID");
      setIsLoading(false);
      return;
    }

    if (!canView) {
      setError("You do not have permission to view products");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getAdminProduct(productId)
      .then((data) => {
        setProduct(data);
        setActiveImageIndex(0);
        setCustomizationSelection({});
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load product",
        );
      })
      .finally(() => setIsLoading(false));
  }, [productId, canView]);

  const sortedImages = useMemo(
    () =>
      [...(product?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [product?.images],
  );

  const activeImage = sortedImages[activeImageIndex] ?? sortedImages[0];

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <PageHeader title="Product not found" />
        <p className="text-destructive">{error ?? "Product not found"}</p>
        <Button
          variant="outline"
          render={<Link to="/products">Back to products</Link>}
        />
      </div>
    );
  }

  const stockStatus = getStockStatus(product);
  const activeTags = getActiveProductTags(product);
  const selectedCustomization = resolveSelectedCustomization(
    product.customization,
    customizationSelection,
  );
  const mrp = product.priceWithoutDiscount
    ? parseMoney(product.priceWithoutDiscount)
    : null;
  const unitPrice = computeCustomizationUnitPrice(product.price, {
    customization: selectedCustomization,
  });
  const showMrp = mrp != null && mrp > unitPrice;
  const ratingAverage = product.ratingAverage ?? null;
  const reviewCount = product.reviewCount ?? 0;
  const priceCeiling =
    parseMoney(product.price) +
    maxCustomizationGroupPrices(product.customization);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Product preview"
        description="How this item appears to customers, plus admin status"
        action={
          <div className="flex items-center gap-2">
            {canUpdate && (
              <Button
                render={
                  <Link to={`/products/${product.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                }
              />
            )}
            <Button
              variant="outline"
              render={
                <Link to="/products">
                  <ArrowLeft className="size-4" />
                  Back
                </Link>
              }
            />
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        {/* Gallery — storefront style */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl border bg-muted/30">
            {activeImage ? (
              <img
                src={activeImage.url}
                alt={activeImage.altText || product.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                No image available
              </div>
            )}
          </div>
          {sortedImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id ?? image.url}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={cn(
                    "aspect-square overflow-hidden rounded-xl border bg-muted/20 transition-shadow",
                    index === activeImageIndex
                      ? "ring-2 ring-foreground/80 ring-offset-2"
                      : "hover:border-foreground/20",
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
          {activeImage?.altText && (
            <p className="text-xs text-muted-foreground">{activeImage.altText}</p>
          )}

          <ProductStorefrontQr slug={product.slug} productName={product.name} />

          <div className="rounded-xl border bg-muted/20 p-4 text-sm">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Admin details
            </p>
            <dl className="grid gap-2 sm:grid-cols-2">
              <MetaRow label="Product ID" value={String(product.id)} />
              <MetaRow
                label="Selling price"
                value={formatCurrency(product.price)}
              />
              {product.priceWithoutDiscount && (
                <MetaRow
                  label="MRP"
                  value={formatCurrency(product.priceWithoutDiscount)}
                />
              )}
              <MetaRow label="Stock" value={`${product.stock} units`} />
              {product.hsnCode && (
                <MetaRow label="HSN code" value={product.hsnCode} />
              )}
              <MetaRow
                label="Images"
                value={String(sortedImages.length)}
              />
              <MetaRow
                label="Option groups"
                value={String(
                  new Set(
                    (product.customization ?? []).map((o) => o.groupName),
                  ).size,
                )}
              />
              <MetaRow
                label="Created"
                value={new Date(product.createdAt).toLocaleString("en-IN")}
              />
              <MetaRow
                label="Updated"
                value={new Date(product.updatedAt).toLocaleString("en-IN")}
              />
            </dl>
          </div>
        </div>

        {/* Details — storefront style + admin cues */}
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {product.subCategory.category.name} · {product.subCategory.name}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {product.slug}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge variant={stockVariants[stockStatus]}>
                {stockLabels[stockStatus]}
              </StatusBadge>
              <StatusBadge variant={product.isActive ? "success" : "neutral"}>
                {product.isActive ? "Active" : "Inactive"}
              </StatusBadge>
              {activeTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs font-medium"
                >
                  {productTagLabels[tag]}
                </span>
              ))}
            </div>

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

            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <p className="text-3xl font-semibold tabular-nums">
                {formatCurrency(unitPrice)}
              </p>
              {showMrp && (
                <p className="text-base text-muted-foreground line-through tabular-nums">
                  {formatCurrency(mrp)}
                </p>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.stock} in stock
              {priceCeiling > parseMoney(product.price) && (
                <>
                  {" "}
                  · options up to{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {formatCurrency(priceCeiling)}
                  </span>
                </>
              )}
            </p>
            {selectedCustomization.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Preview includes selected customizations
              </p>
            )}
          </div>

          {product.description && (
            <p className="leading-7 text-muted-foreground">
              {product.description}
            </p>
          )}

          {product.productFeatures.length > 0 && (
            <ul className="space-y-2 text-sm">
              {product.productFeatures.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}

          <ProductCustomizationGroupPickers
            options={product.customization}
            selection={customizationSelection}
            onChange={setCustomizationSelection}
          />
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
