export type WoodPolish = {
  id: number;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
};

/** Polish option as returned on a product payload (nested under wood or top-level). */
export type ProductPolish = {
  id: number;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
  isAvailable: boolean;
  /** Product-level adjustment added to base price when selected. */
  priceAdjustment?: string;
  /** Present on top-level `product.polishes` responses. */
  woodId?: number;
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
  isActive: boolean;
  isAvailable: boolean;
  priceAdjustment?: string;
  polishes?: ProductPolish[];
};

export type ProductWoodAssignment = {
  woodId: number;
  isActive?: boolean;
  priceAdjustment?: number;
};

export type ProductPolishAssignment = {
  woodPolishId: number;
  isActive?: boolean;
  priceAdjustment?: number;
};
