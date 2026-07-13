import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AddressPicker } from "@/components/shop/AddressPicker";
import { CouponInput } from "@/components/shop/CouponInput";
import { OTPLoginDialog } from "@/components/shop/OTPLoginDialog";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { ApiError } from "@/lib/api";
import { startOrderPayment } from "@/lib/razorpay";
import { formatCurrency } from "@/lib/format";
import { createShopOrder } from "@/services/shop-orders.service";
import { verifyPayment } from "@/services/shop-payments.service";
import type { ValidateCouponResponse } from "@/services/shop-coupons.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, getOrderItems, clearCart } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const [loginOpen, setLoginOpen] = useState(!isAuthenticated);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [coupon, setCoupon] = useState<ValidateCouponResponse | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoginOpen(true);
    }
  }, [isAuthenticated]);

  const placeOrderMutation = useMutation({
    mutationFn: createShopOrder,
  });

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      toast.error("Select a shipping address");
      return;
    }

    setPlacingOrder(true);
    try {
      const order = await placeOrderMutation.mutateAsync({
        items: getOrderItems(),
        shippingAddressId: selectedAddressId,
        ...(coupon ? { couponCode: coupon.code } : {}),
      });

      clearCart();

      const paymentMode = await startOrderPayment({
        order,
        onSuccess: async (response) => {
          try {
            await verifyPayment({
              orderId: order.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Payment successful");
            navigate(`/shop/orders/${order.id}`);
          } catch (error) {
            toast.error(
              error instanceof ApiError
                ? error.message
                : "Payment received but verification failed. Check your order status.",
            );
            navigate(`/shop/orders/${order.id}`);
          }
        },
        onDismiss: () => {
          toast.message("Payment cancelled. Your order is saved as pending.");
          navigate(`/shop/orders/${order.id}`);
        },
      });

      if (paymentMode === "redirect") {
        toast.message("Redirecting to Razorpay to complete payment...");
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not place order");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#E8DFD3] bg-white p-12 text-center">
        <h1 className="text-2xl font-medium text-[#3D2B1F]">Nothing to checkout</h1>
        <p className="mt-2 text-muted-foreground">Add products to your cart first.</p>
        <Link
          to="/shop/products"
          className={cn(buttonVariants(), "mt-6 bg-[#8B5E3C] hover:bg-[#744C31]")}
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium text-[#3D2B1F]">Checkout</h1>
        <p className="mt-2 text-muted-foreground">
          Confirm your address, apply a coupon, and pay securely with Razorpay.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {isAuthenticated ? (
            <AddressPicker
              selectedId={selectedAddressId}
              onSelect={setSelectedAddressId}
            />
          ) : (
            <div className="rounded-xl border border-[#E8DFD3] bg-white p-5">
              <p className="text-sm text-muted-foreground">
                Login with OTP to save your delivery address.
              </p>
              <Button
                className="mt-4 bg-[#8B5E3C] hover:bg-[#744C31]"
                onClick={() => setLoginOpen(true)}
              >
                Login with OTP
              </Button>
            </div>
          )}

          {isAuthenticated && <CouponInput onValidated={setCoupon} />}
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-[#E8DFD3] bg-white p-5">
          <h2 className="text-lg font-medium text-[#3D2B1F]">Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {item.name} × {item.quantity}
                </span>
                <span>{formatCurrency(parseFloat(item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E8DFD3] pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {coupon && (
              <div className="mt-2 flex justify-between text-sm text-[#5C7A4A]">
                <span>Discount ({coupon.code})</span>
                <span>-{formatCurrency(coupon.discountAmount)}</span>
              </div>
            )}
            <div className="mt-3 flex justify-between font-medium">
              <span>Estimated total</span>
              <span>{formatCurrency(coupon?.totalAmount ?? subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Final amount is confirmed server-side at checkout.
            </p>
          </div>

          <Button
            className="w-full bg-[#8B5E3C] hover:bg-[#744C31]"
            disabled={!isAuthenticated || !selectedAddressId || placingOrder}
            onClick={() => void handlePlaceOrder()}
          >
            {placingOrder ? "Processing..." : "Pay with Razorpay"}
          </Button>
        </aside>
      </div>

      <OTPLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
