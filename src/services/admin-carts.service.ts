import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  AdminCartDetail,
  AdminCartListItem,
  ListAdminCartsParams,
  SeedAdminCartPayload,
  UpsertAdminCartItemPayload,
} from "@/types/cart";

export function listAdminCarts(params: ListAdminCartsParams = {}) {
  return apiRequest<PaginatedResponse<AdminCartListItem>>(
    `/carts${buildQueryString(params)}`,
  );
}

export function getAdminCart(cartId: number) {
  return apiRequest<AdminCartDetail>(`/carts/${cartId}`);
}

/** Get-or-create customer cart and upsert a line. */
export function seedAdminCart(payload: SeedAdminCartPayload) {
  return apiRequest<AdminCartDetail>("/carts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function upsertAdminCartItem(
  cartId: number,
  payload: UpsertAdminCartItemPayload,
) {
  return apiRequest<AdminCartDetail>(`/carts/${cartId}/items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function setAdminCartItemQuantity(
  cartId: number,
  productId: number,
  payload: { quantity: number },
) {
  return apiRequest<AdminCartDetail>(
    `/carts/${cartId}/items/${productId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function removeAdminCartItem(cartId: number, productId: number) {
  return apiRequest<AdminCartDetail>(`/carts/${cartId}/items/${productId}`, {
    method: "DELETE",
  });
}
