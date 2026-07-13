import type { CartItem } from "@/types/cart";

const STORAGE_KEY = "chaya_shop_cart";

export function getStoredCart(): CartItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function setStoredCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearStoredCart() {
  localStorage.removeItem(STORAGE_KEY);
}
