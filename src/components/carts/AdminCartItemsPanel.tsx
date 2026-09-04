import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CartMaterialChips } from "@/components/shop/CartMaterialChips";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProductSearchSelect } from "@/components/shared/ProductSearchSelect";
import { ProductCartMaterialPickers } from "@/components/shared/ProductCartMaterialPickers";
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
import {
  customizationPicksFromSelection,
  type CustomizationSelection,
} from "@/lib/product-customization";
import {
  removeAdminCartItem,
  setAdminCartItemQuantity,
  upsertAdminCartItem,
} from "@/services/admin-carts.service";
import {
  cartLineKey,
  cartLineRefFromItem,
  type AdminCartDetail,
  type CartLineRef,
} from "@/types/cart";
import type { ProductListItem } from "@/types/product";

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
  const [customizationSelection, setCustomizationSelection] =
    useState<CustomizationSelection>({});
  const [quantity, setQuantity] = useState("1");
  const [removeLine, setRemoveLine] = useState<CartLineRef | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

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
    mutationFn: (payload: Parameters<typeof upsertAdminCartItem>[1]) =>
      upsertAdminCartItem(cart.id, payload),
    onSuccess: async () => {
      toast.success("Cart item saved");
      setAddOpen(false);
      setSelectedProduct(null);
      setCustomizationSelection({});
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
      line,
      quantity: qty,
    }: {
      line: CartLineRef;
      quantity: number;
    }) => setAdminCartItemQuantity(cart.id, line, { quantity: qty }),
    onMutate: ({ line }) => setPendingKey(cartLineKey(line)),
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
    mutationFn: (line: CartLineRef) => removeAdminCartItem(cart.id, line),
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
    line: CartLineRef,
    current: number,
    delta: number,
  ) {
    const next = current + delta;
    if (next < 1) {
      setRemoveLine(line);
      return;
    }
    setQtyMutation.mutate({ line, quantity: next });
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
          const line = cartLineRefFromItem(item);
          const key = cartLineKey(line);
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
                    <CartMaterialChips
                      item={item}
                      size="md"
                      className="mt-1.5"
                    />
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
                          void handleQuantityDelta(line, item.quantity, -1)
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
                        disabled={busy}
                        onClick={() =>
                          void handleQuantityDelta(line, item.quantity, 1)
                        }
                      >
                        <Plus className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => setRemoveLine(line)}
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
            setCustomizationSelection({});
            setQuantity("1");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add or update item</DialogTitle>
            <DialogDescription>
              Search by product name. Quantity replaces any existing line for
              the same product and customization combination.
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
              upsertMutation.mutate({
                productId: selectedProduct.id,
                quantity: qty,
                ...(customizationPicksFromSelection(customizationSelection)
                  .length > 0
                  ? {
                      customization: customizationPicksFromSelection(
                        customizationSelection,
                      ),
                    }
                  : {}),
              });
            }}
          >
            <ProductSearchSelect
              value={selectedProduct}
              onChange={(product) => {
                setSelectedProduct(product);
                setCustomizationSelection({});
              }}
              disabled={upsertMutation.isPending}
            />
            <ProductCartMaterialPickers
              productId={selectedProduct?.id ?? null}
              customizationSelection={customizationSelection}
              onCustomizationChange={setCustomizationSelection}
              disabled={upsertMutation.isPending}
            />
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
