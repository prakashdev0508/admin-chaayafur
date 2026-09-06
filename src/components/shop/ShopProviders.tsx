import { Outlet } from "react-router-dom";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import { CartProvider } from "@/contexts/CartContext";

/** Customer auth + cart only mount under /shop — never on admin routes. */
export function ShopProviders() {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </CustomerAuthProvider>
  );
}
