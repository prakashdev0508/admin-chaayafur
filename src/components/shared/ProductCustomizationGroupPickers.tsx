import { cn } from "@/lib/utils";
import { formatPriceAdjustment } from "@/lib/customization-pricing";
import {
  groupProductCustomization,
  isCustomizationOptionActive,
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

  function toggle(groupName: string, value: string, available: boolean) {
    if (disabled || !available) return;
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
    <div className="space-y-6">
      {groups.map((group) => {
        const selectedValue = selection[group.groupName];
        const selectedIsAvailable = group.options.some(
          (option) =>
            option.value === selectedValue &&
            isCustomizationOptionActive(option),
        );
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
              {selectedIsAvailable && (
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.options.map((option) => {
                const available = isCustomizationOptionActive(option);
                const selected = available && selectedValue === option.value;
                const priceLabel = formatPriceAdjustment(option.price);
                return (
                  <button
                    key={`${option.groupName}-${option.value}`}
                    type="button"
                    disabled={disabled || !available}
                    aria-disabled={!available}
                    onClick={() =>
                      toggle(option.groupName, option.value, available)
                    }
                    className={cn(
                      "flex flex-col overflow-hidden rounded-xl border text-left transition-colors",
                      !available && "cursor-not-allowed",
                      isShop
                        ? selected
                          ? "border-[#1F1610] bg-white shadow-sm"
                          : "border-[#E8DFD3] bg-white hover:border-[#C9B59A] disabled:hover:border-[#E8DFD3]"
                        : selected
                          ? "border-foreground bg-background shadow-sm"
                          : "border-border bg-background hover:border-foreground/30 disabled:hover:border-border",
                    )}
                  >
                    <div
                      className={cn(
                        "relative aspect-4/3 overflow-hidden",
                        isShop ? "bg-[#F4EEE6]" : "bg-muted/40",
                      )}
                    >
                      {option.image ? (
                        <img
                          src={option.image}
                          alt=""
                          className={cn(
                            "size-full object-cover",
                            !available && "opacity-50",
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex size-full items-center justify-center text-lg font-medium",
                            isShop ? "text-[#C9B59A]" : "text-muted-foreground",
                            !available && "opacity-50",
                          )}
                        >
                          {option.value.trim().slice(0, 1).toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 px-3 py-2.5">
                      <span
                        className={cn(
                          "text-sm font-medium leading-snug",
                          isShop ? "text-[#1F1610]" : "text-foreground",
                          !available && "opacity-70",
                        )}
                      >
                        {option.value}
                      </span>
                      <span
                        className={cn(
                          "text-xs",
                          available
                            ? "tabular-nums text-muted-foreground"
                            : "text-muted-foreground",
                          available && isShop && "text-[#9A8B7A]",
                          !available && isShop && "text-[#9A8B7A]",
                        )}
                      >
                        {available
                          ? priceLabel
                            ? priceLabel
                            : "No extra charge"
                          : "Currently not available"}
                      </span>
                    </div>
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
