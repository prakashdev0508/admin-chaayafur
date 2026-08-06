import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ADMIN_SEARCH_TYPE_ICONS,
  ADMIN_SEARCH_TYPE_LABELS,
  getAdminSearchPath,
  groupAdminSearchHits,
} from "@/lib/admin-search-links";
import { queryKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { adminSearch } from "@/services/admin-search.service";
import type { AdminSearchHit, AdminSearchHitType } from "@/types/search";

export const ADMIN_SEARCH_PERMISSIONS = [
  PERMISSIONS.VIEW_PRODUCTS,
  PERMISSIONS.VIEW_CATEGORIES,
  PERMISSIONS.VIEW_ORDERS,
  PERMISSIONS.VIEW_CUSTOMERS,
  PERMISSIONS.VIEW_COUPONS,
  PERMISSIONS.VIEW_ORDER_SUPPORT,
  PERMISSIONS.VIEW_PAYMENTS,
];

const TYPE_ORDER: AdminSearchHitType[] = [
  "order",
  "invoice",
  "customer",
  "product",
  "category",
  "subcategory",
  "coupon",
  "payment",
  "support_ticket",
];

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

type AdminSearchOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminSearchOverlay({
  open,
  onOpenChange,
}: AdminSearchOverlayProps) {
  const navigate = useNavigate();
  const { hasAnyPermission } = usePermission();
  const canSearch = hasAnyPermission(ADMIN_SEARCH_PERMISSIONS);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const canFetch = debouncedQuery.length >= 2;

  const searchQuery = useQuery({
    queryKey: queryKeys.adminSearch({ q: debouncedQuery, limit: 20 }),
    queryFn: () => adminSearch({ q: debouncedQuery, limit: 20 }),
    enabled: canSearch && open && canFetch,
  });

  const items = searchQuery.data?.items ?? [];
  const grouped = useMemo(() => groupAdminSearchHits(items), [items]);
  const flatItems = useMemo(() => {
    const ordered: AdminSearchHit[] = [];
    for (const type of TYPE_ORDER) {
      const group = grouped[type];
      if (group?.length) ordered.push(...group);
    }
    return ordered;
  }, [grouped]);

  const close = useCallback(() => {
    onOpenChange(false);
    setActiveIndex(-1);
    setQuery("");
  }, [onOpenChange]);

  const selectHit = useCallback(
    (hit: AdminSearchHit) => {
      navigate(getAdminSearchPath(hit));
      close();
    },
    [navigate, close],
  );

  useEffect(() => {
    if (!canSearch) return;

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canSearch, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery, items]);

  if (!canSearch || !open) return null;

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (flatItems.length === 0) return;

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

  const showResults = query.trim().length > 0 || searchQuery.isFetching;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] sm:pt-[15vh]">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
        onClick={close}
      />

      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Admin search"
      >
        <div className="relative border-b">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search products, orders, customers…"
            className="h-14 rounded-none border-0 bg-transparent pr-20 pl-11 text-base shadow-none focus-visible:ring-0"
            aria-label="Global admin search"
            aria-expanded={showResults}
            aria-controls="admin-search-results"
            autoComplete="off"
          />
          <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5">
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
            <button
              type="button"
              onClick={close}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {showResults && (
          <div
            id="admin-search-results"
            className="max-h-[min(28rem,55vh)] overflow-y-auto"
            role="listbox"
          >
            {query.trim().length > 0 && query.trim().length < 2 && (
              <p className="p-4 text-sm text-muted-foreground">
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
              <p className="p-4 text-sm text-destructive">
                {searchQuery.error instanceof Error
                  ? searchQuery.error.message
                  : "Search failed"}
              </p>
            )}

            {canFetch &&
              !searchQuery.isLoading &&
              !searchQuery.isError &&
              flatItems.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">
                  No results for “{debouncedQuery}”.
                </p>
              )}

            {canFetch &&
              !searchQuery.isLoading &&
              flatItems.length > 0 &&
              TYPE_ORDER.map((type) => {
                const group = grouped[type];
                if (!group?.length) return null;
                const Icon = ADMIN_SEARCH_TYPE_ICONS[type];
                return (
                  <div key={type} className="border-b last:border-b-0">
                    <p className="sticky top-0 bg-muted/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                      {ADMIN_SEARCH_TYPE_LABELS[type]}
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
                                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/70",
                                isActive && "bg-muted",
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
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                  <Icon className="size-4 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {hit.title}
                                </p>
                                {hit.subtitle && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {hit.subtitle}
                                  </p>
                                )}
                              </div>
                              {hit.status && (
                                <StatusBadge
                                  variant="neutral"
                                  className="shrink-0"
                                >
                                  {hit.status}
                                </StatusBadge>
                              )}
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

        {!showResults && (
          <p className="p-4 text-sm text-muted-foreground">
            Search products, orders, customers, and more.
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
