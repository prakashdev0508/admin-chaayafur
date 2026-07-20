import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { usePermission } from "@/hooks/usePermission";
import { isRefundOrderStatus } from "@/lib/order-status";
import { PERMISSIONS } from "@/lib/roles";
import { toOrderStatusSelectItems } from "@/lib/select-items";
import type { Order, OrderStatus, UpdateOrderPayload } from "@/types/order";

type OrderStatusFormProps = {
  order: Order;
  onUpdate: (payload: UpdateOrderPayload) => Promise<unknown>;
  loading?: boolean;
};

export function OrderStatusForm({
  order,
  onUpdate,
  loading,
}: OrderStatusFormProps) {
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_ORDERS);
  const statusItems = useMemo(
    () => toOrderStatusSelectItems(order.status),
    [order.status],
  );

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [notes, setNotes] = useState(order.payment.notes ?? "");

  useEffect(() => {
    setStatus(order.status);
    setNotes(order.payment.notes ?? "");
  }, [order.id, order.status, order.payment.notes]);

  if (!canUpdate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order status</CardTitle>
          <CardDescription>
            You do not have permission to update orders.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSubmit = async () => {
    const payload: UpdateOrderPayload = {};
    if (status !== order.status) {
      if (isRefundOrderStatus(status)) {
        toast.error(
          "This is a legacy refund order status. Choose a fulfillment status instead — refunds are managed separately.",
        );
        return;
      }
      payload.status = status;
    }
    if (notes !== (order.payment.notes ?? "")) {
      payload.payment = { notes };
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save");
      return;
    }

    try {
      await onUpdate(payload);
      toast.success("Order updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update order",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update order</CardTitle>
        <CardDescription>
          Set any fulfillment status directly — you do not need to move through
          each step. Cancelling does not issue a refund — use Initiate refund
          when needed. Refunds update payment/refund status only, not this
          fulfillment status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => v && setStatus(v as OrderStatus)}
            items={statusItems}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-notes">Payment notes</Label>
          <Textarea
            id="payment-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes about this payment..."
            rows={3}
          />
        </div>
        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
