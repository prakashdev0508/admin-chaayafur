import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { OTPLoginDialog } from "@/components/shop/OTPLoginDialog";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("login") === "1" && !isAuthenticated) {
      setLoginOpen(true);
    }
  }, [searchParams, isAuthenticated]);

  useEffect(() => {
    const state = location.state as { requireLogin?: boolean } | null;
    if (state?.requireLogin && !isAuthenticated) {
      setLoginOpen(true);
    }
  }, [location.state, isAuthenticated]);

  function handleCheckout() {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    navigate("/shop/checkout");
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#E8DFD3] bg-white p-12 text-center">
        <h1 className="text-2xl font-medium text-[#3D2B1F]">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Browse products and add something you love.
        </p>
        <Link
          to="/shop/products"
          className={cn(buttonVariants(), "mt-6 bg-[#8B5E3C] hover:bg-[#744C31]")}
        >
          Shop products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <h1 className="text-3xl font-medium text-[#3D2B1F]">Cart ({itemCount})</h1>

        {items.map((item) => (
          <div
            key={item.productId}
            className="flex gap-4 rounded-2xl border border-[#E8DFD3] bg-white p-4"
          >
            <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-[#F3EBE0]">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
              ) : null}
            </div>

            <div className="flex flex-1 flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/shop/products/${item.productId}`}
                    className="font-medium text-[#3D2B1F] hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-[#8B5E3C]">{formatCurrency(item.price)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeItem(item.productId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-2xl border border-[#E8DFD3] bg-white p-5">
        <h2 className="text-lg font-medium text-[#3D2B1F]">Order summary</h2>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Shipping and final total are confirmed at checkout.
        </p>
        <Button
          className="mt-5 w-full bg-[#8B5E3C] hover:bg-[#744C31]"
          onClick={handleCheckout}
        >
          {isAuthenticated ? "Proceed to checkout" : "Login & checkout"}
        </Button>
      </aside>

      <OTPLoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={() => navigate("/shop/checkout")}
      />
    </div>
  );
}
