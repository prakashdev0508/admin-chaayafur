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
import { orderStatusLabels } from "@/lib/order-status";
import { queryKeys } from "@/lib/query-keys";
import { getPayment } from "@/services/payments.service";

export function PaymentDetailPage() {
  const { id } = useParams();
  const paymentId = Number(id);

  const { data: payment, isLoading } = useQuery({
    queryKey: queryKeys.payments.detail(paymentId),
    queryFn: () => getPayment(paymentId),
    enabled: Number.isFinite(paymentId),
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 4000 : false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Payment not found" />
        <Button variant="outline" render={<Link to="/payments">Back to payments</Link>} />
      </div>
    );
  }

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
              <StatusBadge variant={paymentStatusVariants[payment.status]}>
                {paymentStatusLabels[payment.status]}
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
                <p>Link ID: {payment.razorpayPaymentLinkId}</p>
                <p>Payment ID: {payment.razorpayPaymentId ?? "—"}</p>
                {payment.keyId && <p>Key ID: {payment.keyId}</p>}
              </div>
            </div>

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

        <Card>
          <CardHeader>
            <CardTitle>Linked order</CardTitle>
            <CardDescription>Order associated with this payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Order number</p>
              <Link
                to={`/orders/${payment.order.id}`}
                className="font-medium hover:underline"
              >
                {payment.order.orderNumber}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order status</p>
              <p className="font-medium">
                {orderStatusLabels[payment.order.status]}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer ID</p>
              <Link
                to={`/customers/${payment.order.customerId}`}
                className="font-medium hover:underline"
              >
                #{payment.order.customerId}
              </Link>
            </div>
            <Button
              variant="outline"
              className="w-full"
              render={
                <Link to={`/orders/${payment.order.id}`}>View order</Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
