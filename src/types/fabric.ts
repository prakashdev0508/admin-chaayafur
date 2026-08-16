export type Fabric = {
  id: number;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** Fabric option as returned on a product payload. */
export type ProductFabric = {
  id: number;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
  isAvailable: boolean;
  priceAdjustment?: string;
};
