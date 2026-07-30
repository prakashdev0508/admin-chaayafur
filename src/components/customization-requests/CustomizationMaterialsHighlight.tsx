import { cn } from "@/lib/utils";

export type MaterialChip = {
  label: string;
  name: string;
  color?: string | null;
  /** Formatted adjustment e.g. "+₹500" when > 0. */
  priceAdjustmentLabel?: string | null;
};

type CustomizationMaterialsHighlightProps = {
  materials: MaterialChip[];
  title?: string;
  className?: string;
  variant?: "admin" | "shop";
};

export function CustomizationMaterialsHighlight({
  materials,
  title = "Materials & finish",
  className,
  variant = "admin",
}: CustomizationMaterialsHighlightProps) {
  if (materials.length === 0) return null;

  const isShop = variant === "shop";

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        isShop
          ? "border-[#E8DFD3] bg-[#F8F1E8]"
          : "border-amber-200/80 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30",
        className,
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          isShop ? "text-[#8B5E3C]" : "text-amber-900 dark:text-amber-200",
        )}
      >
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {materials.map((material) => (
          <span
            key={`${material.label}-${material.name}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm",
              isShop
                ? "border-[#D9CBB8] bg-white text-[#3D2B1F]"
                : "border-amber-200/80 bg-white text-foreground dark:border-amber-800 dark:bg-background",
            )}
          >
            {material.color && (
              <span
                className="size-3.5 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: material.color }}
                aria-hidden
              />
            )}
            <span className="text-xs font-normal text-muted-foreground">
              {material.label}
            </span>
            <span>{material.name}</span>
            {material.priceAdjustmentLabel && (
              <span className="text-xs font-normal text-muted-foreground">
                {material.priceAdjustmentLabel}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export function materialChip(
  label: string,
  name: string,
  color?: string | null,
  priceAdjustmentLabel?: string | null,
): MaterialChip {
  return { label, name, color, priceAdjustmentLabel };
}
