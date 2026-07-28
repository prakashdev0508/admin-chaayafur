import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type {
  CartLineRef,
  CartResponse,
  UpsertCartItemPayload,
} from "@/types/cart";
import { cartLineQueryParams } from "@/types/cart";

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
  line: CartLineRef,
  payload: { quantity: number },
) {
  return apiRequest<CartResponse>(
    `/cart/items/${line.productId}${buildQueryString(cartLineQueryParams(line))}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    "customer",
  );
}

export function removeCartItem(line: CartLineRef) {
  return apiRequest<CartResponse>(
    `/cart/items/${line.productId}${buildQueryString(cartLineQueryParams(line))}`,
    {
      method: "DELETE",
    },
    "customer",
  );
}
