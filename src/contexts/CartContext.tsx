import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredCart,
  getStoredCart,
  setStoredCart,
} from "@/lib/cart-storage";
import type { CartItem, CartOrderItem } from "@/types/cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  getOrderItems: () => CartOrderItem[];
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => getStoredCart());

  useEffect(() => {
    setStoredCart(items);
  }, [items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((current) => {
        const existing = current.find((entry) => entry.productId === item.productId);
        if (existing) {
          return current.map((entry) =>
            entry.productId === item.productId
              ? { ...entry, ...item, quantity: entry.quantity + quantity }
              : entry,
          );
        }
        return [...current, { ...item, quantity }];
      });
    },
    [],
  );

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((entry) => entry.productId !== productId));
      return;
    }

    setItems((current) =>
      current.map((entry) =>
        entry.productId === productId ? { ...entry, quantity } : entry,
      ),
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((current) => current.filter((entry) => entry.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    clearStoredCart();
  }, []);

  const getOrderItems = useCallback((): CartOrderItem[] => {
    return items.map(({ productId, quantity }) => ({ productId, quantity }));
  }, [items]);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getOrderItems,
    }),
    [items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart, getOrderItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
