import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TrackingTimeline } from "@/components/shared/TrackingTimeline";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { getShopOrder, getShopOrderTracking } from "@/services/shop-orders.service";
import { verifyPayment } from "@/services/shop-payments.service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api";
import {
  canUseEmbeddedCheckout,
  canUsePaymentLink,
  startOrderPayment,
} from "@/lib/razorpay";
import { formatOrderAddressRef } from "@/lib/order-utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ShopOrderPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const [paying, setPaying] = useState(false);

  const orderQuery = useQuery({
    queryKey: queryKeys.shop.orders.detail(orderId),
    queryFn: () => getShopOrder(orderId),
    enabled: Number.isFinite(orderId),
  });

  const trackingQuery = useQuery({
    queryKey: queryKeys.shop.orders.tracking(orderId),
    queryFn: () => getShopOrderTracking(orderId),
    enabled: Number.isFinite(orderId),
    refetchInterval: (query) =>
      query.state.data?.currentStatus === "PENDING" ? 4000 : false,
  });

  const order = orderQuery.data;
  const tracking = trackingQuery.data;
  const canRetryPayment =
    order?.status === "PENDING" && order.payment.status === "PENDING";
  const showEmbeddedRetry =
    canRetryPayment && order && canUseEmbeddedCheckout(order.payment);
  const showLinkRetry =
    canRetryPayment && order && canUsePaymentLink(order.payment);

  useEffect(() => {
    if (tracking?.currentStatus !== "PENDING") return;
    void orderQuery.refetch();
  }, [tracking?.currentStatus, orderQuery]);

  async function handleRetryPayment() {
    if (!order) return;

    setPaying(true);
    try {
      await startOrderPayment({
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
            void orderQuery.refetch();
            void trackingQuery.refetch();
          } catch (error) {
            toast.error(
              error instanceof ApiError
                ? error.message
                : "Payment received but verification failed",
            );
            void trackingQuery.refetch();
          }
        },
        onDismiss: () => toast.message("Payment cancelled"),
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not open payment");
    } finally {
      setPaying(false);
    }
  }

  function handlePayWithLink() {
    if (!order?.payment.paymentLinkUrl) return;
    window.location.href = order.payment.paymentLinkUrl;
  }

  if (orderQuery.isLoading) {
    return <TrackingTimeline loading />;
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E8DFD3] p-10 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Link
          to="/shop/account"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
        >
          Back to account
        </Link>
      </div>
    );
  }

  const deliveryAddress = order.shippingAddressRef
    ? formatOrderAddressRef(order.shippingAddressRef)
    : order.shippingAddress;

  const hasDiscount = parseFloat(order.discountAmount) > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
            Order
          </p>
          <h1 className="text-3xl font-medium text-[#3D2B1F]">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
          {order.coupon && (
            <p className="mt-1 text-sm text-[#5C7A4A]">
              Coupon applied: {order.coupon.code}
            </p>
          )}
        </div>

        {canRetryPayment && (
          <div className="flex flex-wrap gap-2">
            {showEmbeddedRetry && (
              <Button
                className="bg-[#8B5E3C] hover:bg-[#744C31]"
                disabled={paying}
                onClick={() => void handleRetryPayment()}
              >
                {paying ? "Opening payment..." : "Pay now"}
              </Button>
            )}
            {showLinkRetry && (
              <Button variant="outline" disabled={paying} onClick={handlePayWithLink}>
                Pay via Razorpay link
              </Button>
            )}
          </div>
        )}
      </div>

      <TrackingTimeline tracking={tracking} loading={trackingQuery.isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E8DFD3] bg-white p-5">
          <h2 className="text-lg font-medium text-[#3D2B1F]">Items</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-muted-foreground">
                    Qty {item.quantity} · {formatCurrency(item.price)} each
                  </p>
                </div>
                <p>{formatCurrency(parseFloat(item.price) * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-[#E8DFD3] pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotalAmount)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-[#5C7A4A]">
                <span>Discount</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span>Total paid</span>
              <span>{formatCurrency(order.payment.amount)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E8DFD3] bg-white p-5">
          <h2 className="text-lg font-medium text-[#3D2B1F]">Delivery</h2>
          {order.shippingAddressRef && (
            <p className="mt-4 font-medium">{order.shippingAddressRef.name}</p>
          )}
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {deliveryAddress}
          </p>
          {order.shippingAddressRef?.phone && (
            <p className="mt-2 text-sm text-muted-foreground">
              {order.shippingAddressRef.phone}
            </p>
          )}
          {order.invoice && (
            <div className="mt-4 rounded-lg bg-[#F8F1E8] p-3 text-sm">
              <p className="font-medium">Invoice {order.invoice.invoiceNumber}</p>
              <p className="text-muted-foreground">
                Issued {formatDate(order.invoice.issuedAt)} ·{" "}
                {formatCurrency(order.invoice.totalAmount)}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
