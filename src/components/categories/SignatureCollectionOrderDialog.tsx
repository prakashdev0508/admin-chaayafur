import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  bySortOrderThenId,
  changedSortOrders,
  reindexAfterSwap,
} from "@/lib/sort-order";
import { cn } from "@/lib/utils";
import { updateCategory } from "@/services/categories.service";
import type { CategoryTreeItem } from "@/types/category";

type SignatureCollectionOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryTreeItem[];
  canUpdate: boolean;
};

export function SignatureCollectionOrderDialog({
  open,
  onOpenChange,
  categories,
  canUpdate,
}: SignatureCollectionOrderDialogProps) {
  const queryClient = useQueryClient();
  const [reorderingIds, setReorderingIds] = useState<number[] | null>(null);

  const signatureCategories = useMemo(
    () =>
      categories
        .filter((category) => category.isSignatureCollection)
        .sort(bySortOrderThenId),
    [categories],
  );

  const reorderMutation = useMutation({
    mutationFn: async ({
      currentId,
      neighborId,
      items,
    }: {
      currentId: number;
      neighborId: number;
      items: CategoryTreeItem[];
    }) => {
      // Reindex the full category list so signature swaps stay unique even when
      // several rows share the same sortOrder (ties used to make swaps no-ops).
      const updates = changedSortOrders(items, currentId, neighborId);
      await Promise.all(
        updates.map((row) =>
          updateCategory(row.id, { sortOrder: row.sortOrder }),
        ),
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
    onMutate: ({ currentId, neighborId, items }) => {
      setReorderingIds([currentId, neighborId]);
      const orderById = new Map(
        reindexAfterSwap(items, currentId, neighborId).map((row) => [
          row.id,
          row.sortOrder,
        ]),
      );
      queryClient.setQueryData<CategoryTreeItem[]>(
        queryKeys.categories.adminTree,
        (old) =>
          (old ?? []).map((category) => {
            const sortOrder = orderById.get(category.id);
            return sortOrder == null ? category : { ...category, sortOrder };
          }),
      );
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to reorder signature collections",
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
    onSettled: () => {
      setReorderingIds(null);
    },
  });

  const reorderBusy = reorderMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Signature collections</DialogTitle>
          <DialogDescription>
            Reorder how signature collections appear on the storefront. Lower
            sort order shows first. Use ← → to swap positions.
          </DialogDescription>
        </DialogHeader>

        {signatureCategories.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No signature collections yet. Mark a category as a signature
            collection from its edit form, then return here to sort them.
          </p>
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-4 sm:grid-cols-2",
              reorderBusy && "pointer-events-none opacity-70",
            )}
          >
            {signatureCategories.map((category, index) => {
              const isMoving = reorderingIds?.includes(category.id) ?? false;
              const prev = index > 0 ? signatureCategories[index - 1] : null;
              const next =
                index < signatureCategories.length - 1
                  ? signatureCategories[index + 1]
                  : null;
              return (
                <div
                  key={category.id}
                  className="relative min-w-0 overflow-hidden rounded-xl border bg-card"
                >
                  <div className="relative aspect-16/10 bg-muted">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground/50">
                        <ImageIcon className="size-8" />
                      </div>
                    )}
                    {isMoving && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                        <Loader2 className="size-6 animate-spin text-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{category.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Sort order: {category.sortOrder ?? 0}
                      </p>
                    </div>
                    {canUpdate && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={!prev || reorderBusy}
                          aria-label="Move earlier"
                          onClick={() => {
                            if (!prev) return;
                            reorderMutation.mutate({
                              currentId: category.id,
                              neighborId: prev.id,
                              items: categories,
                            });
                          }}
                        >
                          {isMoving ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <ChevronLeft className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={!next || reorderBusy}
                          aria-label="Move later"
                          onClick={() => {
                            if (!next) return;
                            reorderMutation.mutate({
                              currentId: category.id,
                              neighborId: next.id,
                              items: categories,
                            });
                          }}
                        >
                          {isMoving ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <ChevronRight className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
