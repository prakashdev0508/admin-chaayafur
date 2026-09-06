import { ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type MultiSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Optional section label inside the menu */
  menuLabel?: string;
  emptyMessage?: string;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled = false,
  className,
  menuLabel,
  emptyMessage = "No options available",
}: MultiSelectProps) {
  const selectedSet = new Set(value);
  const selectedOptions = options.filter((option) =>
    selectedSet.has(option.value),
  );

  const toggle = (optionValue: string, checked: boolean) => {
    const next = new Set(selectedSet);
    if (checked) next.add(optionValue);
    else next.delete(optionValue);
    onChange([...next]);
  };

  const clear = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onChange([]);
  };

  const summary =
    selectedOptions.length === 0
      ? null
      : selectedOptions.length <= 2
        ? selectedOptions.map((option) => option.label).join(", ")
        : `${selectedOptions
            .slice(0, 2)
            .map((option) => option.label)
            .join(", ")} +${selectedOptions.length - 2}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-auto min-h-10 w-full justify-between gap-2 px-3 py-2 font-normal",
              className,
            )}
          >
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-left",
                !summary && "text-muted-foreground",
              )}
            >
              {summary ?? placeholder}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {selectedOptions.length > 0 && !disabled ? (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear selection"
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={clear}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      clear(event as unknown as React.MouseEvent);
                    }
                  }}
                >
                  <X className="size-3.5" />
                </span>
              ) : null}
              <ChevronsUpDown className="size-4 opacity-50" />
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-(--anchor-width) min-w-56">
        {menuLabel ? (
          <>
            <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {options.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selectedSet.has(option.value)}
              disabled={option.disabled}
              onCheckedChange={(checked) =>
                toggle(option.value, Boolean(checked))
              }
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
