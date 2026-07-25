import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { CartResponse, UpsertCartItemPayload } from "@/types/cart";

export function getCart() {
  return apiRequest<CartResponse>("/cart", {}, "customer");
}

export function upsertCartItem(payload: UpsertCartItemPayload) {
  return apiRequest<CartResponse>(
    "/cart/items",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "customer",
  );
}

export function setCartItemQuantity(
  productId: number,
  payload: { quantity: number },
  woodId?: number | null,
) {
  return apiRequest<CartResponse>(
    `/cart/items/${productId}${buildQueryString({ woodId: woodId ?? undefined })}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    "customer",
  );
}

export function removeCartItem(
  productId: number,
  woodId?: number | null,
) {
  return apiRequest<CartResponse>(
    `/cart/items/${productId}${buildQueryString({ woodId: woodId ?? undefined })}`,
    {
      method: "DELETE",
    },
    "customer",
  );
}
