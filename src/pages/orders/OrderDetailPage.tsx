import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ClipboardList,
  Eye,
  FileText,
  LifeBuoy,
  Loader2,
  RotateCcw,
  ScrollText,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatusForm } from "@/components/orders/OrderStatusForm";
import { RefundCompleteResultDialog } from "@/components/orders/RefundCompleteResultDialog";
import { RefundOrderDialog } from "@/components/orders/RefundOrderDialog";
import { RefundPanel } from "@/components/orders/RefundPanel";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TrackingTimeline } from "@/components/shared/TrackingTimeline";
import { InvoicePanel } from "@/components/shared/InvoicePanel";
import { AuditLogTable } from "@/components/shared/AuditLogTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { SupportTicketStatusBadge } from "@/components/support-tickets/SupportTicketStatusBadge";
import type { OrderRefund } from "@/types/refund";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
} from "@/lib/order-status";
import { paymentStatusLabels, paymentStatusVariants } from "@/lib/payment-status";
import { isActiveRefund, refundStatusLabels, refundStatusVariants } from "@/lib/refund-status";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import {
  cancelOrderRefund,
  completeOrderRefund,
  generateOrderInvoice,
  getOrder,
  getOrderAuditLogs,
  getOrderInvoice,
  getOrderRefund,
  getOrderTracking,
  initiateOrderRefund,
  updateOrder,
} from "@/services/orders.service";
import { listSupportTickets } from "@/services/support-tickets.service";
import { usePermission } from "@/hooks/usePermission";
import type { UpdateOrderPayload } from "@/types/order";
import type { RefundStatus } from "@/types/refund";

