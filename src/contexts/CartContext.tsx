import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import {
  clearStoredCart,
  getStoredCart,
  setStoredCart,
} from "@/lib/cart-storage";
import { queryKeys } from "@/lib/query-keys";
import {
  getCart,
  removeCartItem,
  setCartItemQuantity,
  upsertCartItem,
} from "@/services/shop-cart.service";
import type { CartItem, CartOrderItem } from "@/types/cart";
import { serverCartLineToCartItem } from "@/types/cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  isSyncing: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => void;
  getOrderItems: () => CartOrderItem[];
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const [guestItems, setGuestItems] = useState<CartItem[]>(() => getStoredCart());
  const [isSyncing, setIsSyncing] = useState(false);
  const mergeStartedRef = useRef(false);

  const cartQuery = useQuery({
    queryKey: queryKeys.shop.cart,
    queryFn: getCart,
    enabled: isAuthenticated && !authLoading,
  });

  const serverItems = useMemo(
    () => (cartQuery.data?.items ?? []).map(serverCartLineToCartItem),
    [cartQuery.data],
  );

  const items = isAuthenticated ? serverItems : guestItems;

  useEffect(() => {
    if (isAuthenticated) return;
    setStoredCart(guestItems);
  }, [guestItems, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      mergeStartedRef.current = false;
      setGuestItems(getStoredCart());
      return;
    }

    if (mergeStartedRef.current) return;
    mergeStartedRef.current = true;

    const localLines = getStoredCart();
    if (localLines.length === 0) return;

    void (async () => {
      setIsSyncing(true);
      try {
        for (const line of localLines) {
          await upsertCartItem({
            productId: line.productId,
            quantity: line.quantity,
          });
        }
        clearStoredCart();
        setGuestItems([]);
        await queryClient.invalidateQueries({ queryKey: queryKeys.shop.cart });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not sync your cart after login",
        );
      } finally {
        setIsSyncing(false);
      }
    })();
  }, [isAuthenticated, queryClient]);

  const invalidateCart = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.shop.cart });
  }, [queryClient]);

  const addItem = useCallback(
    async (item: Omit<CartItem, "quantity">, quantity = 1) => {
      if (isAuthenticated) {
        setIsSyncing(true);
        try {
          const existing = serverItems.find(
            (entry) => entry.productId === item.productId,
          );
          const nextQty = (existing?.quantity ?? 0) + quantity;
          await upsertCartItem({ productId: item.productId, quantity: nextQty });
          await invalidateCart();
        } finally {
          setIsSyncing(false);
        }
        return;
      }

      setGuestItems((current) => {
        const existing = current.find(
          (entry) => entry.productId === item.productId,
        );
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
    [isAuthenticated, serverItems, invalidateCart],
  );

  const updateQuantity = useCallback(
    async (productId: number, quantity: number) => {
      if (isAuthenticated) {
        setIsSyncing(true);
        try {
          if (quantity <= 0) {
            await removeCartItem(productId);
          } else {
            await setCartItemQuantity(productId, { quantity });
          }
          await invalidateCart();
        } finally {
          setIsSyncing(false);
        }
        return;
      }

      if (quantity <= 0) {
        setGuestItems((current) =>
          current.filter((entry) => entry.productId !== productId),
        );
        return;
      }

      setGuestItems((current) =>
        current.map((entry) =>
          entry.productId === productId ? { ...entry, quantity } : entry,
        ),
      );
    },
    [isAuthenticated, invalidateCart],
  );

  const removeItem = useCallback(
    async (productId: number) => {
      await updateQuantity(productId, 0);
    },
    [updateQuantity],
  );

  const clearCart = useCallback(() => {
    setGuestItems([]);
    clearStoredCart();
    if (isAuthenticated) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shop.cart });
    }
  }, [isAuthenticated, queryClient]);

  const getOrderItems = useCallback((): CartOrderItem[] => {
    return items.map(({ productId, quantity }) => ({ productId, quantity }));
  }, [items]);

  const itemCount = useMemo(
    () =>
      isAuthenticated
        ? (cartQuery.data?.itemCount ??
          items.reduce((total, item) => total + item.quantity, 0))
        : items.reduce((total, item) => total + item.quantity, 0),
    [isAuthenticated, cartQuery.data?.itemCount, items],
  );

  const subtotal = useMemo(() => {
    if (isAuthenticated && cartQuery.data?.subtotalAmount) {
      return parseFloat(cartQuery.data.subtotalAmount);
    }
    return items.reduce(
      (total, item) => total + parseFloat(item.price) * item.quantity,
      0,
    );
  }, [isAuthenticated, cartQuery.data?.subtotalAmount, items]);

  const isLoading =
    isAuthenticated && !authLoading && cartQuery.isLoading;

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      isLoading,
      isSyncing,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getOrderItems,
    }),
    [
      items,
      itemCount,
      subtotal,
      isLoading,
      isSyncing,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getOrderItems,
    ],
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
