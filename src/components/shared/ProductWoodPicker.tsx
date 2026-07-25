import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getProduct } from "@/services/products.service";
import {
  getSelectableProductWoods,
  productRequiresWood,
} from "@/types/wood";

type ProductWoodPickerProps = {
  productId: number | null;
  value: number | null;
  onChange: (woodId: number | null) => void;
  disabled?: boolean;
};

/**
 * Loads product detail woods. Shows all assigned options; only
 * `isAvailable: true` woods are selectable.
 */
export function ProductWoodPicker({
  productId,
  value,
  onChange,
  disabled,
}: ProductWoodPickerProps) {
  const productQuery = useQuery({
    queryKey: ["product-wood-picker", productId],
    queryFn: () => getProduct(productId!),
    enabled: productId != null && productId > 0,
  });

  const woods = productQuery.data?.woods ?? [];
  const selectableWoods = getSelectableProductWoods(woods);

  if (productId == null) return null;

  if (productQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading woods…</p>;
  }

  if (woods.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>Wood</Label>
      <div className="flex flex-wrap gap-2">
        {woods.map((wood) => {
          const available = wood.isAvailable;
          const selected = value === wood.id;
          return (
            <button
              key={wood.id}
              type="button"
              disabled={disabled || !available}
              onClick={() => {
                if (available) onChange(wood.id);
              }}
              title={
                available ? wood.name : `${wood.name} — not available now`
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                !available && "cursor-not-allowed opacity-50 border-dashed",
                available && selected && "border-primary bg-muted",
                available && !selected && "border-border hover:bg-muted/50",
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
      {woods.some((w) => !w.isAvailable) && selectableWoods.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Unavailable woods are shown but cannot be selected.
        </p>
      )}
      {woods.length > 0 && selectableWoods.length === 0 && (
        <p className="text-xs text-destructive">
          No woods are currently available for this product.
        </p>
      )}
    </div>
  );
}

export function useProductRequiresWood(productId: number | null) {
  const productQuery = useQuery({
    queryKey: ["product-wood-picker", productId],
    queryFn: () => getProduct(productId!),
    enabled: productId != null && productId > 0,
  });
  return {
    requiresWood: productRequiresWood(productQuery.data?.woods),
    isLoading: productQuery.isLoading && productId != null,
  };
}

export function useWoodSelection(productId: number | null) {
  const [woodId, setWoodId] = useState<number | null>(null);
  const { requiresWood, isLoading } = useProductRequiresWood(productId);

  useEffect(() => {
    setWoodId(null);
  }, [productId]);

  return { woodId, setWoodId, requiresWood, isLoading };
}
