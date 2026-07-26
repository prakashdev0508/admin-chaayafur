export type WoodPolish = {
  id: number;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
};

export type WoodPolishInput = {
  name: string;
  slug: string;
  color: string;
  isActive?: boolean;
};

export type Wood = {
  id: number;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
  polishes?: WoodPolish[];
  createdAt?: string;
  updatedAt?: string;
};

/** Wood option as returned on a product payload. */
export type ProductWood = {
  id: number;
  name: string;
  slug: string;
  color: string;
  /** Product-assignment active flag (admin / detail). */
  isActive: boolean;
  /**
   * Selectable at cart/checkout when true (assignment + global wood both active).
   * Detail may return `false` for UI (“offered but not available now”).
   * List responses only include available woods.
   */
  isAvailable: boolean;
  /** Active polishes for storefront browsing (not persisted on cart yet). */
  polishes?: WoodPolish[];
};

/** True when the wood can be chosen for cart/checkout. */
export function isProductWoodAvailable(wood: ProductWood): boolean {
  return wood.isAvailable;
}

/** Woods that may be selected (optional customization). */
export function getSelectableProductWoods(
  woods: ProductWood[] | undefined | null,
): ProductWood[] {
  return (woods ?? []).filter(isProductWoodAvailable);
}

/**
 * @deprecated Wood is optional on cart; prefer getSelectableProductWoods.
 * Kept for call sites that still check “has selectable woods”.
 */
export function productRequiresWood(
  woods: ProductWood[] | undefined | null,
): boolean {
  return getSelectableProductWoods(woods).length > 0;
}

export type ProductWoodAssignment = {
  woodId: number;
  isActive?: boolean;
};

export type ListWoodsParams = {
  page?: number;
  limit?: number;
  isActive?: boolean;
  name?: string;
};

export type CreateWoodPayload = {
  name: string;
  slug: string;
  color: string;
  isActive?: boolean;
  polishes?: WoodPolishInput[];
};

export type UpdateWoodPayload = Partial<CreateWoodPayload> & {
  /** Omit = unchanged; `[]` = clear; non-empty = replace all. */
  polishes?: WoodPolishInput[];
};

export type WoodPolishFormEntry = {
  /** Local key for React lists (existing id or temp). */
  key: string;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
  slugTouched: boolean;
};

export type WoodFormValues = {
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
  polishes: WoodPolishFormEntry[];
};
