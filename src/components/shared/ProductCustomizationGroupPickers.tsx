import { cn } from "@/lib/utils";
import { formatPriceAdjustment } from "@/lib/customization-pricing";
import {
  groupProductCustomization,
  type CustomizationSelection,
} from "@/lib/product-customization";
import type { ProductCustomizationOption } from "@/types/product";

type ProductCustomizationGroupPickersProps = {
  options: ProductCustomizationOption[] | null | undefined;
  selection: CustomizationSelection;
  onChange: (selection: CustomizationSelection) => void;
  variant?: "admin" | "shop";
  disabled?: boolean;
};

export function ProductCustomizationGroupPickers({
  options,
  selection,
  onChange,
  variant = "admin",
  disabled,
}: ProductCustomizationGroupPickersProps) {
  const groups = groupProductCustomization(options);
  if (groups.length === 0) return null;

  const isShop = variant === "shop";

  function toggle(groupName: string, value: string) {
    if (disabled) return;
    const current = selection[groupName];
    const next = { ...selection };
    if (current === value) {
      delete next[groupName];
    } else {
      next[groupName] = value;
    }
    onChange(next);
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const selectedValue = selection[group.groupName];
        return (
          <div key={group.groupName} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p
                className={cn(
                  "text-sm font-medium",
                  isShop ? "text-[#1F1610]" : undefined,
                )}
              >
                {group.groupName}
                <span
                  className={cn(
                    "ml-1 font-normal",
                    isShop ? "text-[#9A8B7A]" : "text-muted-foreground",
                  )}
                >
                  (optional)
                </span>
              </p>
              {selectedValue != null && (
                <button
                  type="button"
                  className={cn(
                    "text-xs underline-offset-2 hover:underline",
                    isShop ? "text-[#9A8B7A]" : "text-muted-foreground",
                  )}
                  disabled={disabled}
                  onClick={() => {
                    const next = { ...selection };
                    delete next[group.groupName];
                    onChange(next);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const selected = selectedValue === option.value;
                const adj = formatPriceAdjustment(option.price);
                return (
                  <button
                    key={`${option.groupName}-${option.value}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(option.groupName, option.value)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      isShop
                        ? selected
                          ? "border-[#1F1610] bg-[#1F1610] text-white"
                          : "border-[#E8DFD3] bg-white text-[#6B5C4F] hover:border-[#C9B59A]"
                        : selected
                          ? "border-foreground bg-muted text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    {option.image ? (
                      <img
                        src={option.image}
                        alt=""
                        className="size-3.5 rounded-full object-cover"
                      />
                    ) : null}
                    <span>{option.value}</span>
                    {adj && (
                      <span
                        className={cn(
                          "text-xs",
                          isShop
                            ? selected
                              ? "text-white/70"
                              : "text-[#9A8B7A]"
                            : "text-muted-foreground",
                        )}
                      >
                        {adj}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
