import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";
import { ApiError } from "@/lib/api";
import {
  formatCurrency,
  getActiveProductTags,
  getStockStatus,
  productTagLabels,
  productTagVariants,
} from "@/lib/product-utils";
import { getProductDetail } from "@/services/products.service";
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

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productId = Number(id);

  useEffect(() => {
    if (!productId || Number.isNaN(productId)) {
      setError("Invalid product ID");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getProductDetail(productId, canUpdate)
      .then(setProduct)
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load product",
        );
      })
      .finally(() => setIsLoading(false));
  }, [productId, canUpdate]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Product details" />
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Product not found" />
        <p className="text-destructive">{error ?? "Product not found"}</p>
        <Button variant="outline" render={<Link to="/products">Back to products</Link>} />
      </div>
    );
  }

  const stockStatus = getStockStatus(product);
  const activeTags = getActiveProductTags(product);
  const sortedImages = [...product.images].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={product.name}
        description={product.slug}
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
                  Back to products
                </Link>
              }
            />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {sortedImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>
                  {sortedImages.length} image{sortedImages.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {sortedImages.map((image) => (
                    <div
                      key={image.id ?? image.url}
                      className="overflow-hidden rounded-lg border"
                    >
                      <img
                        src={image.url}
                        alt={image.altText}
                        className="aspect-square w-full object-cover"
                      />
                      <div className="space-y-1 p-3 text-sm">
                        <p className="font-medium">{image.altText || "No alt text"}</p>
                        <p className="text-xs text-muted-foreground">
                          Sort order: {image.sortOrder}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {product.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {product.productFeatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {product.productFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Status</CardTitle>
                <StatusBadge variant={stockVariants[stockStatus]}>
                  {stockLabels[stockStatus]}
                </StatusBadge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visibility</span>
                <span>{product.isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock</span>
                <span>{product.stock} units</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold">{formatCurrency(product.price)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating</span>
                <span>
                  {product.ratingAverage != null
                    ? `${product.ratingAverage.toFixed(1)} / 5`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reviews</span>
                <span>{product.reviewCount ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          {activeTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Merchandising</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {activeTags.map((tag) => (
                    <StatusBadge key={tag} variant={productTagVariants[tag]}>
                      {productTagLabels[tag]}
                    </StatusBadge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parent</span>
                <span>{product.subCategory.category.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sub-category</span>
                <span>{product.subCategory.name}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product ID</span>
                <span>{product.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>
                  {new Date(product.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>
                  {new Date(product.updatedAt).toLocaleString("en-IN")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
