import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateCustomizationRequestPayload,
  CustomizationRequest,
  ListCustomizationRequestsParams,
} from "@/types/customization-request";

export function createCustomizationRequest(
  payload: CreateCustomizationRequestPayload,
) {
  return apiRequest<CustomizationRequest>(
    "/customization-requests",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "customer",
  );
}

export function listMyCustomizationRequests(
  params: ListCustomizationRequestsParams = {},
) {
  return apiRequest<PaginatedResponse<CustomizationRequest>>(
    `/customization-requests${buildQueryString(params)}`,
    {},
    "customer",
  );
}

export function getMyCustomizationRequest(id: number) {
  return apiRequest<CustomizationRequest>(
    `/customization-requests/${id}`,
    {},
    "customer",
  );
}
