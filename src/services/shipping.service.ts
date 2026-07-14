import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  ListPincodesParams,
  ShippingPincode,
  ShippingQuote,
  ShippingQuoteParams,
  UpsertPincodesPayload,
} from "@/types/shipping";

export function getShippingQuote({ pincode, subtotal }: ShippingQuoteParams) {
  return apiRequest<ShippingQuote>(
    `/shipping/quote${buildQueryString({ pincode, subtotal })}`,
    {},
    false,
  );
}

export function listShippingPincodes(params: ListPincodesParams = {}) {
  return apiRequest<PaginatedResponse<ShippingPincode>>(
    `/admin/shipping/pincodes${buildQueryString(params)}`,
  );
}

export function upsertShippingPincodes(payload: UpsertPincodesPayload) {
  return apiRequest<ShippingPincode[]>("/admin/shipping/pincodes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteShippingPincode(pincode: string) {
  return apiRequest<{ pincode: string }>(
    `/admin/shipping/pincodes/${encodeURIComponent(pincode)}`,
    { method: "DELETE" },
  );
}
