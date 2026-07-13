import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  Customer,
  CustomerListItem,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  ListCustomersParams,
  ListCustomerOrdersParams,
} from "@/types/customer";
import type {
  CreateAddressPayload,
  UpdateAddressPayload,
} from "@/types/address";
import type { OrderListItem } from "@/types/order";

export function listCustomers(params: ListCustomersParams = {}) {
  return apiRequest<PaginatedResponse<CustomerListItem>>(
    `/customers${buildQueryString(params)}`,
  );
}

export function getCustomer(id: number) {
  return apiRequest<Customer>(`/customers/${id}`);
}

export function createCustomer(payload: CreateCustomerPayload) {
  return apiRequest<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCustomer(id: number, payload: UpdateCustomerPayload) {
  return apiRequest<Customer>(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listCustomerOrders(
  customerId: number,
  params: ListCustomerOrdersParams = {},
) {
  return apiRequest<PaginatedResponse<OrderListItem>>(
    `/customers/${customerId}/orders${buildQueryString(params)}`,
  );
}

export function createCustomerAddress(
  customerId: number,
  payload: CreateAddressPayload,
) {
  return apiRequest(`/customers/${customerId}/addresses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCustomerAddress(
  customerId: number,
  addressId: number,
  payload: UpdateAddressPayload,
) {
  return apiRequest(`/customers/${customerId}/addresses/${addressId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCustomerAddress(customerId: number, addressId: number) {
  return apiRequest(`/customers/${customerId}/addresses/${addressId}`, {
    method: "DELETE",
  });
}

export function blockCustomer(customerId: number) {
  return apiRequest<Customer>(`/customers/${customerId}/block`, {
    method: "POST",
  });
}

export function unblockCustomer(customerId: number) {
  return apiRequest<Customer>(`/customers/${customerId}/unblock`, {
    method: "POST",
  });
}