export function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canViewSupport = hasPermission("view-order-support");
  const canRefund = hasPermission("update-payments");
  const canGenerateInvoice = hasPermission("update-orders");
  const canViewRefund =
    hasPermission("view-payments") || hasPermission("view-orders");
  const [refundOpen, setRefundOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [completeResultOpen, setCompleteResultOpen] = useState(false);
  const [completeResultRefund, setCompleteResultRefund] =
    useState<OrderRefund | null>(null);

  const invalidateOrderQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.orders.detail(orderId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.orders.tracking(orderId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.orders.auditLogs(orderId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.orders.invoice(orderId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.orders.refund(orderId),
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
  };

  const orderQuery = useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => getOrder(orderId),
    enabled: Number.isFinite(orderId),
  });

  const trackingQuery = useQuery({
    queryKey: queryKeys.orders.tracking(orderId),
    queryFn: () => getOrderTracking(orderId),
    enabled: Number.isFinite(orderId),
    refetchInterval: (query) =>
      query.state.data?.currentStatus === "PENDING" ? 4000 : false,
  });

  const invoiceQuery = useQuery({
    queryKey: queryKeys.orders.invoice(orderId),
    queryFn: () => getOrderInvoice(orderId),
    enabled: Number.isFinite(orderId),
    retry: (count, error) =>
      !(error instanceof ApiError && error.statusCode === 404) && count < 1,
  });

  const refundQuery = useQuery({
    queryKey: queryKeys.orders.refund(orderId),
    queryFn: () => getOrderRefund(orderId),
    enabled: Number.isFinite(orderId) && (canViewRefund || canRefund),
    retry: (count, error) =>
      !(error instanceof ApiError && error.statusCode === 404) && count < 1,
    refetchInterval: (query) =>
      query.state.data?.status === "PROCESSING" ? 4000 : false,
  });

  const auditQuery = useQuery({
    queryKey: queryKeys.orders.auditLogs(orderId),
    queryFn: () => getOrderAuditLogs(orderId, { limit: 50 }),
    enabled: Number.isFinite(orderId),
  });

  const supportTicketsQuery = useQuery({
    queryKey: queryKeys.supportTickets.list({ orderId, limit: 20 }),
    queryFn: () => listSupportTickets({ orderId, limit: 20 }),
    enabled: Number.isFinite(orderId) && canViewSupport,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateOrderPayload) => updateOrder(orderId, payload),
    onSuccess: () => {
      invalidateOrderQueries();
    },
  });

  const initiateRefundMutation = useMutation({
    mutationFn: (reason: string) =>
      initiateOrderRefund(orderId, { reason }),
    onSuccess: (refund) => {
      queryClient.setQueryData(queryKeys.orders.refund(orderId), refund);
      invalidateOrderQueries();
      toast.success("Refund request initiated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to initiate refund",
      );
    },
  });

  const completeRefundMutation = useMutation({
    mutationFn: (refundId: number) => completeOrderRefund(orderId, refundId),
    onSuccess: (refund) => {
      queryClient.setQueryData(queryKeys.orders.refund(orderId), refund);
      invalidateOrderQueries();
      setCompleteResultRefund(refund);
      setCompleteResultOpen(true);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete refund",
      );
      invalidateOrderQueries();
    },
  });

  const cancelRefundMutation = useMutation({
    mutationFn: (refundId: number) => cancelOrderRefund(orderId, refundId),
    onSuccess: (refund) => {
      queryClient.setQueryData(queryKeys.orders.refund(orderId), refund);
      invalidateOrderQueries();
      toast.success("Refund request cancelled");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel refund",
      );
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: () => generateOrderInvoice(orderId),
    onSuccess: (invoice) => {
      queryClient.setQueryData(queryKeys.orders.invoice(orderId), invoice);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(orderId),
      });
      toast.success(
        invoice.pdfUrl
          ? "Invoice generated with PDF"
          : "Invoice generated",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate invoice",
      );
    },
  });

  const order = orderQuery.data;

  if (orderQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Order not found" />
        <Button variant="outline" render={<Link to="/orders">Back to orders</Link>} />
      </div>
    );
  }

  const invoiceNotFound =
    invoiceQuery.error instanceof ApiError && invoiceQuery.error.statusCode === 404;

  const refundNotFound =
    refundQuery.error instanceof ApiError && refundQuery.error.statusCode === 404;
  const refund = refundQuery.data ?? null;
  const hasActiveRefund = refund
    ? isActiveRefund(refund.status as RefundStatus)
    : false;
  const canInitiateRefund =
    canRefund &&
    order.payment.status === "COMPLETED" &&
    !refundQuery.isLoading &&
    !hasActiveRefund;
  const refundStatus = refund?.status as RefundStatus | undefined;
  const refundStatusLabel = refundStatus
    ? (refundStatusLabels[refundStatus] ?? refundStatus)
    : null;
  const refundStatusVariant = refundStatus
    ? (refundStatusVariants[refundStatus] ?? "neutral")
    : "neutral";

  const destinationLabel = order.shippingAddressRef
    ? [order.shippingAddressRef.city, order.shippingAddressRef.state]
        .filter(Boolean)
        .join(", ")
    : undefined;

  const ticketCount =
    supportTicketsQuery.data?.meta.total ??
    supportTicketsQuery.data?.items.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={order.orderNumber}
        description={`Placed on ${formatDate(order.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge variant={getOrderStatusVariant(order.status)}>
              {getOrderStatusLabel(order.status)}
            </StatusBadge>
            <Button
              variant="outline"
              render={
                <Link to="/orders">
                  <ArrowLeft className="size-4" />
                  Back
                </Link>
              }
            />
          </div>
        }
      />

      <Tabs defaultValue="details" className="gap-6">
        <TabsList
          variant="line"
          className="h-auto w-full flex-wrap justify-start gap-0 rounded-none border-b bg-transparent p-0"
        >
          <TabsTrigger
            value="details"
            className="gap-2 rounded-none px-4 py-3 after:bottom-0 data-active:after:h-0.5"
          >
            <ClipboardList className="size-4" />
            Details
          </TabsTrigger>
          <TabsTrigger
            value="tracking"
            className="gap-2 rounded-none px-4 py-3 after:bottom-0 data-active:after:h-0.5"
          >
            <Truck className="size-4" />
            Tracking
          </TabsTrigger>
          <TabsTrigger
            value="invoice"
            className="gap-2 rounded-none px-4 py-3 after:bottom-0 data-active:after:h-0.5"
          >
            <FileText className="size-4" />
            Invoice
          </TabsTrigger>
          {(canViewRefund || canRefund) && (
            <TabsTrigger
              value="refund"
              className="gap-2 rounded-none px-4 py-3 after:bottom-0 data-active:after:h-0.5"
            >
              <RotateCcw className="size-4" />
              Refund
              {refund && refundStatusLabel && (
                <StatusBadge variant={refundStatusVariant} className="ml-0.5">
                  {refundStatusLabel}
                </StatusBadge>
              )}
            </TabsTrigger>
          )}
          {canViewSupport && (
            <TabsTrigger
              value="support"
              className="gap-2 rounded-none px-4 py-3 after:bottom-0 data-active:after:h-0.5"
            >
              <LifeBuoy className="size-4" />
              Support
              {typeof ticketCount === "number" && ticketCount > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                  {ticketCount}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger
            value="logs"
            className="gap-2 rounded-none px-4 py-3 after:bottom-0 data-active:after:h-0.5"
          >
            <ScrollText className="size-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Order summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <Link
                        to={`/customers/${order.customerId}`}
                        className="font-medium hover:underline"
                      >
                        {order.customer.phone}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Payment method
                      </p>
                      <p className="font-medium">{order.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Shipping address
                      </p>
                      <p className="text-sm">{order.shippingAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Billing address
                      </p>
                      <p className="text-sm">{order.billingAddress}</p>
                    </div>
                  </div>
                  {order.coupon && (
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                      Coupon applied: <strong>{order.coupon.code}</strong> (
                      {order.coupon.type})
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Line items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit price</TableHead>
                        <TableHead className="text-right">Line total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product.name}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(
                              parseFloat(item.price) * item.quantity,
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Separator className="my-4" />
                  <div className="ml-auto max-w-xs space-y-1 text-sm">
                    {order.subtotalAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(order.subtotalAmount)}</span>
                      </div>
                    )}
                    {order.discountAmount &&
                      parseFloat(order.discountAmount) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Discount
                          </span>
                          <span className="text-[#346538]">
                            -{formatCurrency(order.discountAmount)}
                          </span>
                        </div>
                      )}
                    {order.shippingAmount != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>
                          {parseFloat(order.shippingAmount) === 0
                            ? "Free"
                            : formatCurrency(order.shippingAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-medium">
                      {formatCurrency(order.payment.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <StatusBadge
                      variant={
                        paymentStatusVariants[order.payment.status] ?? "neutral"
                      }
                    >
                      {paymentStatusLabels[order.payment.status] ??
                        order.payment.status}
                    </StatusBadge>
                  </div>
                  {refund && refundStatusLabel && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Refund status
                      </span>
                      <StatusBadge variant={refundStatusVariant}>
                        {refundStatusLabel}
                      </StatusBadge>
                    </div>
                  )}
                  {order.payment.paymentLinkUrl && (
                    <Button
                      variant="outline"
                      className="w-full"
                      render={
                        <a
                          href={order.payment.paymentLinkUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View payment link
                        </a>
                      }
                    />
                  )}
                  <Link
                    to={`/payments/${order.payment.id}`}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "w-full justify-center gap-2",
                    )}
                  >
                    <Eye className="size-4" />
                    View payment details
                  </Link>
                </CardContent>
              </Card>

              <OrderStatusForm
                order={order}
                loading={updateMutation.isPending}
                onUpdate={(payload) => updateMutation.mutateAsync(payload)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="mt-0">
          <TrackingTimeline
            tracking={trackingQuery.data}
            loading={trackingQuery.isLoading}
            origin="Warehouse"
            destination={destinationLabel}
          />
        </TabsContent>

        <TabsContent value="invoice" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoicePanel
                invoice={invoiceQuery.data}
                loading={invoiceQuery.isLoading}
                notFound={invoiceNotFound}
                canGenerate={canGenerateInvoice}
                generating={generateInvoiceMutation.isPending}
                onGenerate={() => generateInvoiceMutation.mutate()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {(canViewRefund || canRefund) && (
          <TabsContent value="refund" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CardTitle>Refund</CardTitle>
                    {refund && refundStatusLabel && (
                      <StatusBadge variant={refundStatusVariant}>
                        {refundStatusLabel}
                      </StatusBadge>
                    )}
                  </div>
                  {canInitiateRefund && (
                    <Button
                      variant="destructive"
                      onClick={() => setRefundOpen(true)}
                    >
                      Initiate refund
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {refundQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : refund ? (
                  <RefundPanel
                    refund={refund}
                    canUpdate={canRefund}
                    completeLoading={completeRefundMutation.isPending}
                    cancelLoading={cancelRefundMutation.isPending}
                    onComplete={() => setCompleteConfirmOpen(true)}
                    onCancel={() => setCancelConfirmOpen(true)}
                  />
                ) : refundQuery.isError && !refundNotFound ? (
                  <p className="text-sm text-destructive">
                    {refundQuery.error instanceof Error
                      ? refundQuery.error.message
                      : "Failed to load refund"}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {order.payment.status === "COMPLETED"
                      ? "No refund request yet. Initiate a refund when needed."
                      : order.payment.status === "REFUNDED"
                        ? "Payment has been refunded."
                        : "Refunds are only available for completed payments."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canViewSupport && (
          <TabsContent value="support" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Support tickets</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tickets linked to order {order.orderNumber}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link to={`/support-tickets?orderId=${orderId}`}>
                        View all
                      </Link>
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                {supportTicketsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (supportTicketsQuery.data?.items.length ?? 0) === 0 ? (
                  <EmptyState
                    icon={LifeBuoy}
                    title="No support tickets"
                    description="There are no support tickets for this order yet."
                  />
                ) : (
                  <div className="space-y-3">
                    {supportTicketsQuery.data?.items.map((ticket) => (
                      <Link
                        key={ticket.id}
                        to={`/support-tickets/${ticket.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border p-4 transition hover:bg-muted/30"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{ticket.ticketNumber}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {ticket.subject}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Updated {formatDate(ticket.updatedAt)}
                          </p>
                        </div>
                        <SupportTicketStatusBadge status={ticket.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="logs" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Audit log</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditLogTable
                logs={auditQuery.data?.items ?? []}
                loading={auditQuery.isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RefundOrderDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        orderNumber={order.orderNumber}
        amountLabel={formatCurrency(order.payment.amount)}
        loading={initiateRefundMutation.isPending}
        onConfirm={(reason) => initiateRefundMutation.mutateAsync(reason)}
      />

      <ConfirmDialog
        open={completeConfirmOpen}
        onOpenChange={setCompleteConfirmOpen}
        title="Complete this refund?"
        description={`This submits a full refund of ${formatCurrency(order.payment.amount)} for ${order.orderNumber} to Razorpay. The payment stays completed until the gateway confirms the refund.`}
        confirmLabel="Complete refund"
        variant="destructive"
        loading={completeRefundMutation.isPending}
        onConfirm={() => {
          if (!refund) return Promise.resolve();
          return completeRefundMutation.mutateAsync(refund.id);
        }}
      />

      <ConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Cancel this refund request?"
        description="Razorpay has not been charged yet. You can initiate a new refund later."
        confirmLabel="Cancel request"
        variant="destructive"
        loading={cancelRefundMutation.isPending}
        onConfirm={() => {
          if (!refund) return Promise.resolve();
          return cancelRefundMutation.mutateAsync(refund.id);
        }}
      />

      <RefundCompleteResultDialog
        open={completeResultOpen}
        onOpenChange={(open) => {
          setCompleteResultOpen(open);
          if (!open) setCompleteResultRefund(null);
        }}
        refund={completeResultRefund}
        orderNumber={order.orderNumber}
      />
    </div>
  );
}
