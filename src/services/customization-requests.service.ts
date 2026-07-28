import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  ConvertCustomizationRequestPayload,
  ConvertCustomizationRequestResult,
  CustomizationRequest,
  ListCustomizationRequestsParams,
  RejectCustomizationRequestPayload,
  UpdateCustomizationRequestPayload,
} from "@/types/customization-request";

export function listCustomizationRequests(
  params: ListCustomizationRequestsParams = {},
) {
  return apiRequest<PaginatedResponse<CustomizationRequest>>(
    `/admin/customization-requests${buildQueryString(params)}`,
  );
}

export function getCustomizationRequest(id: number) {
  return apiRequest<CustomizationRequest>(
    `/admin/customization-requests/${id}`,
  );
}

export function updateCustomizationRequest(
  id: number,
  payload: UpdateCustomizationRequestPayload,
) {
  return apiRequest<CustomizationRequest>(
    `/admin/customization-requests/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function approveCustomizationRequest(id: number) {
  return apiRequest<CustomizationRequest>(
    `/admin/customization-requests/${id}/approve`,
    { method: "POST" },
  );
}

export function rejectCustomizationRequest(
  id: number,
  payload: RejectCustomizationRequestPayload = {},
) {
  return apiRequest<CustomizationRequest>(
    `/admin/customization-requests/${id}/reject`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function convertCustomizationRequestToOrder(
  id: number,
  payload: ConvertCustomizationRequestPayload,
) {
  return apiRequest<ConvertCustomizationRequestResult>(
    `/admin/customization-requests/${id}/convert-to-order`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
