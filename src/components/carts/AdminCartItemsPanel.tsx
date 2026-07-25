import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProductSearchSelect } from "@/components/shared/ProductSearchSelect";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  removeAdminCartItem,
  setAdminCartItemQuantity,
  upsertAdminCartItem,
} from "@/services/admin-carts.service";
import { getProduct } from "@/services/products.service";
import { cartLineKey, type AdminCartDetail } from "@/types/cart";
import {
  getSelectableProductWoods,
  productRequiresWood,
} from "@/types/wood";
import type { ProductListItem } from "@/types/product";

type LineRef = { productId: number; woodId?: number | null };

type AdminCartItemsPanelProps = {
  cart: AdminCartDetail;
  canUpdate: boolean;
  /** Extra query keys to invalidate after mutations (e.g. customer detail). */
  extraInvalidateKeys?: readonly (readonly unknown[])[];
  /** When false, hide the inline add button (use an external trigger). */
  showAddButton?: boolean;
  /** Controlled open state for the add dialog. */
  addOpen?: boolean;
  onAddOpenChange?: (open: boolean) => void;
};

export function AdminCartItemsPanel({
  cart,
  canUpdate,
  extraInvalidateKeys = [],
  showAddButton = true,
  addOpen: controlledAddOpen,
  onAddOpenChange,
}: AdminCartItemsPanelProps) {
  const queryClient = useQueryClient();
  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const addOpen = controlledAddOpen ?? internalAddOpen;
  const setAddOpen = onAddOpenChange ?? setInternalAddOpen;
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(
    null,
  );
  const [selectedWoodId, setSelectedWoodId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [removeLine, setRemoveLine] = useState<LineRef | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const productDetailQuery = useQuery({
    queryKey: ["admin", "cart-add-product", selectedProduct?.id],
    queryFn: () => getProduct(selectedProduct!.id),
    enabled: addOpen && selectedProduct != null,
  });

  const productWoods = productDetailQuery.data?.woods ?? [];
  const selectableWoods = getSelectableProductWoods(productWoods);
  const requiresWood = productRequiresWood(productWoods);
  const showWoodPicker = productWoods.length > 0;

  useEffect(() => {
    setSelectedWoodId(null);
  }, [selectedProduct?.id]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.carts.detail(cart.id),
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.carts.all });
    for (const key of extraInvalidateKeys) {
      await queryClient.invalidateQueries({ queryKey: key });
    }
  };

  const upsertMutation = useMutation({
    mutationFn: (payload: {
      productId: number;
      quantity: number;
      woodId?: number;
    }) => upsertAdminCartItem(cart.id, payload),
    onSuccess: async () => {
      toast.success("Cart item saved");
      setAddOpen(false);
      setSelectedProduct(null);
      setSelectedWoodId(null);
      setQuantity("1");
      await invalidate();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update cart item",
      );
    },
  });

  const setQtyMutation = useMutation({
    mutationFn: ({
      productId,
      quantity: qty,
      woodId,
    }: {
      productId: number;
      quantity: number;
      woodId?: number | null;
    }) =>
      setAdminCartItemQuantity(cart.id, productId, { quantity: qty }, woodId),
    onMutate: ({ productId, woodId }) =>
      setPendingKey(cartLineKey(productId, woodId)),
    onSettled: () => setPendingKey(null),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update quantity",
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ productId, woodId }: LineRef) =>
      removeAdminCartItem(cart.id, productId, woodId),
    onSuccess: async () => {
      toast.success("Item removed");
      setRemoveLine(null);
      await invalidate();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove item",
      );
    },
  });

  const busy =
    upsertMutation.isPending ||
    setQtyMutation.isPending ||
    removeMutation.isPending;

  async function handleQuantityDelta(
    productId: number,
    current: number,
    delta: number,
    woodId?: number | null,
  ) {
    const next = current + delta;
    if (next < 1) {
      setRemoveLine({ productId, woodId });
      return;
    }
    setQtyMutation.mutate({ productId, quantity: next, woodId });
  }

  return (
    <div className="space-y-3">
      {canUpdate && showAddButton && (
        <Button variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Add / update item
        </Button>
      )}

      {cart.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Cart is empty.</p>
      ) : (
        cart.items.map((item) => {
          const key = cartLineKey(item.productId, item.woodId);
          const lineBusy = pendingKey === key && busy;
          return (
            <div
              key={key}
              className="flex flex-wrap items-stretch justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <div className="flex min-w-0 flex-1 items-stretch gap-3">
                <div className="w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="size-full min-h-16 object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div>
                    <Link
                      to={`/products/${item.productId}`}
                      className="font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    {item.woodName && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {item.woodColor && (
                          <span
                            className="size-2.5 rounded-full border border-border"
                            style={{ backgroundColor: item.woodColor }}
                            aria-hidden
                          />
                        )}
                        {item.woodName}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      Product #{item.productId} · Stock {item.stock}
                    </p>
                    {!item.isAvailable && (
                      <StatusBadge variant="danger" className="mt-1">
                        Unavailable
                      </StatusBadge>
                    )}
                  </div>
                  {canUpdate && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() =>
                          void handleQuantityDelta(
                            item.productId,
                            item.quantity,
                            -1,
                            item.woodId,
                          )
                        }
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="min-w-8 text-center text-sm tabular-nums">
                        {lineBusy ? (
                          <Loader2 className="mx-auto size-3.5 animate-spin" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        disabled={busy || item.quantity >= item.stock}
                        onClick={() =>
                          void handleQuantityDelta(
                            item.productId,
                            item.quantity,
                            1,
                            item.woodId,
                          )
                        }
                      >
                        <Plus className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() =>
                          setRemoveLine({
                            productId: item.productId,
                            woodId: item.woodId,
                          })
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end justify-between text-right">
                <div>
                  <p>{formatCurrency(item.lineTotal)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.unitPrice)} each
                  </p>
                </div>
                {!canUpdate && (
                  <p className="text-xs text-muted-foreground">
                    Qty {item.quantity}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setSelectedProduct(null);
            setSelectedWoodId(null);
            setQuantity("1");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add or update item</DialogTitle>
            <DialogDescription>
              Search by product name. Quantity replaces any existing line for
              that product and wood.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedProduct) {
                toast.error("Select a product");
                return;
              }
              const qty = Number(quantity);
              if (!Number.isFinite(qty) || qty < 1) {
                toast.error("Quantity must be at least 1");
                return;
              }
              if (requiresWood && selectedWoodId == null) {
                toast.error("Select a wood for this product");
                return;
              }
              upsertMutation.mutate({
                productId: selectedProduct.id,
                quantity: qty,
                ...(selectedWoodId != null ? { woodId: selectedWoodId } : {}),
              });
            }}
          >
            <ProductSearchSelect
              value={selectedProduct}
              onChange={setSelectedProduct}
              disabled={upsertMutation.isPending}
            />
            {selectedProduct && productDetailQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading woods…</p>
            )}
            {showWoodPicker && (
              <div className="space-y-2">
                <Label>Wood</Label>
                <div className="flex flex-wrap gap-2">
                  {productWoods.map((wood) => {
                    const available = wood.isAvailable;
                    const selected = selectedWoodId === wood.id;
                    return (
                      <button
                        key={wood.id}
                        type="button"
                        disabled={!available}
                        onClick={() => {
                          if (available) setSelectedWoodId(wood.id);
                        }}
                        title={
                          available
                            ? wood.name
                            : `${wood.name} — not available now`
                        }
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                          !available &&
                            "cursor-not-allowed opacity-50 border-dashed",
                          available && selected && "border-primary bg-muted",
                          available &&
                            !selected &&
                            "border-border hover:bg-muted/50",
                        )}
                      >
                        <span
                          className="size-3 rounded-full border border-border"
                          style={{ backgroundColor: wood.color }}
                          aria-hidden
                        />
                        {wood.name}
                        {!available && (
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Unavailable
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectableWoods.length === 0 && (
                  <p className="text-xs text-destructive">
                    No woods are currently available for this product.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="admin-cart-qty">Quantity</Label>
              <Input
                id="admin-cart-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={removeLine !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveLine(null);
        }}
        title="Remove item from cart?"
        description="This removes the product line from the customer's cart."
        confirmLabel="Remove"
        variant="destructive"
        loading={removeMutation.isPending}
        onConfirm={() => {
          if (removeLine == null) return Promise.resolve();
          return removeMutation.mutateAsync(removeLine);
        }}
      />
    </div>
  );
}
