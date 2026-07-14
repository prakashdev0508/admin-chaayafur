import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  defaultProductFilters,
  type ProductFilters,
} from "@/components/products/ProductFilterSheet";
import { productTagLabels } from "@/lib/product-utils";
import type { CategoryTreeItem } from "@/types/category";
import type { ProductMerchandisingTag } from "@/types/product";

type ActiveFilterChip = {
  key: keyof ProductFilters;
  label: string;
};

function getActiveFilterChips(
  filters: ProductFilters,
  categoriesTree: CategoryTreeItem[],
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.name.trim()) {
    chips.push({ key: "name", label: `Name: ${filters.name.trim()}` });
  }

  if (filters.minPrice.trim()) {
    chips.push({ key: "minPrice", label: `Min price: ₹${filters.minPrice}` });
  }

  if (filters.maxPrice.trim()) {
    chips.push({ key: "maxPrice", label: `Max price: ₹${filters.maxPrice}` });
  }

  if (filters.category !== "all") {
    const category = categoriesTree.find((c) => c.slug === filters.category);
    chips.push({
      key: "category",
      label: `Category: ${category?.name ?? filters.category}`,
    });
  }

  if (filters.subCategoryId !== "all") {
    const sub = categoriesTree
      .flatMap((c) => c.subCategories)
      .find((s) => String(s.id) === filters.subCategoryId);
    chips.push({
      key: "subCategoryId",
      label: `Sub-category: ${sub?.name ?? filters.subCategoryId}`,
    });
  }

  if (filters.active !== "all") {
    const labels = { active: "Active only", inactive: "Inactive only" };
    chips.push({
      key: "active",
      label: labels[filters.active as keyof typeof labels] ?? filters.active,
    });
  }

  if (filters.stock !== "all") {
    const labels = {
      in_stock: "In stock",
      low_stock: "Low stock",
      out_of_stock: "Out of stock",
    };
    chips.push({
      key: "stock",
      label: labels[filters.stock as keyof typeof labels] ?? filters.stock,
    });
  }

  if (filters.tag !== "all") {
    chips.push({
      key: "tag",
      label: `Tag: ${productTagLabels[filters.tag as ProductMerchandisingTag] ?? filters.tag}`,
    });
  }

  if (filters.sortBy !== defaultProductFilters.sortBy) {
    const labels = { name: "Name", price: "Price", createdAt: "Date created" };
    chips.push({
      key: "sortBy",
      label: `Sort: ${labels[filters.sortBy as keyof typeof labels] ?? filters.sortBy}`,
    });
  }

  if (filters.sortOrder !== defaultProductFilters.sortOrder) {
    chips.push({
      key: "sortOrder",
      label: filters.sortOrder === "asc" ? "Ascending" : "Descending",
    });
  }

  return chips;
}

type ProductActiveFiltersProps = {
  filters: ProductFilters;
  categoriesTree: CategoryTreeItem[];
  onRemove: (key: keyof ProductFilters) => void;
  onClearAll: () => void;
};

export function ProductActiveFilters({
  filters,
  categoriesTree,
  onRemove,
  onClearAll,
}: ProductActiveFiltersProps) {
  const chips = getActiveFilterChips(filters, categoriesTree);

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Filters:</span>
      {chips.map((chip) => (
        <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}
