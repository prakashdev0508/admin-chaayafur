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
import { StarRating } from "@/components/reviews/StarRating";
import type {
  OrderRefund,
  InitiateRefundPayload,
  RefundStatus,
} from "@/types/refund";
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
import { PERMISSIONS } from "@/lib/roles";
import type { UpdateOrderPayload } from "@/types/order";

export function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canViewSupport = hasPermission(PERMISSIONS.VIEW_ORDER_SUPPORT);
  const canRefund = hasPermission(PERMISSIONS.UPDATE_PAYMENTS);
  const canGenerateInvoice = hasPermission(PERMISSIONS.UPDATE_ORDERS);
  const canViewRefund =
    hasPermission(PERMISSIONS.VIEW_PAYMENTS) ||
    hasPermission(PERMISSIONS.VIEW_ORDERS);
  const [refundOpen, setRefundOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [completeResultOpen, setCompleteResultOpen] = useState(false);
  const [completeResultRefund, setCompleteResultRefund] =
    useState<OrderRefund | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<OrderRefund | null>(
    null,
  );

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
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const items =
        Array.isArray(data.items) && data.items.length > 0
          ? data.items
          : [data];
      return items.some((item) => item.status === "PROCESSING") ? 4000 : false;
    },
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
    mutationFn: (payload: InitiateRefundPayload) =>
      initiateOrderRefund(orderId, payload),
    onSuccess: () => {
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
    onSuccess: () => {
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
  const refundData = refundQuery.data ?? null;
  const refundItems =
    refundData &&
    Array.isArray(refundData.items) &&
    refundData.items.length > 0
      ? refundData.items
      : refundData?.id
        ? [refundData]
        : [];
  const activeRefund =
    refundItems.find((item) => isActiveRefund(item.status as RefundStatus)) ??
    null;
  const latestRefund = refundItems[0] ?? null;
  const remainingAmount = refundData
    ? parseFloat(refundData.remainingAmount ?? "0")
    : parseFloat(order.payment.amount);
  const canInitiateRefund =
    canRefund &&
    order.payment.status === "COMPLETED" &&
    !refundQuery.isLoading &&
    !activeRefund &&
    remainingAmount > 0.001;
  const refundStatus = (activeRefund ?? latestRefund)?.status as
    | RefundStatus
    | undefined;
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
              {latestRefund && refundStatusLabel && (
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
                        <TableHead>Review</TableHead>
                        <TableHead className="text-right">Line total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <Link
                              to={`/products/${item.productId}`}
                              className="hover:underline"
                            >
                              {item.product.name}
                            </Link>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>
                            {item.review ? (
                              <div className="max-w-[220px] space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <StarRating
                                    value={item.review.rating}
                                    size="sm"
                                  />
                                  <StatusBadge
                                    variant={
                                      item.review.isVisible
                                        ? "success"
                                        : "neutral"
                                    }
                                  >
                                    {item.review.isVisible
                                      ? "Visible"
                                      : "Hidden"}
                                  </StatusBadge>
                                </div>
                                {item.review.comment && (
                                  <p className="line-clamp-2 text-xs text-muted-foreground">
                                    {item.review.comment}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
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

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>Order review</CardTitle>
                    {order.orderReview && (
                      <StatusBadge
                        variant={
                          order.orderReview.isVisible ? "success" : "neutral"
                        }
                      >
                        {order.orderReview.isVisible ? "Visible" : "Hidden"}
                      </StatusBadge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {order.orderReview ? (
                    <div className="space-y-3">
                      <StarRating value={order.orderReview.rating} />
                      {order.orderReview.comment ? (
                        <p className="text-sm leading-relaxed">
                          {order.orderReview.comment}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No comment provided.
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDate(order.orderReview.createdAt)}
                        {order.orderReview.updatedAt !==
                          order.orderReview.createdAt &&
                          ` · Updated ${formatDate(order.orderReview.updatedAt)}`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No overall order review yet. Customers can submit one
                      after delivery.
                    </p>
                  )}
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
                  {latestRefund && refundStatusLabel && (
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
                    {latestRefund && refundStatusLabel && (
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
                ) : refundData ? (
                  <RefundPanel
                    data={refundData}
                    canUpdate={canRefund}
                    completeLoading={completeRefundMutation.isPending}
                    cancelLoading={cancelRefundMutation.isPending}
                    onComplete={(item) => {
                      setSelectedRefund(item);
                      setCompleteConfirmOpen(true);
                    }}
                    onCancel={(item) => {
                      setSelectedRefund(item);
                      setCancelConfirmOpen(true);
                    }}
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
                      ? "No refund request yet. You can initiate a full or partial refund."
                      : order.payment.status === "REFUNDED"
                        ? "Payment has been fully refunded."
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
        remainingAmount={
          Number.isFinite(remainingAmount) && remainingAmount > 0
            ? remainingAmount
            : parseFloat(order.payment.amount)
        }
        paymentAmountLabel={formatCurrency(order.payment.amount)}
        loading={initiateRefundMutation.isPending}
        onConfirm={(payload) => initiateRefundMutation.mutateAsync(payload)}
      />

      <ConfirmDialog
        open={completeConfirmOpen}
        onOpenChange={(open) => {
          setCompleteConfirmOpen(open);
          if (!open) setSelectedRefund(null);
        }}
        title="Complete this refund?"
        description={`This submits a refund of ${formatCurrency(selectedRefund?.amount ?? "0")} for ${order.orderNumber} to Razorpay. Payment becomes fully refunded only when remaining balance reaches zero.`}
        confirmLabel="Complete refund"
        variant="destructive"
        loading={completeRefundMutation.isPending}
        onConfirm={() => {
          if (!selectedRefund) return Promise.resolve();
          return completeRefundMutation.mutateAsync(selectedRefund.id);
        }}
      />

      <ConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={(open) => {
          setCancelConfirmOpen(open);
          if (!open) setSelectedRefund(null);
        }}
        title="Cancel this refund request?"
        description="Razorpay has not been charged yet. You can initiate a new refund later."
        confirmLabel="Cancel request"
        variant="destructive"
        loading={cancelRefundMutation.isPending}
        onConfirm={() => {
          if (!selectedRefund) return Promise.resolve();
          return cancelRefundMutation.mutateAsync(selectedRefund.id);
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
