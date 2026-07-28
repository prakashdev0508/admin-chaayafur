import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getProduct } from "@/services/products.service";
import { getSelectableProductFabrics } from "@/types/fabric";
import { getSelectableProductWoods } from "@/types/wood";

type ProductCartMaterialPickersProps = {
  productId: number | null;
  woodId: number | null;
  polishId: number | null;
  fabricId: number | null;
  onWoodChange: (woodId: number | null) => void;
  onPolishChange: (polishId: number | null) => void;
  onFabricChange: (fabricId: number | null) => void;
  disabled?: boolean;
};

export function ProductCartMaterialPickers({
  productId,
  woodId,
  polishId,
  fabricId,
  onWoodChange,
  onPolishChange,
  onFabricChange,
  disabled,
}: ProductCartMaterialPickersProps) {
  const productQuery = useQuery({
    queryKey: ["product-cart-materials", productId],
    queryFn: () => getProduct(productId!),
    enabled: productId != null && productId > 0,
  });

  const woods = productQuery.data?.woods ?? [];
  const selectableWoods = getSelectableProductWoods(woods);
  const selectedWood = selectableWoods.find((w) => w.id === woodId);
  const polishes = selectedWood?.polishes ?? [];
  const fabrics = productQuery.data?.fabrics ?? [];
  const selectableFabrics = getSelectableProductFabrics(fabrics);

  useEffect(() => {
    onPolishChange(null);
  }, [woodId, onPolishChange]);

  if (productId == null) return null;

  if (productQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading options…</p>;
  }

  return (
    <div className="space-y-4">
      {woods.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>
              Wood{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            {woodId != null && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                disabled={disabled}
                onClick={() => onWoodChange(null)}
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {woods.map((wood) => {
              const available = wood.isAvailable;
              const selected = woodId === wood.id;
              return (
                <button
                  key={wood.id}
                  type="button"
                  disabled={disabled || !available}
                  onClick={() => {
                    if (available) onWoodChange(selected ? null : wood.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                    !available && "cursor-not-allowed opacity-50 border-dashed",
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

      {woodId != null && polishes.length > 0 && (
        <div className="space-y-2">
          <Label>
            Polish{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {polishes.map((polish) => {
              const selected = polishId === polish.id;
              return (
                <button
                  key={polish.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPolishChange(selected ? null : polish.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                    selected
                      ? "border-primary bg-muted"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <span
                    className="size-3 rounded-full border border-border"
                    style={{ backgroundColor: polish.color }}
                    aria-hidden
                  />
                  {polish.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {fabrics.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>
              Fabric{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            {fabricId != null && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                disabled={disabled}
                onClick={() => onFabricChange(null)}
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {fabrics.map((fabric) => {
              const available = fabric.isAvailable;
              const selected = fabricId === fabric.id;
              return (
                <button
                  key={fabric.id}
                  type="button"
                  disabled={disabled || !available}
                  onClick={() => {
                    if (available) onFabricChange(selected ? null : fabric.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                    !available && "cursor-not-allowed opacity-50 border-dashed",
                    available && selected && "border-primary bg-muted",
                    available &&
                      !selected &&
                      "border-border hover:bg-muted/50",
                  )}
                >
                  <span
                    className="size-3 rounded-full border border-border"
                    style={{ backgroundColor: fabric.color }}
                    aria-hidden
                  />
                  {fabric.name}
                </button>
              );
            })}
          </div>
          {selectableFabrics.length === 0 && (
            <p className="text-xs text-destructive">
              No fabrics are currently available for this product.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
