import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LifeBuoy, MessageCircleQuestion } from "lucide-react";
import { TrackingTimeline } from "@/components/shared/TrackingTimeline";
import { CreateSupportTicketDialog } from "@/components/shop/CreateSupportTicketDialog";
import { SupportTicketDetailSheet } from "@/components/shop/SupportTicketDetailSheet";
import { SupportTicketStatusBadge } from "@/components/support-tickets/SupportTicketStatusBadge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { getShopOrder, getShopOrderTracking } from "@/services/shop-orders.service";
import { listOrderSupportTickets } from "@/services/shop-support-tickets.service";
import { verifyPayment } from "@/services/shop-payments.service";
import { queryKeys } from "@/lib/query-keys";
import { supportTicketTypeLabels } from "@/lib/support-ticket-status";
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

import type { SupportTicketType } from "@/types/support-ticket";

export function ShopOrderPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const [paying, setPaying] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<SupportTicketType>("QUESTION");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

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

  const ticketsQuery = useQuery({
    queryKey: queryKeys.shop.supportTickets.byOrder(orderId),
    queryFn: async () => {
      const response = await listOrderSupportTickets(orderId);
      return response.items;
    },
    enabled: Number.isFinite(orderId),
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
  const canOpenSupport = order.status !== "CANCELLED";
  const tickets = ticketsQuery.data ?? [];

  function openCreateDialog(type: SupportTicketType) {
    setCreateDialogType(type);
    setCreateDialogOpen(true);
  }

  function openTicketDetail(ticketId: number) {
    setSelectedTicketId(ticketId);
    setDetailSheetOpen(true);
  }

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

      <section className="rounded-2xl border border-[#E8DFD3] bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-[#3D2B1F]">Support</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask a question or report a problem with this order.
            </p>
          </div>
          {canOpenSupport && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => openCreateDialog("QUESTION")}
              >
                <MessageCircleQuestion className="size-4" />
                Ask a question
              </Button>
              <Button
                className="bg-[#8B5E3C] hover:bg-[#744C31]"
                onClick={() => openCreateDialog("PROBLEM")}
              >
                <LifeBuoy className="size-4" />
                Report a problem
              </Button>
            </div>
          )}
        </div>

        {!canOpenSupport && (
          <p className="mt-4 text-sm text-muted-foreground">
            Support is not available for cancelled orders.
          </p>
        )}

        {canOpenSupport && (
          <div className="mt-4 space-y-3">
            {ticketsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading support tickets...</p>
            ) : tickets.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#E8DFD3] p-4 text-sm text-muted-foreground">
                No support tickets yet.
              </p>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => openTicketDetail(ticket.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#E8DFD3] p-4 text-left transition hover:border-[#C9B59A]"
                >
                  <div>
                    <p className="font-medium text-[#3D2B1F]">{ticket.ticketNumber}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticket.subject} · {supportTicketTypeLabels[ticket.type]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated {formatDate(ticket.updatedAt)}
                    </p>
                  </div>
                  <SupportTicketStatusBadge status={ticket.status} />
                </button>
              ))
            )}
          </div>
        )}
      </section>

      <CreateSupportTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        orderId={orderId}
        type={createDialogType}
        onCreated={(ticketId) => openTicketDetail(ticketId)}
      />

      <SupportTicketDetailSheet
        ticketId={selectedTicketId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        orderId={orderId}
      />
    </div>
  );
}
