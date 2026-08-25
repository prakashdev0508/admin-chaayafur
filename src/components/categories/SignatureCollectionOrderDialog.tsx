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
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id,
        ),
    [categories],
  );

  const reorderMutation = useMutation({
    mutationFn: async ({
      current,
      neighbor,
    }: {
      current: CategoryTreeItem;
      neighbor: CategoryTreeItem;
    }) => {
      await Promise.all([
        updateCategory(current.id, { sortOrder: neighbor.sortOrder ?? 0 }),
        updateCategory(neighbor.id, { sortOrder: current.sortOrder ?? 0 }),
      ]);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
    onMutate: ({ current, neighbor }) => {
      setReorderingIds([current.id, neighbor.id]);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to reorder signature collections",
      );
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
                          disabled={index === 0 || reorderBusy}
                          aria-label="Move earlier"
                          onClick={() =>
                            reorderMutation.mutate({
                              current: category,
                              neighbor: signatureCategories[index - 1],
                            })
                          }
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
                          disabled={
                            index === signatureCategories.length - 1 ||
                            reorderBusy
                          }
                          aria-label="Move later"
                          onClick={() =>
                            reorderMutation.mutate({
                              current: category,
                              neighbor: signatureCategories[index + 1],
                            })
                          }
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
