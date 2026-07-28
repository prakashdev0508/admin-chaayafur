import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type { Fabric } from "@/types/fabric";
import type { Wood } from "@/types/wood";

export async function listShopWoodCatalog() {
  return apiRequest<PaginatedResponse<Wood>>(
    "/woods?limit=100",
    {},
    "customer",
  );
}

export async function listShopFabricCatalog() {
  return apiRequest<PaginatedResponse<Fabric>>(
    "/fabrics?limit=100",
    {},
    "customer",
  );
}
