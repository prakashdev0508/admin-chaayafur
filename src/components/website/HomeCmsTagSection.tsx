import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { productTagLabels } from "@/lib/product-utils";
import { queryKeys } from "@/lib/query-keys";
import {
  listProducts,
  updateProductCmsTags,
} from "@/services/products.service";
import type { ProductListItem, ProductMerchandisingTag } from "@/types/product";

type HomeCmsTagSectionProps = {
  tag: ProductMerchandisingTag;
  description: string;
  canUpdate: boolean;
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function HomeCmsTagSection({
  tag,
  description,
  canUpdate,
}: HomeCmsTagSectionProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const taggedParams = useMemo(
    () => ({
      tag,
      isActive: true,
      limit: 24,
      page: 1,
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
    }),
    [tag],
  );

  const taggedQuery = useQuery({
    queryKey: queryKeys.products.list({ ...taggedParams, scope: "cms-home" }),
    queryFn: () => listProducts(taggedParams),
  });

  const searchQuery = useQuery({
    queryKey: queryKeys.products.list({
      name: debouncedSearch,
      limit: 8,
      scope: "cms-search",
    }),
    queryFn: () =>
      listProducts({
        name: debouncedSearch,
        limit: 8,
        page: 1,
      }),
    enabled: canUpdate && debouncedSearch.length >= 2,
  });

  const taggedItems = taggedQuery.data?.items ?? [];
  const taggedIds = useMemo(
    () => new Set(taggedItems.map((item) => item.id)),
    [taggedItems],
  );

  async function invalidateRelated() {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.invalidateQueries({ queryKey: queryKeys.shop.home });
  }

  const tagMutation = useMutation({
    mutationFn: ({
      productId,
      enabled,
    }: {
      productId: number;
      enabled: boolean;
    }) => updateProductCmsTags(productId, { [tag]: enabled }),
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.enabled
          ? `Added to ${productTagLabels[tag]}`
          : `Removed from ${productTagLabels[tag]}`,
      );
      setSearch("");
      await invalidateRelated();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update product tags",
      );
    },
  });

  const searchResults = (searchQuery.data?.items ?? []).filter(
    (item) => !taggedIds.has(item.id),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{productTagLabels[tag]}</CardTitle>
            <CardDescription className="mt-1.5">{description}</CardDescription>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {taggedQuery.data?.meta.total ?? taggedItems.length} products
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {canUpdate && (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search products to add to ${productTagLabels[tag].toLowerCase()}…`}
              className="pl-9"
            />
            {debouncedSearch.length >= 2 && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
                {searchQuery.isFetching ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Searching…
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-muted-foreground">
                    No matching products to add
                  </p>
                ) : (
                  <ul className="max-h-64 overflow-y-auto py-1">
                    {searchResults.map((product) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                          disabled={tagMutation.isPending}
                          onClick={() =>
                            tagMutation.mutate({
                              productId: product.id,
                              enabled: true,
                            })
                          }
                        >
                          {product.primaryImage ? (
                            <img
                              src={product.primaryImage.url}
                              alt=""
                              className="size-9 rounded object-cover"
                            />
                          ) : (
                            <div className="size-9 rounded bg-muted" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-primary">
                            Add
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {taggedQuery.isLoading ? (
          <div className="flex h-28 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : taggedItems.length === 0 ? (
          <div className="flex h-28 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            No products tagged yet
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {taggedItems.map((product) => (
              <ProductChip
                key={product.id}
                product={product}
                canRemove={canUpdate}
                removing={tagMutation.isPending}
                onRemove={() =>
                  tagMutation.mutate({
                    productId: product.id,
                    enabled: false,
                  })
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProductChip({
  product,
  canRemove,
  removing,
  onRemove,
}: {
  product: ProductListItem;
  canRemove: boolean;
  removing: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-2.5">
      {product.primaryImage ? (
        <img
          src={product.primaryImage.url}
          alt={product.primaryImage.altText || product.name}
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="size-12 shrink-0 rounded-lg bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(product.price)}
        </p>
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${product.name}`}
          disabled={removing}
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
