import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatCurrency,
  getActiveProductTags,
  getStockStatus,
  productTagLabels,
  productTagVariants,
} from "@/lib/product-utils";
import type { ProductListItem } from "@/types/product";

type ProductColumnsOptions = {
  canUpdate: boolean;
  onDeactivate: (product: ProductListItem) => void;
};

export function createProductColumns({
  canUpdate,
  onDeactivate,
}: ProductColumnsOptions): ColumnDef<ProductListItem>[] {
  return [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <Link
            to={`/products/${product.id}`}
            className="flex items-center gap-3 hover:opacity-80"
          >
            {product.primaryImage && (
              <img
                src={product.primaryImage.url}
                alt={product.primaryImage.altText}
                className="size-10 rounded-md object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.slug}</p>
              {(() => {
                const tags = getActiveProductTags(product);
                if (tags.length === 0) return null;
                return (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <StatusBadge key={tag} variant={productTagVariants[tag]}>
                        {productTagLabels[tag]}
                      </StatusBadge>
                    ))}
                  </div>
                );
              })()}
            </div>
          </Link>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.subCategory.category.name} /{" "}
          {row.original.subCategory.name}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => formatCurrency(row.getValue("price")),
    },
    {
      accessorKey: "stock",
      header: "Stock",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getStockStatus(row.original);
        const labels = {
          in_stock: "In stock",
          low_stock: "Low stock",
          out_of_stock: "Out of stock",
          inactive: "Inactive",
        };
        const variants = {
          in_stock: "success" as const,
          low_stock: "warning" as const,
          out_of_stock: "danger" as const,
          inactive: "neutral" as const,
        };
        return (
          <StatusBadge variant={variants[status]}>{labels[status]}</StatusBadge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                render={
                  <Link to={`/products/${product.id}`}>
                    <Eye className="size-4" />
                    View
                  </Link>
                }
              />
              {canUpdate && (
                <>
                  <DropdownMenuItem
                    render={
                      <Link to={`/products/${product.id}/edit`}>
                        <Pencil className="size-4" />
                        Edit
                      </Link>
                    }
                  />
                  {product.isActive && (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDeactivate(product)}
                    >
                      Deactivate
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
