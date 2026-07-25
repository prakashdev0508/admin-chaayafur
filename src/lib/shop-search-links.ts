import type { LucideIcon } from "lucide-react";
import { FolderTree, Package } from "lucide-react";
import type { PublicSearchHit, PublicSearchHitType } from "@/types/search";

export const PUBLIC_SEARCH_TYPE_LABELS: Record<PublicSearchHitType, string> = {
  product: "Products",
  category: "Categories",
  subcategory: "Subcategories",
};

export const PUBLIC_SEARCH_TYPE_ICONS: Record<PublicSearchHitType, LucideIcon> = {
  product: Package,
  category: FolderTree,
  subcategory: FolderTree,
};

/** Map a public search hit to a shop SPA path. */
export function getShopSearchPath(hit: PublicSearchHit): string {
  switch (hit.type) {
    case "product":
      return `/shop/products/${hit.id}`;
    case "category":
      return `/shop/products?categoryId=${hit.id}&page=1`;
    case "subcategory":
      return `/shop/products?subCategoryId=${hit.id}&page=1`;
    default:
      return "/shop/products";
  }
}

export function groupPublicSearchHits(items: PublicSearchHit[]) {
  const groups: Partial<Record<PublicSearchHitType, PublicSearchHit[]>> = {};
  for (const item of items) {
    const list = groups[item.type] ?? [];
    list.push(item);
    groups[item.type] = list;
  }
  return groups;
}
