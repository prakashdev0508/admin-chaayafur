import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchCategoriesTree } from "@/services/categories.service";
import type { CategoryTreeItem } from "@/types/category";
import type { ProductSortBy, SortOrder } from "@/types/product";
import {
  PRODUCT_SORT_BY_ITEMS,
  PRODUCT_STOCK_FILTER_ITEMS,
  PRODUCT_VISIBILITY_FILTER_ITEMS,
  SORT_ORDER_ITEMS,
} from "@/lib/select-items";

export type ProductFilters = {
  name: string;
  minPrice: string;
  maxPrice: string;
  category: string;
  subCategoryId: string;
  active: string;
  stock: string;
  sortBy: ProductSortBy;
  sortOrder: SortOrder;
};

export const defaultProductFilters: ProductFilters = {
  name: "",
  minPrice: "",
  maxPrice: "",
  category: "all",
  subCategoryId: "all",
  active: "all",
  stock: "all",
  sortBy: "createdAt",
  sortOrder: "desc",
};

type ProductFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ProductFilters;
  onDraftChange: (filters: ProductFilters) => void;
  onApply: () => void;
  onClear: () => void;
};

export function ProductFilterSheet({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onApply,
  onClear,
}: ProductFilterSheetProps) {
  const [categoriesTree, setCategoriesTree] = useState<CategoryTreeItem[]>([]);

  useEffect(() => {
    if (open) {
      fetchCategoriesTree()
        .then(setCategoriesTree)
        .catch(() => setCategoriesTree([]));
    }
  }, [open]);

  const categories = [
    { value: "all", label: "All categories" },
    ...categoriesTree.map((cat) => ({
      value: cat.slug,
      label: cat.name,
    })),
  ];

  const allSubCategories = categoriesTree.flatMap((cat) =>
    cat.subCategories.map((sub) => ({
      ...sub,
      categorySlug: cat.slug,
    })),
  );

  const subCategories =
    draft.category === "all"
      ? allSubCategories
      : allSubCategories.filter((s) => s.categorySlug === draft.category);

  const categoryItems = useMemo(() => categories, [categories]);

  const subCategoryItems = useMemo(
    () => [
      { value: "all", label: "All sub-categories" },
      ...subCategories.map((sub) => ({
        value: String(sub.id),
        label: sub.name,
      })),
    ],
    [subCategories],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Narrow down your product catalog
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 px-4">
          <div className="space-y-2">
            <Label htmlFor="filter-name">Product name</Label>
            <Input
              id="filter-name"
              value={draft.name}
              onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
              placeholder="Search by name..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="filter-min-price">Min price (₹)</Label>
              <Input
                id="filter-min-price"
                type="number"
                min="0"
                value={draft.minPrice}
                onChange={(e) =>
                  onDraftChange({ ...draft, minPrice: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-max-price">Max price (₹)</Label>
              <Input
                id="filter-max-price"
                type="number"
                min="0"
                value={draft.maxPrice}
                onChange={(e) =>
                  onDraftChange({ ...draft, maxPrice: e.target.value })
                }
                placeholder="Any"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={draft.category}
              onValueChange={(value) => {
                if (!value) return;
                onDraftChange({
                  ...draft,
                  category: value,
                  subCategoryId: "all",
                });
              }}
              items={categoryItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sub-category</Label>
            <Select
              value={draft.subCategoryId}
              onValueChange={(value) => {
                if (!value) return;
                onDraftChange({ ...draft, subCategoryId: value });
              }}
              items={subCategoryItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sub-categories</SelectItem>
                {subCategories.map((sub) => (
                  <SelectItem key={sub.id} value={String(sub.id)}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={draft.active}
              onValueChange={(value) => {
                if (!value) return;
                onDraftChange({ ...draft, active: value });
              }}
              items={PRODUCT_VISIBILITY_FILTER_ITEMS}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="inactive">Inactive only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stock</Label>
            <Select
              value={draft.stock}
              onValueChange={(value) => {
                if (!value) return;
                onDraftChange({ ...draft, stock: value });
              }}
              items={PRODUCT_STOCK_FILTER_ITEMS}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock levels</SelectItem>
                <SelectItem value="in_stock">In stock</SelectItem>
                <SelectItem value="low_stock">Low stock</SelectItem>
                <SelectItem value="out_of_stock">Out of stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Sort by</Label>
              <Select
                value={draft.sortBy}
                onValueChange={(value) => {
                  if (!value) return;
                  onDraftChange({
                    ...draft,
                    sortBy: value as ProductSortBy,
                  });
                }}
                items={PRODUCT_SORT_BY_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Select
                value={draft.sortOrder}
                onValueChange={(value) => {
                  if (!value) return;
                  onDraftChange({
                    ...draft,
                    sortOrder: value as SortOrder,
                  });
                }}
                items={SORT_ORDER_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={onClear}>
            Clear
          </Button>
          <Button className="flex-1" onClick={onApply}>
            Apply filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
