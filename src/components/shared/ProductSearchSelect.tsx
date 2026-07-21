import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type ProductSearchSelectProps = {
  value: ProductListItem | null;
  onChange: (product: ProductListItem | null) => void;
  label?: string;
  disabled?: boolean;
};

export function ProductSearchSelect({
  value,
  onChange,
  label = "Product",
  disabled = false,
}: ProductSearchSelectProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const searchQuery = useQuery({
    queryKey: queryKeys.products.list({
      name: debouncedSearch,
      limit: 8,
      scope: "product-search-select",
    }),
    queryFn: () =>
      listProducts({
        name: debouncedSearch,
        limit: 8,
        page: 1,
      }),
    enabled: !value && !disabled && debouncedSearch.length >= 2,
  });

  if (value) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-3 rounded-lg border p-2.5">
          {value.primaryImage ? (
            <img
              src={value.primaryImage.url}
              alt={value.primaryImage.altText || value.name}
              className="size-12 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="size-12 shrink-0 rounded-md bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              #{value.id} · {formatCurrency(value.price)} · Stock {value.stock}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setSearch("");
            }}
            aria-label={`Clear ${value.name}`}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  const results = searchQuery.data?.items ?? [];

  return (
    <div className="space-y-2">
      <Label htmlFor="product-search-select">{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          id="product-search-select"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name…"
          className="pl-8"
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      {debouncedSearch.length > 0 && debouncedSearch.length < 2 && (
        <p className="text-xs text-muted-foreground">Type at least 2 characters.</p>
      )}
      {debouncedSearch.length >= 2 && (
        <div className="max-h-56 overflow-y-auto rounded-lg border">
          {searchQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No products found.</p>
          ) : (
            <ul className="divide-y">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-muted/60"
                    onClick={() => {
                      onChange(product);
                      setSearch("");
                    }}
                  >
                    {product.primaryImage ? (
                      <img
                        src={product.primaryImage.url}
                        alt=""
                        className="size-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="size-10 shrink-0 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(product.price)} · Stock {product.stock}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
