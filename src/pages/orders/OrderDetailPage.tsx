import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  formatCurrency,
  getOrderById,
  getOrderTracking,
  orderStatusLabels,
  orderStatusVariants,
} from "@/data/mockOrders";
import { cn } from "@/lib/utils";

export function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const order = getOrderById(orderId);
  const tracking = getOrderTracking(orderId);
  const [status, setStatus] = useState(order?.status ?? "PENDING");

  if (!order) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Order not found" />
        <Button variant="outline" render={<Link to="/orders">Back to orders</Link>} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={order.orderNumber}
        description={`Placed on ${new Date(order.createdAt).toLocaleString("en-IN")}`}
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
                  <p className="font-medium">{order.customer.phone}</p>
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
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {tracking && (
            <Card>
              <CardHeader>
                <CardTitle>Tracking timeline</CardTitle>
                <CardDescription>
                  Order progress from placement to delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {tracking.timeline.map((step, index) => (
                    <div key={step.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full border-2",
                            step.isCompleted
                              ? "border-primary bg-primary text-primary-foreground"
                              : step.isCurrent
                                ? "border-primary bg-background text-primary"
                                : "border-muted bg-muted text-muted-foreground",
                          )}
                        >
                          {step.isCompleted && <Check className="size-4" />}
                        </div>
                        {index < tracking.timeline.length - 1 && (
                          <div
                            className={cn(
                              "w-px flex-1 min-h-8",
                              step.isCompleted ? "bg-primary" : "bg-border",
                            )}
                          />
                        )}
                      </div>
                      <div className="pb-8">
                        <p className="font-medium">{step.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                        {step.occurredAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(step.occurredAt).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                    order.payment.status === "COMPLETED"
                      ? "success"
                      : order.payment.status === "PENDING"
                        ? "warning"
                        : "danger"
                  }
                >
                  {order.payment.status}
                </StatusBadge>
              </div>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
              <CardDescription>Staff action (UI only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Update status</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
