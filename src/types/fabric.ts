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
};

export function isProductFabricAvailable(fabric: ProductFabric): boolean {
  return fabric.isAvailable;
}

export function getSelectableProductFabrics(
  fabrics: ProductFabric[] | undefined | null,
): ProductFabric[] {
  return (fabrics ?? []).filter(isProductFabricAvailable);
}

export type ListFabricsParams = {
  page?: number;
  limit?: number;
  isActive?: boolean;
  name?: string;
};

export type CreateFabricPayload = {
  name: string;
  slug: string;
  color: string;
  isActive?: boolean;
};

export type UpdateFabricPayload = Partial<CreateFabricPayload>;

export type FabricFormValues = {
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
};
