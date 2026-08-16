import { cn } from "@/lib/utils";
import {
  getCartLineMaterialChips,
  type CartMaterialChip,
} from "@/types/cart";

type CartMaterialChipsProps = {
  item: Parameters<typeof getCartLineMaterialChips>[0];
  className?: string;
  size?: "sm" | "md";
};

export function CartMaterialChips({
  item,
  className,
  size = "sm",
}: CartMaterialChipsProps) {
  const chips = getCartLineMaterialChips(item);
  if (chips.length === 0) return null;

  const isSm = size === "sm";

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {chips.map((chip: CartMaterialChip) => (
        <span
          key={`${chip.label}-${chip.name}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border font-medium",
            isSm
              ? "border-[#D9CBB8] bg-[#FAF7F2] px-2 py-0.5 text-[11px]"
              : "border-border bg-muted/40 px-2.5 py-1 text-xs",
          )}
        >
          {chip.image ? (
            <img
              src={chip.image}
              alt=""
              className={cn(
                "rounded-full object-cover",
                isSm ? "size-2" : "size-2.5",
              )}
            />
          ) : chip.color ? (
            <span
              className={cn(
                "rounded-full border border-black/10",
                isSm ? "size-2" : "size-2.5",
              )}
              style={{ backgroundColor: chip.color }}
              aria-hidden
            />
          ) : null}
          <span className="text-muted-foreground">{chip.label}:</span>
          {chip.name}
          {chip.priceAdjustmentLabel && (
            <span className="text-muted-foreground">
              {chip.priceAdjustmentLabel}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
