import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/lib/roles";
import type { Order, UpdateOrderPayload } from "@/types/order";

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

  const [notes, setNotes] = useState(order.payment.notes ?? "");
  const [deliveryFloor, setDeliveryFloor] = useState(
    String(order.deliveryFloor ?? 0),
  );
  const [liftAccessAvailable, setLiftAccessAvailable] = useState(
    order.liftAccessAvailable ?? false,
  );

  useEffect(() => {
    setNotes(order.payment.notes ?? "");
    setDeliveryFloor(String(order.deliveryFloor ?? 0));
    setLiftAccessAvailable(order.liftAccessAvailable ?? false);
  }, [
    order.id,
    order.payment.notes,
    order.deliveryFloor,
    order.liftAccessAvailable,
  ]);

  if (!canUpdate) {
    return null;
  }

  const handleSubmit = async () => {
    const payload: UpdateOrderPayload = {};
    if (notes !== (order.payment.notes ?? "")) {
      payload.payment = { notes };
    }

    const parsedFloor = parseInt(deliveryFloor, 10);
    if (!Number.isFinite(parsedFloor) || parsedFloor < 0 || parsedFloor > 100) {
      toast.error("Delivery floor must be between 0 and 100");
      return;
    }
    if (parsedFloor !== (order.deliveryFloor ?? 0)) {
      payload.deliveryFloor = parsedFloor;
    }
    if (liftAccessAvailable !== (order.liftAccessAvailable ?? false)) {
      payload.liftAccessAvailable = liftAccessAvailable;
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
        <CardTitle>Order options</CardTitle>
        <CardDescription>
          Update delivery floor, lift access, and internal payment notes.
          Fulfillment status is edited from the bar above.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="delivery-floor">Delivery floor</Label>
          <Input
            id="delivery-floor"
            type="number"
            min={0}
            max={100}
            step={1}
            className="min-h-11"
            value={deliveryFloor}
            onChange={(e) => setDeliveryFloor(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Ground = 0. Changing floor recalculates floor delivery labor on the
            server when lift access is not available (ADMIN / SUPER_ADMIN only).
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <div className="space-y-0.5">
            <Label htmlFor="lift-access">Lift accessible for delivery</Label>
            <p className="text-xs text-muted-foreground">
              When enabled, floor carry-up charges are waived.
            </p>
          </div>
          <Switch
            id="lift-access"
            checked={liftAccessAvailable}
            onCheckedChange={setLiftAccessAvailable}
          />
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
        <Button
          className="min-h-11 w-full"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
