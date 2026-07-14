import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProduct } from "@/services/products.service";
import { queryKeys } from "@/lib/query-keys";
import { formatCurrency } from "@/lib/format";
import {
  getActiveProductTags,
  getStockStatus,
  productTagLabels,
} from "@/lib/product-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ShopProductPage() {
  const { id } = useParams();
  const productId = Number(id);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const productQuery = useQuery({
    queryKey: queryKeys.shop.products.detail(productId),
    queryFn: () => getProduct(productId),
    enabled: Number.isFinite(productId),
  });

  const product = productQuery.data;
  const stockStatus = product ? getStockStatus(product) : null;
  const activeTags = product ? getActiveProductTags(product) : [];
  const canPurchase = stockStatus === "in_stock" || stockStatus === "low_stock";
  const sortedImages = [...(product?.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const primaryImage = sortedImages[0];

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
              <div key={image.url} className="aspect-square overflow-hidden rounded-xl bg-[#F3EBE0]">
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
          <h1 className="mt-2 text-4xl font-medium text-[#3D2B1F]">{product.name}</h1>
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
          <p className="mt-3 text-2xl font-semibold text-[#8B5E3C]">
            {formatCurrency(product.price)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {canPurchase ? `${product.stock} in stock` : "Currently unavailable"}
          </p>
        </div>

        {product.description && (
          <p className="leading-7 text-muted-foreground">{product.description}</p>
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
            <span className="min-w-8 text-center text-sm font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={quantity >= product.stock}
              onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <Button
            className="flex-1 bg-[#8B5E3C] hover:bg-[#744C31]"
            disabled={!canPurchase}
            onClick={() => {
              addItem(
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
            }}
          >
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
