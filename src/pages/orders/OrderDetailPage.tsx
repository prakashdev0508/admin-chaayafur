import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
import { OrderStatusSelect } from "@/components/orders/OrderStatusSelect";
import { CustomizationMaterialsHighlight } from "@/components/customization-requests/CustomizationMaterialsHighlight";
import {
  getCustomizationRequestMaterialChips,
  getOrderItemMaterialChips,
  orderShowsSeparateBilling,
} from "@/lib/order-customization-materials";
import { RefundCompleteOtpDialog } from "@/components/orders/RefundCompleteOtpDialog";
import { RefundCompleteResultDialog } from "@/components/orders/RefundCompleteResultDialog";
import { RefundOrderDialog } from "@/components/orders/RefundOrderDialog";
import { RefundPanel } from "@/components/orders/RefundPanel";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
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
import { paymentStatusLabels, paymentStatusVariants } from "@/lib/payment-status";
import { isActiveRefund, refundStatusLabels, refundStatusVariants } from "@/lib/refund-status";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import {
  cancelOrderRefund,
  emailOrderInvoice,
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
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canViewSupport = hasPermission(PERMISSIONS.VIEW_ORDER_SUPPORT);
  const canRefund = hasPermission(PERMISSIONS.UPDATE_PAYMENTS);
  const canGenerateInvoice = hasPermission(PERMISSIONS.UPDATE_ORDERS);
  const canViewRefund =
    hasPermission(PERMISSIONS.VIEW_PAYMENTS) ||
    hasPermission(PERMISSIONS.VIEW_ORDERS);
  const [refundOpen, setRefundOpen] = useState(false);
  const [completeOtpOpen, setCompleteOtpOpen] = useState(false);
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
    void queryClient.invalidateQueries({ queryKey: queryKeys.refunds.all });
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

  const emailInvoiceMutation = useMutation({
    mutationFn: () => emailOrderInvoice(orderId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.invoice(orderId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(orderId),
      });
      toast.success(
        result.sent
          ? `Invoice emailed to ${result.to}`
          : "Invoice email requested",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to email invoice",
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
  const showBilling = orderShowsSeparateBilling(order);
  const customization = order.customizationRequest ?? null;
  const customizationMaterials = customization
    ? getCustomizationRequestMaterialChips(customization)
    : [];

  const ticketCount =
    supportTicketsQuery.data?.meta.total ??
    supportTicketsQuery.data?.items.length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title={order.orderNumber}
        description={`Placed on ${formatDate(order.createdAt)}`}
        action={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <StatusBadge
              variant={
                paymentStatusVariants[order.payment.status] ?? "neutral"
              }
              className="h-7 px-2.5"
            >
              {paymentStatusLabels[order.payment.status] ??
                order.payment.status}
            </StatusBadge>
            <OrderStatusSelect
              status={order.status}
              onUpdate={(payload) => updateMutation.mutateAsync(payload)}
            />
            {latestRefund && refundStatusLabel && (
              <StatusBadge
                variant={refundStatusVariant}
                className="h-7 px-2.5"
              >
                {refundStatusLabel}
              </StatusBadge>
            )}
          </div>
        }
      />

      <Tabs defaultValue="details" className="gap-4 sm:gap-6">
        <TabsList
          variant="line"
          className="h-auto w-full flex-nowrap justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <TabsTrigger
            value="details"
            className="min-h-11 shrink-0 gap-2 rounded-none px-3 py-3 after:bottom-0 data-active:after:h-0.5 sm:px-4"
          >
            <ClipboardList className="size-4 shrink-0" />
            <span className="max-sm:sr-only">Details</span>
          </TabsTrigger>
          <TabsTrigger
            value="tracking"
            className="min-h-11 shrink-0 gap-2 rounded-none px-3 py-3 after:bottom-0 data-active:after:h-0.5 sm:px-4"
          >
            <Truck className="size-4 shrink-0" />
            <span className="max-sm:sr-only">Tracking</span>
          </TabsTrigger>
          <TabsTrigger
            value="invoice"
            className="min-h-11 shrink-0 gap-2 rounded-none px-3 py-3 after:bottom-0 data-active:after:h-0.5 sm:px-4"
          >
            <FileText className="size-4 shrink-0" />
            <span className="max-sm:sr-only">Invoice</span>
          </TabsTrigger>
          {(canViewRefund || canRefund) && (
            <TabsTrigger
              value="refund"
              className="min-h-11 shrink-0 gap-2 rounded-none px-3 py-3 after:bottom-0 data-active:after:h-0.5 sm:px-4"
            >
              <RotateCcw className="size-4 shrink-0" />
              <span className="max-sm:sr-only">Refund</span>
              {latestRefund && refundStatusLabel && (
                <StatusBadge
                  variant={refundStatusVariant}
                  className="ml-0.5 max-sm:hidden"
                >
                  {refundStatusLabel}
                </StatusBadge>
              )}
            </TabsTrigger>
          )}
          {canViewSupport && (
            <TabsTrigger
              value="support"
              className="min-h-11 shrink-0 gap-2 rounded-none px-3 py-3 after:bottom-0 data-active:after:h-0.5 sm:px-4"
            >
              <LifeBuoy className="size-4 shrink-0" />
              <span className="max-sm:sr-only">Support</span>
              {typeof ticketCount === "number" && ticketCount > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                  {ticketCount}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger
            value="logs"
            className="min-h-11 shrink-0 gap-2 rounded-none px-3 py-3 after:bottom-0 data-active:after:h-0.5 sm:px-4"
          >
            <ScrollText className="size-4 shrink-0" />
            <span className="max-sm:sr-only">Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0 space-y-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-foreground/10 bg-foreground text-background shadow-sm">
              <CardContent className="flex flex-col gap-1 px-4 pt-4 pb-3 sm:pt-5 sm:pb-4">
                <p className="text-xs font-medium tracking-wide text-background/65 uppercase">
                  Order total
                </p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </p>
                <p className="text-xs text-background/55">
                  {order.items.length}{" "}
                  {order.items.length === 1 ? "item" : "items"}
                  {order.coupon ? ` · ${order.coupon.code}` : ""}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-2 px-4 pt-4 pb-3 sm:pt-5 sm:pb-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Payment
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    variant={
                      paymentStatusVariants[order.payment.status] ?? "neutral"
                    }
                  >
                    {paymentStatusLabels[order.payment.status] ??
                      order.payment.status}
                  </StatusBadge>
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(order.payment.amount)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {order.paymentMethod}
                  {latestRefund && refundStatusLabel
                    ? ` · Refund ${refundStatusLabel}`
                    : ""}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1 px-4 pt-4 pb-3 sm:pt-5 sm:pb-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Placed
                </p>
                <p className="text-base font-semibold tracking-tight">
                  {formatDate(order.createdAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Order date
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1 px-4 pt-4 pb-3 sm:pt-5 sm:pb-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Delivery floor
                </p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {order.deliveryFloor ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.liftAccessAvailable
                    ? "Lift accessible · floor charge waived"
                    : (order.deliveryFloor ?? 0) === 0
                      ? "Ground · no carry-up charge"
                      : order.floorDeliveryAmount != null &&
                          parseFloat(order.floorDeliveryAmount) > 0
                        ? `Labor ${formatCurrency(order.floorDeliveryAmount)}`
                        : "Floor delivery labor"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
            <Card className="flex h-full flex-col">
              <CardHeader className="pb-3">
                <CardTitle>Customer & delivery</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/25 p-3">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Customer
                    </p>
                    <Link
                      to={`/customers/${order.customerId}`}
                      className="mt-1 block text-base font-semibold hover:underline"
                    >
                      {order.customer.phone}
                    </Link>
                    {order.shippingAddressRef?.name && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {order.shippingAddressRef.name}
                        {order.shippingAddressRef.phone
                          ? ` · ${order.shippingAddressRef.phone}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border bg-muted/25 p-3">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Payment method
                    </p>
                    <p className="mt-1 text-base font-semibold">
                      {order.paymentMethod}
                    </p>
                    {order.coupon && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Coupon{" "}
                        <span className="font-medium text-foreground">
                          {order.coupon.code}
                        </span>
                        {order.coupon.type ? ` (${order.coupon.type})` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    "grid gap-4",
                    showBilling ? "sm:grid-cols-2" : "sm:grid-cols-1",
                  )}
                >
                  <div>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Shipping address
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed">
                      {order.shippingAddress}
                    </p>
                  </div>
                  {showBilling && (
                    <div>
                      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Billing address
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed">
                        {order.billingAddress}
                      </p>
                    </div>
                  )}
                </div>

                {customization && (
                  <div className="mt-auto space-y-3 rounded-lg border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        Custom order · Request #{customization.id}
                      </p>
                      <Link
                        to={`/customization-requests/${customization.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View request
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {customization.description}
                    </p>
                    <CustomizationMaterialsHighlight
                      materials={customizationMaterials}
                      title="Wood, polish & fabric"
                    />
                    {customization.referenceImageUrl && (
                      <img
                        src={customization.referenceImageUrl}
                        alt="Customization reference"
                        className="max-h-40 rounded-lg border object-cover"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex h-full flex-col">
              <CardHeader className="pb-3">
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex-1">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Amount charged
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                    {formatCurrency(order.payment.amount)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      variant={
                        paymentStatusVariants[order.payment.status] ??
                        "neutral"
                      }
                    >
                      {paymentStatusLabels[order.payment.status] ??
                        order.payment.status}
                    </StatusBadge>
                    {latestRefund && refundStatusLabel && (
                      <StatusBadge variant={refundStatusVariant}>
                        {refundStatusLabel}
                      </StatusBadge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {order.paymentMethod}
                  </p>
                </div>
                <Link
                  to={`/payments/${order.payment.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-auto min-h-11 w-full justify-center gap-2",
                  )}
                >
                  <Eye className="size-4" />
                  View payment details
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:hidden">
                {order.items.map((item) => {
                  const itemMaterials = getOrderItemMaterialChips(
                    item,
                    customization,
                  );
                  const lineTotal = parseFloat(item.price) * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border bg-muted/15 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={`/products/${item.productId}`}
                          className="min-w-0 font-medium hover:underline"
                        >
                          {item.product.name}
                        </Link>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Qty {item.quantity} × {formatCurrency(item.price)}
                      </p>
                      {itemMaterials.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {itemMaterials.map((material) => (
                            <span
                              key={`${material.label}-${material.name}`}
                              className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50/80 px-2 py-0.5 text-[11px] font-medium dark:border-amber-800 dark:bg-amber-950/40"
                            >
                              {material.color && (
                                <span
                                  className="size-2 rounded-full border border-black/10"
                                  style={{
                                    backgroundColor: material.color,
                                  }}
                                  aria-hidden
                                />
                              )}
                              <span className="text-muted-foreground">
                                {material.label}:
                              </span>
                              {material.name}
                              {material.priceAdjustmentLabel && (
                                <span className="text-muted-foreground">
                                  {material.priceAdjustmentLabel}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.review && (
                        <div className="mt-3 space-y-1 border-t pt-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <StarRating
                              value={item.review.rating}
                              size="sm"
                            />
                            <StatusBadge
                              variant={
                                item.review.isVisible ? "success" : "neutral"
                              }
                            >
                              {item.review.isVisible ? "Visible" : "Hidden"}
                            </StatusBadge>
                          </div>
                          {item.review.comment && (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {item.review.comment}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
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
                    {order.items.map((item) => {
                      const itemMaterials = getOrderItemMaterialChips(
                        item,
                        customization,
                      );
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <Link
                              to={`/products/${item.productId}`}
                              className="hover:underline"
                            >
                              {item.product.name}
                            </Link>
                            {itemMaterials.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {itemMaterials.map((material) => (
                                  <span
                                    key={`${material.label}-${material.name}`}
                                    className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50/80 px-2 py-0.5 text-[11px] font-medium dark:border-amber-800 dark:bg-amber-950/40"
                                  >
                                    {material.color && (
                                      <span
                                        className="size-2 rounded-full border border-black/10"
                                        style={{
                                          backgroundColor: material.color,
                                        }}
                                        aria-hidden
                                      />
                                    )}
                                    <span className="text-muted-foreground">
                                      {material.label}:
                                    </span>
                                    {material.name}
                                    {material.priceAdjustmentLabel && (
                                      <span className="text-muted-foreground">
                                        {material.priceAdjustmentLabel}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>
                            {item.review ? (
                              <div className="max-w-55 space-y-1">
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
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(
                              parseFloat(item.price) * item.quantity,
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full space-y-3 rounded-xl border bg-muted/20 p-4 sm:p-5">
                {order.subtotalAmount && (
                  <div className="flex justify-between gap-4 text-sm sm:text-base">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">
                      {formatCurrency(order.subtotalAmount)}
                    </span>
                  </div>
                )}
                {order.discountAmount &&
                  parseFloat(order.discountAmount) > 0 && (
                    <div className="flex justify-between gap-4 text-sm sm:text-base">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="tabular-nums text-[#346538]">
                        -{formatCurrency(order.discountAmount)}
                      </span>
                    </div>
                  )}
                {order.shippingAmount != null && (
                  <div className="flex justify-between gap-4 text-sm sm:text-base">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="tabular-nums">
                      {parseFloat(order.shippingAmount) === 0
                        ? "Free"
                        : formatCurrency(order.shippingAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-4 text-sm sm:text-base">
                  <span className="text-muted-foreground">Delivery floor</span>
                  <span className="tabular-nums">
                    {order.deliveryFloor ?? 0}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm sm:text-base">
                  <span className="text-muted-foreground">
                    Floor delivery
                    {(order.deliveryFloor ?? 0) > 0
                      ? ` (floor ${order.deliveryFloor})`
                      : ""}
                  </span>
                  <span className="tabular-nums">
                    {order.liftAccessAvailable
                      ? "Waived"
                      : order.floorDeliveryAmount != null &&
                          parseFloat(order.floorDeliveryAmount) > 0
                        ? formatCurrency(order.floorDeliveryAmount)
                        : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm sm:text-base">
                  <span className="text-muted-foreground">Lift accessible</span>
                  <span>{order.liftAccessAvailable ? "Yes" : "No"}</span>
                </div>
                <Separator />
                <div className="flex items-baseline justify-between gap-4 pt-0.5">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
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
                  No overall order review yet. Customers can submit one after
                  delivery.
                </p>
              )}
            </CardContent>
          </Card>
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
                emailing={emailInvoiceMutation.isPending}
                onGenerate={() => generateInvoiceMutation.mutate()}
                onEmail={() => emailInvoiceMutation.mutate()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {(canViewRefund || canRefund) && (
          <TabsContent value="refund" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
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
                      className="min-h-11 w-full sm:w-auto"
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
                    completeLoading={false}
                    cancelLoading={cancelRefundMutation.isPending}
                    onComplete={(item) => {
                      setSelectedRefund(item);
                      setCompleteOtpOpen(true);
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Support tickets</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tickets linked to order {order.orderNumber}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11 w-full sm:w-auto"
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
                        className="flex flex-col gap-3 rounded-xl border p-4 transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
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

      {selectedRefund && (
        <RefundCompleteOtpDialog
          open={completeOtpOpen}
          onOpenChange={(open) => {
            setCompleteOtpOpen(open);
            if (!open) setSelectedRefund(null);
          }}
          orderId={orderId}
          refundId={selectedRefund.id}
          amount={selectedRefund.amount}
          orderNumber={order.orderNumber}
          staffEmail={user?.email}
          onVerified={(refund) => {
            invalidateOrderQueries();
            setCompleteResultRefund(refund);
            setCompleteResultOpen(true);
          }}
        />
      )}

      <ConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={(open) => {
          setCancelConfirmOpen(open);
          if (!open) setSelectedRefund(null);
        }}
        title="Cancel this refund request?"
        description="Razorpay has not been charged yet. Any pending OTP is cleared. You can initiate a new refund later."
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
