import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { listProducts } from "@/services/products.service";
import type { ProductListItem } from "@/types/product";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

type InstagramProductLinkPickerProps = {
  product: ProductListItem | null;
  productId: number | null;
  onChange: (next: {
    productId: number | null;
    product: ProductListItem | null;
  }) => void;
  disabled?: boolean;
};

export function InstagramProductLinkPicker({
  product,
  productId,
  onChange,
  disabled = false,
}: InstagramProductLinkPickerProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const searchQuery = useQuery({
    queryKey: queryKeys.products.list({
      name: debouncedSearch,
      limit: 6,
      isActive: true,
      scope: "instagram-product-link",
    }),
    queryFn: () =>
      listProducts({
        name: debouncedSearch,
        limit: 6,
        page: 1,
        isActive: true,
      }),
    enabled: !product && !disabled && debouncedSearch.length >= 2,
  });

  if (product) {
    return (
      <div
        className="space-y-1"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] font-medium text-foreground">Linked product</p>
        <div className="flex items-center gap-2 rounded-md border bg-background p-1.5">
          {product.primaryImage ? (
            <img
              src={product.primaryImage.url}
              alt=""
              className="size-8 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="size-8 shrink-0 rounded bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{product.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">
              #{product.id} · {formatCurrency(product.price)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0"
            disabled={disabled}
            onClick={() => onChange({ productId: null, product: null })}
            aria-label="Clear linked product"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (productId != null) {
    return (
      <div
        className="space-y-1"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] font-medium text-foreground">Linked product</p>
        <div className="flex items-center gap-2 rounded-md border bg-background p-1.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">Product #{productId}</p>
            <p className="text-[10px] text-muted-foreground">
              Search again to change, or clear
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0"
            disabled={disabled}
            onClick={() => onChange({ productId: null, product: null })}
            aria-label="Clear linked product"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  const results = searchQuery.data?.items ?? [];

  return (
    <div
      className="space-y-1"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <p className="text-[11px] font-medium text-foreground">Linked product</p>
      <div className="relative">
        <Search className="pointer-events-none absolute top-2.5 left-2 size-3.5 text-muted-foreground" />
        <Input
          value={search}
          disabled={disabled}
          placeholder="Search product to shop…"
          className="h-9 pl-7 text-xs"
          autoComplete="off"
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search product to link"
        />
      </div>
      {debouncedSearch.length > 0 && debouncedSearch.length < 2 && (
        <p className="text-[11px] text-muted-foreground">
          Type at least 2 characters.
        </p>
      )}
      {debouncedSearch.length >= 2 && (
        <div className="max-h-40 overflow-y-auto rounded-md border">
          {searchQuery.isLoading ? (
            <div className="flex items-center justify-center gap-1.5 p-2.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">No products found.</p>
          ) : (
            <ul className="divide-y">
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 p-1.5 text-left hover:bg-muted/60"
                    onClick={() =>
                      onChange({ productId: item.id, product: item })
                    }
                  >
                    {item.primaryImage ? (
                      <img
                        src={item.primaryImage.url}
                        alt=""
                        className="size-7 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="size-7 shrink-0 rounded bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{item.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!debouncedSearch && (
        <p className="text-[11px] text-muted-foreground">
          Optional. Shoppers open this product when they tap the reel.
        </p>
      )}
    </div>
  );
}
