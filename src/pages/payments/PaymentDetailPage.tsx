import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  paymentStatusLabels,
  paymentStatusVariants,
} from "@/lib/payment-status";
import {
  refundEventLabels,
  refundStatusLabels,
  refundStatusVariants,
} from "@/lib/refund-status";
import { getOrderStatusLabel } from "@/lib/order-status";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api";
import { getPayment } from "@/services/payments.service";
import { getOrderRefund } from "@/services/orders.service";
import { usePermission } from "@/hooks/usePermission";

export function PaymentDetailPage() {
  const { id } = useParams();
  const paymentId = Number(id);
  const isValidId = Number.isFinite(paymentId) && paymentId > 0;
  const { hasPermission } = usePermission();
  const canViewRefund =
    hasPermission("view-payments") || hasPermission("view-orders");

  const {
    data: payment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.payments.detail(paymentId),
    queryFn: () => getPayment(paymentId),
    enabled: isValidId,
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 4000 : false,
  });

  const linkedOrderId = payment?.order?.id ?? payment?.orderId;
  const refundQuery = useQuery({
    queryKey: queryKeys.orders.refund(linkedOrderId ?? 0),
    queryFn: () => getOrderRefund(linkedOrderId!),
    enabled: Boolean(linkedOrderId) && canViewRefund,
    retry: (count, err) =>
      !(err instanceof ApiError && err.statusCode === 404) && count < 1,
    refetchInterval: (query) =>
      query.state.data?.status === "PROCESSING" ? 4000 : false,
  });

  if (!isValidId) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Invalid payment" />
        <Button variant="outline" render={<Link to="/payments">Back to payments</Link>} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !payment) {
    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Payment not found";

    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Payment not found" description={message} />
        <Button variant="outline" render={<Link to="/payments">Back to payments</Link>} />
      </div>
    );
  }

  const order = payment.order;
  const orderId = order?.id ?? payment.orderId;
  const refund = refundQuery.data;
  const refundMissing =
    refundQuery.error instanceof ApiError && refundQuery.error.statusCode === 404;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Payment #${payment.id}`}
        description={`Created on ${formatDate(payment.createdAt)}`}
        action={
          <Button
            variant="outline"
            render={
              <Link to="/payments">
                <ArrowLeft className="size-4" />
                Back to payments
              </Link>
            }
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment details</CardTitle>
              <StatusBadge
                variant={paymentStatusVariants[payment.status] ?? "neutral"}
              >
                {paymentStatusLabels[payment.status] ?? payment.status}
              </StatusBadge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Method</p>
                <p className="font-medium">{payment.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transaction ID</p>
                <p className="font-mono text-sm">
                  {payment.transactionId ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium">{payment.currency ?? "INR"}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Razorpay details</p>
              <div className="space-y-1 rounded-lg bg-muted p-3 font-mono text-xs">
                <p>Link ID: {payment.razorpayPaymentLinkId ?? "—"}</p>
                <p>Payment ID: {payment.razorpayPaymentId ?? "—"}</p>
                {payment.keyId && <p>Key ID: {payment.keyId}</p>}
                {payment.razorpayRefundId && (
                  <p>Refund ID: {payment.razorpayRefundId}</p>
                )}
              </div>
            </div>

            {(payment.refundedAt || payment.refundNotes) && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Refund mirror</p>
                {payment.refundedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Refunded at</p>
                    <p className="text-sm">{formatDate(payment.refundedAt)}</p>
                  </div>
                )}
                {payment.refundNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Refund notes</p>
                    <p className="text-sm">{payment.refundNotes}</p>
                  </div>
                )}
              </div>
            )}

            {payment.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{payment.notes}</p>
              </div>
            )}

            {payment.paymentLinkUrl && (
              <Button
                className="w-full"
                render={
                  <a
                    href={payment.paymentLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    Open payment link
                  </a>
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Linked order</CardTitle>
              <CardDescription>Order associated with this payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Order number</p>
                {order ? (
                  <Link
                    to={`/orders/${orderId}`}
                    className="font-medium hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                ) : (
                  <Link
                    to={`/orders/${orderId}`}
                    className="font-medium hover:underline"
                  >
                    Order #{orderId}
                  </Link>
                )}
              </div>
              {order && (
                <div>
                  <p className="text-sm text-muted-foreground">Order status</p>
                  <p className="font-medium">
                    {getOrderStatusLabel(order.status)}
                  </p>
                </div>
              )}
              {order && (
                <div>
                  <p className="text-sm text-muted-foreground">Customer ID</p>
                  <Link
                    to={`/customers/${order.customerId}`}
                    className="font-medium hover:underline"
                  >
                    #{order.customerId}
                  </Link>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                render={
                  <Link to={`/orders/${orderId}`}>View order</Link>
                }
              />
            </CardContent>
          </Card>

          {canViewRefund && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Refund</CardTitle>
                    <CardDescription>
                      Manage initiate / complete on the order page
                    </CardDescription>
                  </div>
                  {refund && (
                    <StatusBadge variant={refundStatusVariants[refund.status]}>
                      {refundStatusLabels[refund.status]}
                    </StatusBadge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {refundQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : refund ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Reason</p>
                      <p className="text-sm">{refund.reason}</p>
                    </div>
                    {refund.failureReason && (
                      <div>
                        <p className="text-sm text-muted-foreground">Failure</p>
                        <p className="text-sm text-destructive">
                          {refund.failureReason}
                        </p>
                      </div>
                    )}
                    {refund.events.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Timeline</p>
                        <ul className="space-y-2 text-sm">
                          {refund.events.map((event) => (
                            <li key={event.id} className="rounded-md bg-muted/50 p-2">
                              <div className="flex justify-between gap-2">
                                <span className="font-medium">
                                  {refundEventLabels[event.type] ?? event.type}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(event.createdAt)}
                                </span>
                              </div>
                              {event.message && (
                                <p className="mt-1 text-muted-foreground">
                                  {event.message}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      render={
                        <Link to={`/orders/${orderId}`}>
                          Open order to manage refund
                        </Link>
                      }
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {refundMissing
                      ? "No refund request for this payment yet."
                      : "Could not load refund details."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
