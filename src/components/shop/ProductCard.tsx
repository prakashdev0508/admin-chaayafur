import { Link } from "react-router-dom";
import type { ProductListItem } from "@/types/product";
import { formatCurrency } from "@/lib/format";
import {
  getActiveProductTags,
  getStockStatus,
  productTagLabels,
} from "@/lib/product-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  const stockStatus = getStockStatus(product);
  const imageUrl = product.primaryImage?.url;
  const tags = getActiveProductTags(product);

  return (
    <Link to={`/shop/products/${product.id}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-[#E8DFD3] bg-white py-0 shadow-none transition hover:border-[#C9B59A]">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#F3EBE0]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.primaryImage?.altText || product.name}
              className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
          {tags.length > 0 && (
            <div className="absolute top-2 left-2 flex max-w-[85%] flex-wrap gap-1">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-[#8B5E3C] shadow-sm"
                >
                  {productTagLabels[tag]}
                </span>
              ))}
            </div>
          )}
        </div>
        <CardContent className="space-y-2 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {product.subCategory.category.name}
              </p>
              <h3 className="font-medium text-[#3D2B1F]">{product.name}</h3>
            </div>
            {stockStatus !== "in_stock" && (
              <Badge variant="secondary" className="shrink-0">
                {stockStatus === "out_of_stock" ? "Sold out" : "Unavailable"}
              </Badge>
            )}
          </div>
          <p className="text-lg font-semibold text-[#8B5E3C]">
            {formatCurrency(product.price)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
