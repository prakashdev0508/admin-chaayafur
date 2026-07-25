import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  PUBLIC_SEARCH_TYPE_ICONS,
  PUBLIC_SEARCH_TYPE_LABELS,
  getShopSearchPath,
  groupPublicSearchHits,
} from "@/lib/shop-search-links";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { publicSearch } from "@/services/shop-search.service";
import type { PublicSearchHit, PublicSearchHitType } from "@/types/search";

const TYPE_ORDER: PublicSearchHitType[] = [
  "product",
  "category",
  "subcategory",
];

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

type ShopSearchBarProps = {
  className?: string;
};

export function ShopSearchBar({ className }: ShopSearchBarProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const canFetch = debouncedQuery.length >= 2;

  const searchQuery = useQuery({
    queryKey: queryKeys.shop.search({ q: debouncedQuery, limit: 12 }),
    queryFn: () => publicSearch({ q: debouncedQuery, limit: 12 }),
    enabled: canFetch,
  });

  const items = searchQuery.data?.items ?? [];
  const grouped = useMemo(() => groupPublicSearchHits(items), [items]);
  const flatItems = useMemo(() => {
    const ordered: PublicSearchHit[] = [];
    for (const type of TYPE_ORDER) {
      const group = grouped[type];
      if (group?.length) ordered.push(...group);
    }
    return ordered;
  }, [grouped]);

  const closePanel = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const selectHit = useCallback(
    (hit: PublicSearchHit) => {
      navigate(getShopSearchPath(hit));
      setQuery("");
      closePanel();
    },
    [navigate, closePanel],
  );

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        inputRef.current?.contains(target)
      ) {
        return;
      }
      closePanel();
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [closePanel]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery, items]);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      inputRef.current?.blur();
      return;
    }

    if (!open || flatItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        index < flatItems.length - 1 ? index + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        index <= 0 ? flatItems.length - 1 : index - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectHit(flatItems[activeIndex]);
    }
  }

  const showPanel =
    open && (query.trim().length > 0 || searchQuery.isFetching);

  return (
    <div className={cn("relative w-full max-w-md", className)} ref={panelRef}>
      <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
        placeholder="Search furniture…"
        className="h-9 border-[#D9CBB8] bg-white pl-8"
        aria-label="Search shop"
        aria-expanded={showPanel}
        aria-controls="shop-search-results"
        autoComplete="off"
      />

      {showPanel && (
        <div
          id="shop-search-results"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(24rem,70vh)] overflow-y-auto rounded-xl border border-[#E8DFD3] bg-white shadow-lg"
          role="listbox"
        >
          {query.trim().length > 0 && query.trim().length < 2 && (
            <p className="p-3 text-sm text-muted-foreground">
              Type at least 2 characters to search.
            </p>
          )}

          {canFetch && searchQuery.isLoading && (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching…
            </div>
          )}

          {canFetch && searchQuery.isError && (
            <p className="p-3 text-sm text-destructive">
              {searchQuery.error instanceof Error
                ? searchQuery.error.message
                : "Search failed"}
            </p>
          )}

          {canFetch &&
            !searchQuery.isLoading &&
            !searchQuery.isError &&
            flatItems.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                No results for “{debouncedQuery}”.
              </p>
            )}

          {canFetch &&
            !searchQuery.isLoading &&
            flatItems.length > 0 &&
            TYPE_ORDER.map((type) => {
              const group = grouped[type];
              if (!group?.length) return null;
              const Icon = PUBLIC_SEARCH_TYPE_ICONS[type];
              return (
                <div key={type} className="border-b border-[#E8DFD3] last:border-b-0">
                  <p className="sticky top-0 bg-[#F8F1E8]/95 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                    {PUBLIC_SEARCH_TYPE_LABELS[type]}
                  </p>
                  <ul>
                    {group.map((hit) => {
                      const flatIndex = flatItems.indexOf(hit);
                      const isActive = flatIndex === activeIndex;
                      return (
                        <li key={`${hit.type}-${hit.id}`}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            className={cn(
                              "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F3EBE0]",
                              isActive && "bg-[#F3EBE0]",
                            )}
                            onMouseEnter={() => setActiveIndex(flatIndex)}
                            onClick={() => selectHit(hit)}
                          >
                            {hit.imageUrl ? (
                              <img
                                src={hit.imageUrl}
                                alt=""
                                className="size-9 shrink-0 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#F3EBE0]">
                                <Icon className="size-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[#3D2B1F]">
                                {hit.title}
                              </p>
                              {hit.subtitle && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {hit.subtitle}
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
