import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AddressType,
  CreateAddressPayload,
  CustomerAddress,
  UpdateAddressPayload,
} from "@/types/address";
import { ADDRESS_TYPE_ITEMS } from "@/lib/select-items";

type AddressFormProps = {
  initial?: CustomerAddress;
  onSubmit: (
    payload: CreateAddressPayload | UpdateAddressPayload,
  ) => Promise<unknown>;
  onCancel: () => void;
  loading?: boolean;
};

export function AddressForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: AddressFormProps) {
  const [type, setType] = useState<AddressType>(initial?.type ?? "SHIPPING");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);

  return (
    <form
      className="space-y-4 rounded-lg border p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = String(form.get("email") || "").trim();
        const phone = String(form.get("phone") || "").trim();
        const line2 = String(form.get("line2") || "").trim();

        const payload: CreateAddressPayload = {
          type,
          name: String(form.get("name")),
          line1: String(form.get("line1")),
          city: String(form.get("city")),
          state: String(form.get("state")),
          zipCode: String(form.get("zipCode")),
          country: String(form.get("country") || "IN"),
          isDefault,
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          ...(line2 ? { line2 } : {}),
        };
        await onSubmit(payload);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Address type</Label>
          <Select
            value={type}
            onValueChange={(v) => v && setType(v as AddressType)}
            items={ADDRESS_TYPE_ITEMS}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SHIPPING">Shipping</SelectItem>
              <SelectItem value="BILLING">Billing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Recipient name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initial?.name}
            placeholder="John Doe"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={initial?.email ?? ""}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={initial?.phone ?? ""}
            placeholder="9876543210"
            pattern="[0-9]{10}"
            title="10-digit Indian mobile number"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="line1">Address line 1</Label>
        <Input
          id="line1"
          name="line1"
          defaultValue={initial?.line1}
          maxLength={200}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="line2">Address line 2</Label>
        <Input
          id="line2"
          name="line2"
          defaultValue={initial?.line2 ?? ""}
          maxLength={200}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            defaultValue={initial?.city}
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            defaultValue={initial?.state}
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP code</Label>
          <Input
            id="zipCode"
            name="zipCode"
            defaultValue={initial?.zipCode}
            maxLength={20}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          name="country"
          defaultValue={initial?.country ?? "IN"}
          required
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="isDefault">Default address</Label>
          <p className="text-xs text-muted-foreground">
            Used as the default for this address type at checkout.
          </p>
        </div>
        <Switch
          id="isDefault"
          checked={isDefault}
          onCheckedChange={setIsDefault}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initial ? "Update address" : "Add address"}
        </Button>
      </div>
    </form>
  );
}
