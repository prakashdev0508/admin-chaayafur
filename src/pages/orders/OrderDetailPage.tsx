import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
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
import { TrackingTimeline } from "@/components/shared/TrackingTimeline";
import { InvoicePanel } from "@/components/shared/InvoicePanel";
import { AuditLogTable } from "@/components/shared/AuditLogTable";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  orderStatusLabels,
  orderStatusVariants,
} from "@/lib/order-status";
import { paymentStatusVariants } from "@/lib/payment-status";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api";
import {
  getOrder,
  getOrderAuditLogs,
  getOrderInvoice,
  getOrderTracking,
  updateOrder,
} from "@/services/orders.service";
import type { UpdateOrderPayload } from "@/types/order";

export function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const queryClient = useQueryClient();

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

  const auditQuery = useQuery({
    queryKey: queryKeys.orders.auditLogs(orderId),
    queryFn: () => getOrderAuditLogs(orderId, { limit: 50 }),
    enabled: Number.isFinite(orderId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateOrderPayload) => updateOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.tracking(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.auditLogs(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.invoice(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={order.orderNumber}
        description={`Placed on ${formatDate(order.createdAt)}`}
        action={
          <Button
            variant="outline"
            render={
              <Link to="/orders">
                <ArrowLeft className="size-4" />
                Back to orders
              </Link>
            }
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order summary</CardTitle>
                <StatusBadge variant={orderStatusVariants[order.status]}>
                  {orderStatusLabels[order.status]}
                </StatusBadge>
              </div>
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
                  <p className="text-sm text-muted-foreground">Payment method</p>
                  <p className="font-medium">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shipping address</p>
                  <p className="text-sm">{order.shippingAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing address</p>
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
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-[#346538]">
                        -{formatCurrency(order.discountAmount)}
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
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tracking">
                <TabsList>
                  <TabsTrigger value="tracking">Tracking</TabsTrigger>
                  <TabsTrigger value="invoice">Invoice</TabsTrigger>
                  <TabsTrigger value="audit">Audit log</TabsTrigger>
                </TabsList>
                <TabsContent value="tracking" className="mt-4">
                  <TrackingTimeline
                    tracking={trackingQuery.data}
                    loading={trackingQuery.isLoading}
                  />
                </TabsContent>
                <TabsContent value="invoice" className="mt-4">
                  <InvoicePanel
                    invoice={invoiceQuery.data}
                    loading={invoiceQuery.isLoading}
                    notFound={invoiceNotFound}
                  />
                </TabsContent>
                <TabsContent value="audit" className="mt-4">
                  <AuditLogTable
                    logs={auditQuery.data?.items ?? []}
                    loading={auditQuery.isLoading}
                  />
                </TabsContent>
              </Tabs>
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
                  variant={paymentStatusVariants[order.payment.status]}
                >
                  {order.payment.status}
                </StatusBadge>
              </div>
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
              {order.payment.id && (
                <Button
                  variant="ghost"
                  className="w-full"
                  render={
                    <Link to={`/payments/${order.payment.id}`}>
                      View payment details
                    </Link>
                  }
                />
              )}
            </CardContent>
          </Card>

          <OrderStatusForm
            order={order}
            loading={updateMutation.isPending}
            onUpdate={(payload) => updateMutation.mutateAsync(payload)}
          />
        </div>
      </div>
    </div>
  );
}
