import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  deleteStagedProductImage,
  listStagedProductImages,
} from "@/services/products.service";

function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

type StagedProductImagesPanelProps = {
  disabled?: boolean;
};

export function StagedProductImagesPanel({
  disabled = false,
}: StagedProductImagesPanelProps) {
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState("");
  const [unconsumedOnly, setUnconsumedOnly] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const debouncedSlug = useDebouncedValue(slug.trim());

  const params = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(debouncedSlug ? { slug: debouncedSlug } : {}),
      unconsumed: unconsumedOnly,
    }),
    [page, debouncedSlug, unconsumedOnly],
  );

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: queryKeys.stagedProductImages.list(params),
    queryFn: () => listStagedProductImages(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStagedProductImage(id),
    onSuccess: () => {
      toast.success("Staged image deleted");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.stagedProductImages.all,
      });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete";
      toast.error(message);
    },
  });

  const items = data?.items ?? [];
  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Unconsumed staged images older than 30 days are purged automatically.
        During Excel import, matching unconsumed images are attached by slug
        (ordered by sort order, max 5).
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="staged-slug">Filter by slug</Label>
          <Input
            id="staged-slug"
            placeholder="e.g. oak-dining-table"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setPage(1);
            }}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Switch
            id="unconsumed-only"
            checked={unconsumedOnly}
            onCheckedChange={(checked) => {
              setUnconsumedOnly(checked);
              setPage(1);
            }}
            disabled={disabled}
          />
          <Label htmlFor="unconsumed-only" className="text-sm font-normal">
            Unconsumed only
          </Label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading staged images…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load staged images"}
        </p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No staged images found.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((image) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <div className="aspect-square bg-muted">
                  <img
                    src={image.url}
                    alt={`${image.productSlug} #${image.sortOrder}`}
                    className="size-full object-cover"
                  />
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-medium">
                        {image.productSlug}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        sortOrder {image.sortOrder}
                      </p>
                    </div>
                    <StatusBadge
                      variant={image.consumedAt ? "neutral" : "success"}
                    >
                      {image.consumedAt ? "Consumed" : "Ready"}
                    </StatusBadge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full text-xs text-destructive hover:text-destructive"
                    disabled={
                      disabled ||
                      deleteMutation.isPending ||
                      Boolean(image.consumedAt)
                    }
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Delete staged image for "${image.productSlug}" (sort ${image.sortOrder})?`,
                        )
                      ) {
                        return;
                      }
                      deleteMutation.mutate(image.id);
                    }}
                  >
                    <Trash2 className="size-3" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
                {isFetching ? " · refreshing…" : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || disabled}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || disabled}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
