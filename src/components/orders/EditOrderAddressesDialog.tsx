import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePincodeLookup } from "@/hooks/usePincodeLookup";
import { isValidGstin } from "@/lib/address-utils";
import { formatOrderAddressRef } from "@/lib/order-utils";
import { orderShowsSeparateBilling } from "@/lib/order-customization-materials";
import {
  buildOrderAddressSnapshot,
  orderAddressRefToSnapshot,
} from "@/lib/order-address-snapshot";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { getCustomer } from "@/services/customers.service";
import { updateOrder } from "@/services/orders.service";
import type { CustomerAddress } from "@/types/address";
import type { Order, OrderAddressSnapshot, UpdateOrderPayload } from "@/types/order";

type EditOrderAddressesDialogProps = {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function emptySnapshot(phone: string): OrderAddressSnapshot {
  return {
    name: phone,
    phone,
    line1: "",
    city: "",
    state: "",
    zipCode: "",
    country: "IN",
  };
}

function snapshotToForm(snapshot: OrderAddressSnapshot) {
  return {
    name: snapshot.name ?? "",
    email: snapshot.email ?? "",
    phone: snapshot.phone ?? "",
    line1: snapshot.line1 ?? "",
    line2: snapshot.line2 ?? "",
    city: snapshot.city ?? "",
    state: snapshot.state ?? "",
    zipCode: snapshot.zipCode ?? "",
    country: snapshot.country ?? "IN",
    gstin: snapshot.gstin ?? "",
  };
}

type InlineAddressFormProps = {
  idPrefix: string;
  title: string;
  values: ReturnType<typeof snapshotToForm>;
  onChange: (patch: Partial<ReturnType<typeof snapshotToForm>>) => void;
  pincodeEnabled?: boolean;
};

function InlineAddressForm({
  idPrefix,
  title,
  values,
  onChange,
  pincodeEnabled = true,
}: InlineAddressFormProps) {
  const pincodeLookup = usePincodeLookup(pincodeEnabled ? values.zipCode : "", {
    onResolved: (result) => {
      onChange({ city: result.city, state: result.state });
    },
  });

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
      <p className="text-sm font-medium">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-name`}>Name</Label>
          <Input
            id={`${idPrefix}-name`}
            value={values.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-phone`}>Phone</Label>
          <Input
            id={`${idPrefix}-phone`}
            value={values.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-email`}>Email</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            value={values.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-line1`}>Address line 1</Label>
          <Input
            id={`${idPrefix}-line1`}
            value={values.line1}
            onChange={(e) => onChange({ line1: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-line2`}>Address line 2</Label>
          <Input
            id={`${idPrefix}-line2`}
            value={values.line2}
            onChange={(e) => onChange({ line2: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-zip`}>PIN code</Label>
          <Input
            id={`${idPrefix}-zip`}
            inputMode="numeric"
            value={values.zipCode}
            onChange={(e) => onChange({ zipCode: e.target.value })}
          />
          {pincodeLookup.isLoading && (
            <p className="text-xs text-muted-foreground">Looking up city…</p>
          )}
          {pincodeLookup.error && (
            <p className="text-xs text-destructive">{pincodeLookup.error}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-country`}>Country</Label>
          <Input
            id={`${idPrefix}-country`}
            value={values.country}
            onChange={(e) => onChange({ country: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-city`}>City</Label>
          <Input
            id={`${idPrefix}-city`}
            value={values.city}
            onChange={(e) => onChange({ city: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-state`}>State</Label>
          <Input
            id={`${idPrefix}-state`}
            value={values.state}
            onChange={(e) => onChange({ state: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-gstin`}>GSTIN (optional)</Label>
          <Input
            id={`${idPrefix}-gstin`}
            value={values.gstin}
            onChange={(e) => onChange({ gstin: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function AddressPickCard({
  address,
  selected,
  onSelect,
}: {
  address: CustomerAddress;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/40",
        selected && "border-primary ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{address.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {address.type === "BILLING" ? "Billing" : "Shipping"}
            {address.isDefault ? " · Default" : ""}
          </p>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">
            {formatOrderAddressRef(address)}
          </p>
        </div>
        {selected ? (
          <span className="shrink-0 text-xs font-medium text-primary">
            Selected
          </span>
        ) : null}
      </div>
    </button>
  );
}

export function EditOrderAddressesDialog({
  order,
  open,
  onOpenChange,
}: EditOrderAddressesDialogProps) {
  const queryClient = useQueryClient();
  const isManual = order.orderType === "MANUAL";

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [shippingForm, setShippingForm] = useState(() =>
    snapshotToForm(emptySnapshot(order.customer.phone)),
  );
  const [billingForm, setBillingForm] = useState(() =>
    snapshotToForm(emptySnapshot(order.customer.phone)),
  );
  const [shippingAddressId, setShippingAddressId] = useState<number | null>(
    order.addressId,
  );
  const [billingAddressId, setBillingAddressId] = useState<number | null>(
    order.billingAddressId,
  );

  const customerQuery = useQuery({
    queryKey: queryKeys.customers.detail(order.customerId),
    queryFn: () => getCustomer(order.customerId),
    enabled: open && !isManual,
  });

  const addresses = customerQuery.data?.addresses ?? [];

  const shippingOptions = useMemo(
    () =>
      addresses.filter(
        (a) => a.type === "SHIPPING" || a.type === "BILLING",
      ),
    [addresses],
  );
  const billingOptions = useMemo(
    () =>
      addresses.filter(
        (a) => a.type === "BILLING" || a.type === "SHIPPING",
      ),
    [addresses],
  );

  useEffect(() => {
    if (!open) return;

    if (isManual) {
      setBillingSameAsShipping(
        order.billingAddress.trim() === order.shippingAddress.trim(),
      );
      const shipSnap = order.shippingAddressRef
        ? orderAddressRefToSnapshot(order.shippingAddressRef)
        : emptySnapshot(order.customer.phone);
      setShippingForm(snapshotToForm(shipSnap));

      const billSnap = order.billingAddressRef
        ? orderAddressRefToSnapshot(order.billingAddressRef)
        : shipSnap;
      setBillingForm(snapshotToForm(billSnap));
    } else {
      const separateBilling = orderShowsSeparateBilling(order);
      setBillingSameAsShipping(!separateBilling);
      setShippingAddressId(order.addressId);
      setBillingAddressId(
        order.billingAddressId ?? order.addressId,
      );
    }
  }, [open, order, isManual]);

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateOrderPayload) =>
      updateOrder(order.id, payload),
    onSuccess: () => {
      toast.success("Addresses updated");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(order.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update addresses",
      );
    },
  });

  function validateManualSnapshot(form: ReturnType<typeof snapshotToForm>) {
    if (!form.line1.trim() || !form.city.trim() || !form.state.trim()) {
      return "Enter a complete address (line 1, city, state).";
    }
    if (!form.zipCode.trim()) {
      return "Enter a PIN code.";
    }
    if (!isValidGstin(form.gstin)) {
      return "GSTIN must be 15 characters when provided.";
    }
    return null;
  }

  function handleSave() {
    if (isManual) {
      const shipErr = validateManualSnapshot(shippingForm);
      if (shipErr) {
        toast.error(shipErr);
        return;
      }
      if (!billingSameAsShipping) {
        const billErr = validateManualSnapshot(billingForm);
        if (billErr) {
          toast.error(billErr);
          return;
        }
      }

      const shipping = buildOrderAddressSnapshot(shippingForm);
      const payload: UpdateOrderPayload = { shipping };
      if (billingSameAsShipping) {
        payload.billing = { ...shipping };
      } else {
        payload.billing = buildOrderAddressSnapshot(billingForm);
      }
      saveMutation.mutate(payload);
      return;
    }

    if (shippingAddressId == null) {
      toast.error("Select a shipping address");
      return;
    }
    const billingId = billingSameAsShipping
      ? shippingAddressId
      : billingAddressId;
    if (billingId == null) {
      toast.error("Select a billing address");
      return;
    }

    saveMutation.mutate({
      shippingAddressId,
      billingAddressId: billingId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Edit addresses</DialogTitle>
          <DialogDescription>
            {isManual
              ? "Updates the address snapshots stored on this manual order."
              : "Choose addresses from the customer's address book. Snapshots refresh on save."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {isManual ? (
            <>
              <InlineAddressForm
                idPrefix="ship"
                title="Shipping address"
                values={shippingForm}
                onChange={(patch) =>
                  setShippingForm((prev) => ({ ...prev, ...patch }))
                }
              />
              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Billing same as shipping</p>
                  <p className="text-xs text-muted-foreground">
                    Turn off to enter a separate billing snapshot.
                  </p>
                </div>
                <Switch
                  checked={billingSameAsShipping}
                  onCheckedChange={setBillingSameAsShipping}
                />
              </div>
              {!billingSameAsShipping ? (
                <InlineAddressForm
                  idPrefix="bill"
                  title="Billing address"
                  values={billingForm}
                  onChange={(patch) =>
                    setBillingForm((prev) => ({ ...prev, ...patch }))
                  }
                  pincodeEnabled={!billingSameAsShipping}
                />
              ) : null}
            </>
          ) : customerQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : shippingOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This customer has no saved addresses. Add addresses on the{" "}
              <Link
                to={`/customers/${order.customerId}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                customer profile
              </Link>{" "}
              first.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Shipping address</p>
                <div className="space-y-2">
                  {shippingOptions.map((address) => (
                    <AddressPickCard
                      key={`ship-${address.id}`}
                      address={address}
                      selected={shippingAddressId === address.id}
                      onSelect={() => setShippingAddressId(address.id)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Billing same as shipping</p>
                </div>
                <Switch
                  checked={billingSameAsShipping}
                  onCheckedChange={setBillingSameAsShipping}
                />
              </div>
              {!billingSameAsShipping ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Billing address</p>
                  <div className="space-y-2">
                    {billingOptions.map((address) => (
                      <AddressPickCard
                        key={`bill-${address.id}`}
                        address={address}
                        selected={billingAddressId === address.id}
                        onSelect={() => setBillingAddressId(address.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              saveMutation.isPending ||
              (!isManual &&
                !customerQuery.isLoading &&
                shippingOptions.length === 0)
            }
          >
            {saveMutation.isPending ? "Saving…" : "Save addresses"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
