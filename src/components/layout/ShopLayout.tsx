import { Link, NavLink, Outlet } from "react-router-dom";
import { ShoppingBag, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { buttonVariants } from "@/components/ui/button";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/format";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium transition-colors hover:text-foreground",
    isActive ? "text-foreground" : "text-muted-foreground",
  );

export function ShopLayout() {
  const { itemCount } = useCart();
  const { isAuthenticated, user } = useCustomerAuth();

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] text-foreground">
      <header className="sticky top-0 z-40 border-b border-[#E8DFD3] bg-[#FAF7F2]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/shop" className="font-serif text-xl tracking-tight text-[#3D2B1F]">
            Chaaya Furnitures
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/shop" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/shop/products" className={navLinkClass}>
              Products
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to={isAuthenticated ? "/shop/account" : "/shop/cart?login=1"}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <User className="size-4" />
              <span className="hidden sm:inline">
                {isAuthenticated && user ? formatPhone(user.phone) : "Login"}
              </span>
            </Link>

            <Link
              to="/shop/cart"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "relative border-[#D9CBB8]",
              )}
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-[#8B5E3C] text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-[#E8DFD3] bg-[#F3EBE0]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Chaaya Furnitures</p>
          <div className="flex gap-4">
            <Link to="/shop/products" className="hover:text-foreground">
              Shop
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Admin
            </Link>
          </div>
        </div>
      </footer>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
