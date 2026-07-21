import { apiRequest } from "@/lib/api";
import type { CartResponse } from "@/types/cart";

export function getCart() {
  return apiRequest<CartResponse>("/cart", {}, "customer");
}

export function upsertCartItem(payload: { productId: number; quantity: number }) {
  return apiRequest<CartResponse>("/cart/items", {
    method: "POST",
    body: JSON.stringify(payload),
  }, "customer");
}

export function setCartItemQuantity(
  productId: number,
  payload: { quantity: number },
) {
  return apiRequest<CartResponse>(`/cart/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, "customer");
}

export function removeCartItem(productId: number) {
  return apiRequest<CartResponse>(`/cart/items/${productId}`, {
    method: "DELETE",
  }, "customer");
}
