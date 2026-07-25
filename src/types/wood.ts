export type Wood = {
  id: number;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
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
};

/** True when the wood can be chosen for cart/checkout. */
export function isProductWoodAvailable(wood: ProductWood): boolean {
  return wood.isAvailable;
}

/** Woods that may be selected; empty means no woodId required. */
export function getSelectableProductWoods(
  woods: ProductWood[] | undefined | null,
): ProductWood[] {
  return (woods ?? []).filter(isProductWoodAvailable);
}

/** Product requires a woodId when at least one wood is selectable. */
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
};

export type UpdateWoodPayload = Partial<CreateWoodPayload>;

export type WoodFormValues = {
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
};
