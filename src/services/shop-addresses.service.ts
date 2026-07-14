import { apiRequest } from "@/lib/api";
import type {
  CreateAddressPayload,
  CustomerAddress,
  UpdateAddressPayload,
} from "@/types/address";

export function listCustomerAddresses() {
  return apiRequest<CustomerAddress[]>("/users/me/addresses", {}, "customer");
}

export function createCustomerAddress(payload: CreateAddressPayload) {
  return apiRequest<CustomerAddress>("/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  }, "customer");
}

export function updateCustomerAddress(id: number, payload: UpdateAddressPayload) {
  return apiRequest<CustomerAddress>(`/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, "customer");
}

export function deleteCustomerAddress(id: number) {
  return apiRequest<void>(`/addresses/${id}`, {
    method: "DELETE",
  }, "customer");
}
