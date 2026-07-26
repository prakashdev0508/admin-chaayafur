import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateFabricPayload,
  ListFabricsParams,
  UpdateFabricPayload,
  Fabric,
} from "@/types/fabric";

export function listFabrics(params: ListFabricsParams = {}) {
  return apiRequest<PaginatedResponse<Fabric>>(
    `/fabrics${buildQueryString(params)}`,
  );
}

export function getFabric(id: number) {
  return apiRequest<Fabric>(`/fabrics/${id}`);
}

export function createFabric(payload: CreateFabricPayload) {
  return apiRequest<Fabric>("/fabrics", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateFabric(id: number, payload: UpdateFabricPayload) {
  return apiRequest<Fabric>(`/fabrics/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
