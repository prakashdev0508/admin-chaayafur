import { useEffect, useId, useState } from "react";
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

type RedirectSlugProductPickerProps = {
  slug: string;
  onChange: (next: {
    slug: string;
    product: ProductListItem | null;
  }) => void;
  disabled?: boolean;
};

export function RedirectSlugProductPicker({
  slug,
  onChange,
  disabled = false,
}: RedirectSlugProductPickerProps) {
  const inputId = useId();
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<ProductListItem | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const trimmedSlug = slug.trim();

  const resolveQuery = useQuery({
    queryKey: queryKeys.products.list({
      slug: trimmedSlug,
      limit: 1,
      scope: "redirect-slug-resolve",
    }),
    queryFn: () =>
      listProducts({
        slug: trimmedSlug,
        limit: 1,
        page: 1,
      }),
    enabled: trimmedSlug.length > 0 && !picked,
  });

  const resolved =
    picked?.slug === trimmedSlug
      ? picked
      : (resolveQuery.data?.items?.[0] ?? null);

  const searchQuery = useQuery({
    queryKey: queryKeys.products.list({
      name: debouncedSearch,
      limit: 6,
      isActive: true,
      scope: "redirect-slug-search",
    }),
    queryFn: () =>
      listProducts({
        name: debouncedSearch,
        limit: 6,
        page: 1,
        isActive: true,
      }),
    enabled: !trimmedSlug && !disabled && debouncedSearch.length >= 2,
  });

  function selectProduct(product: ProductListItem) {
    setPicked(product);
    onChange({ slug: product.slug, product });
    setSearch("");
  }

  function clear() {
    setPicked(null);
    onChange({ slug: "", product: null });
    setSearch("");
  }

  if (trimmedSlug) {
    const name = resolved?.name;
    const loading = !resolved && resolveQuery.isLoading;

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 rounded-md border bg-background p-1.5">
          {resolved?.primaryImage ? (
            <img
              src={resolved.primaryImage.url}
              alt=""
              className="size-8 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="size-8 shrink-0 rounded bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            {loading ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Looking up product…
              </p>
            ) : (
              <>
                <p className="truncate text-xs font-medium">
                  {name ?? "Unknown product"}
                </p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {trimmedSlug}
                  {resolved
                    ? ` · ${formatCurrency(resolved.price)}`
                    : ""}
                </p>
              </>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0"
            disabled={disabled}
            onClick={clear}
            aria-label="Clear redirect product"
          >
            <X className="size-3.5" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Storefront opens this product when the option is clicked.
        </p>
      </div>
    );
  }

  const results = searchQuery.data?.items ?? [];

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="pointer-events-none absolute top-2.5 left-2 size-3.5 text-muted-foreground" />
        <Input
          id={inputId}
          value={search}
          disabled={disabled}
          placeholder="Search product to redirect…"
          className="h-9 pl-7 text-xs"
          autoComplete="off"
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search product for redirect"
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
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 p-1.5 text-left hover:bg-muted/60"
                    onClick={() => selectProduct(product)}
                  >
                    {product.primaryImage ? (
                      <img
                        src={product.primaryImage.url}
                        alt=""
                        className="size-7 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="size-7 shrink-0 rounded bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{product.name}</p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {product.slug} · {formatCurrency(product.price)}
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
          Optional. Search and pick a product to open on click.
        </p>
      )}
    </div>
  );
}
