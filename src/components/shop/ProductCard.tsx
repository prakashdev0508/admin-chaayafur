import { Link } from "react-router-dom";
import type { ProductListItem } from "@/types/product";
import { formatCurrency } from "@/lib/format";
import { getStockStatus } from "@/lib/product-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  const stockStatus = getStockStatus(product);
  const imageUrl = product.primaryImage?.url;

  return (
    <Link to={`/shop/products/${product.id}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-[#E8DFD3] bg-white py-0 shadow-none transition hover:border-[#C9B59A]">
        <div className="aspect-[4/5] overflow-hidden bg-[#F3EBE0]">
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
