import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { QuotationLineItemsEditor } from "@/components/quotations/QuotationLineItemsEditor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { queryKeys } from "@/lib/query-keys";
import { createAdminOrder } from "@/services/orders.service";
import type { CreateAdminOrderPayload, OrderAddressSnapshot } from "@/types/order";
import type { OrderLineInput } from "@/types/order";
import type { QuotationLineItem } from "@/types/quotation";

function buildAddressSnapshot(params: {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}): OrderAddressSnapshot {
  return {
    name: params.name.trim(),
    email: params.email.trim() || undefined,
    phone: params.phone.trim() || undefined,
    line1: params.line1.trim(),
    ...(params.line2.trim() ? { line2: params.line2.trim() } : {}),
    city: params.city.trim(),
    state: params.state.trim(),
    zipCode: params.zipCode.trim(),
    ...(params.country.trim() ? { country: params.country.trim() } : {}),
  };
}

export function ManualOrderCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [phone, setPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [email, setEmail] = useState("");

  const [shippingLine1, setShippingLine1] = useState("");
  const [shippingLine2, setShippingLine2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZipCode, setShippingZipCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("IN");

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingLine1, setBillingLine1] = useState("");
  const [billingLine2, setBillingLine2] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingZipCode, setBillingZipCode] = useState("");
  const [billingCountry, setBillingCountry] = useState("IN");

  const [deliveryFloor, setDeliveryFloor] = useState<number>(0);
  const [liftAccessAvailable, setLiftAccessAvailable] = useState(false);

  const [items, setItems] = useState<QuotationLineItem[]>([]);
  const canSubmitHint = useMemo(() => {
    if (items.length === 0) return "Add at least one item";
    if (!phone.trim()) return "Enter customer phone";
    if (!recipientName.trim()) return "Enter recipient name";
    if (!shippingLine1.trim()) return "Enter shipping address";
    if (!shippingCity.trim() || !shippingState.trim() || !shippingZipCode.trim())
      return "Enter full shipping address";
    if (!billingSameAsShipping) {
      if (
        !billingLine1.trim() ||
        !billingCity.trim() ||
        !billingState.trim() ||
        !billingZipCode.trim()
      ) {
        return "Enter full billing address";
      }
    }
    return null;
  }, [
    items.length,
    phone,
    recipientName,
    shippingLine1,
    shippingCity,
    shippingState,
    shippingZipCode,
    billingSameAsShipping,
    billingLine1,
    billingCity,
    billingState,
    billingZipCode,
  ]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminOrderPayload) => createAdminOrder(payload),
    onSuccess: async (order) => {
      toast.success("Manual order created");
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      navigate(`/orders/${order.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create manual order",
      );
    },
  });

  async function handleCreate() {
    const normalizedPhone = phone.trim();
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!recipientName.trim()) {
      toast.error("Recipient name is required");
      return;
    }
    if (!shippingLine1.trim() || !shippingCity.trim() || !shippingState.trim()) {
      toast.error("Shipping address is incomplete");
      return;
    }
    if (!shippingZipCode.trim()) {
      toast.error("Shipping PIN code is required");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    const shipping: OrderAddressSnapshot = buildAddressSnapshot({
      name: recipientName,
      email,
      phone: normalizedPhone,
      line1: shippingLine1,
      line2: shippingLine2,
      city: shippingCity,
      state: shippingState,
      zipCode: shippingZipCode,
      country: shippingCountry,
    });

    const billing: OrderAddressSnapshot | undefined =
      billingSameAsShipping
        ? undefined
        : buildAddressSnapshot({
            name: recipientName,
            email,
            phone: normalizedPhone,
            line1: billingLine1,
            line2: billingLine2,
            city: billingCity,
            state: billingState,
            zipCode: billingZipCode,
            country: billingCountry,
          });

    if (!billingSameAsShipping) {
      if (
        !billingLine1.trim() ||
        !billingCity.trim() ||
        !billingState.trim() ||
        !billingZipCode.trim()
      ) {
        toast.error("Billing address is incomplete");
        return;
      }
    }

    const orderItems: OrderLineInput[] = items.map((item) => {
      const image =
        item.imageUrl && item.imageStorageKey
          ? { url: item.imageUrl, storageKey: item.imageStorageKey }
          : null;

      if (item.productId == null || item.productId === 0) {
        return {
          type: "CUSTOM",
          productName: item.productName.trim(),
          quantity: item.quantity,
          price: item.unitPrice,
          ...(image ? { image } : {}),
        };
      }

      return {
        type: "CATALOG",
        productId: item.productId,
        quantity: item.quantity,
      };
    });

    const payload: CreateAdminOrderPayload = {
      phone: normalizedPhone,
      shipping,
      billingSameAsShipping,
      ...(billing ? { billing } : {}),
      deliveryFloor,
      liftAccessAvailable,
      items: orderItems,
    };

    await createMutation.mutateAsync(payload);
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PageHeader
        title="Create manual order"
        description="Create a MANUAL order with mixed catalog + custom off-catalog items."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            />
            <Button
              type="button"
              onClick={() => void handleCreate()}
              disabled={createMutation.isPending || Boolean(canSubmitHint)}
            >
              {createMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Create order"
              )}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Customer & addresses</CardTitle>
          <CardDescription>
            Shipping and billing snapshots are stored on the MANUAL order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient name</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Priya Sharma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Customer phone</Label>
              <Input
                id="phone"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border bg-muted/10 p-4">
              <p className="text-sm font-medium">Shipping snapshot</p>
              <div className="space-y-2">
                <Label htmlFor="shippingLine1">Address line 1</Label>
                <Input
                  id="shippingLine1"
                  value={shippingLine1}
                  onChange={(e) => setShippingLine1(e.target.value)}
                  placeholder="H.No. 8-2-293, Banjara Hills"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingLine2">Address line 2 (optional)</Label>
                <Input
                  id="shippingLine2"
                  value={shippingLine2}
                  onChange={(e) => setShippingLine2(e.target.value)}
                  placeholder="Landmark / flat no."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shippingCity">City</Label>
                  <Input
                    id="shippingCity"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="Hyderabad"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingState">State</Label>
                  <Input
                    id="shippingState"
                    value={shippingState}
                    onChange={(e) => setShippingState(e.target.value)}
                    placeholder="Telangana"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shippingZipCode">PIN code</Label>
                  <Input
                    id="shippingZipCode"
                    inputMode="numeric"
                    value={shippingZipCode}
                    onChange={(e) =>
                      setShippingZipCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="500034"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingCountry">Country</Label>
                  <Input
                    id="shippingCountry"
                    value={shippingCountry}
                    onChange={(e) => setShippingCountry(e.target.value)}
                    placeholder="IN"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Billing snapshot</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Same as shipping
                  </span>
                  <Switch
                    checked={billingSameAsShipping}
                    onCheckedChange={setBillingSameAsShipping}
                  />
                </div>
              </div>

              {!billingSameAsShipping ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="billingLine1">Address line 1</Label>
                    <Input
                      id="billingLine1"
                      value={billingLine1}
                      onChange={(e) => setBillingLine1(e.target.value)}
                      placeholder="H.No. ..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingLine2">Address line 2 (optional)</Label>
                    <Input
                      id="billingLine2"
                      value={billingLine2}
                      onChange={(e) => setBillingLine2(e.target.value)}
                      placeholder="Landmark / flat no."
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billingCity">City</Label>
                      <Input
                        id="billingCity"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        placeholder="Hyderabad"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingState">State</Label>
                      <Input
                        id="billingState"
                        value={billingState}
                        onChange={(e) => setBillingState(e.target.value)}
                        placeholder="Telangana"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billingZipCode">PIN code</Label>
                      <Input
                        id="billingZipCode"
                        inputMode="numeric"
                        value={billingZipCode}
                        onChange={(e) =>
                          setBillingZipCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="500034"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingCountry">Country</Label>
                      <Input
                        id="billingCountry"
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        placeholder="IN"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Billing will be the same as shipping.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deliveryFloor">Delivery floor</Label>
              <Input
                id="deliveryFloor"
                type="number"
                value={deliveryFloor}
                onChange={(e) =>
                  setDeliveryFloor(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)
                }
              />
            </div>
            <div className="flex items-end justify-between rounded-lg border bg-background p-4">
              <div>
                <Label>Lift access available</Label>
                <p className="text-xs text-muted-foreground">
                  Whether delivery staff can use a lift.
                </p>
              </div>
              <Switch
                checked={liftAccessAvailable}
                onCheckedChange={setLiftAccessAvailable}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            Add CATALOG products and/or CUSTOM off-catalog items (with optional line images).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuotationLineItemsEditor items={items} onChange={setItems} />
        </CardContent>
      </Card>

      {canSubmitHint ? (
        <p className="text-sm text-muted-foreground">{canSubmitHint}</p>
      ) : null}
    </div>
  );
}

