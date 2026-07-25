import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateWoodPayload,
  ListWoodsParams,
  UpdateWoodPayload,
  Wood,
} from "@/types/wood";

export function listWoods(params: ListWoodsParams = {}) {
  return apiRequest<PaginatedResponse<Wood>>(
    `/woods${buildQueryString(params)}`,
  );
}

export function getWood(id: number) {
  return apiRequest<Wood>(`/woods/${id}`);
}

export function createWood(payload: CreateWoodPayload) {
  return apiRequest<Wood>("/woods", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateWood(id: number, payload: UpdateWoodPayload) {
  return apiRequest<Wood>(`/woods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
