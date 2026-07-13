import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CreateAddressPayload, CustomerAddress } from "@/types/address";

type ShopAddressFormProps = {
  initial?: CustomerAddress;
  onSubmit: (payload: CreateAddressPayload) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
};

export function ShopAddressForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: ShopAddressFormProps) {
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? true);

  return (
    <form
      className="space-y-4 rounded-xl border border-[#E8DFD3] bg-white p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") || "").trim();
        const phone = String(form.get("phone") || "").trim();
        const line2 = String(form.get("line2") || "").trim();

        await onSubmit({
          type: "SHIPPING",
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
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address-name">Full name</Label>
          <Input id="address-name" name="name" defaultValue={initial?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-phone">Phone</Label>
          <Input id="address-phone" name="phone" defaultValue={initial?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-email">Email</Label>
          <Input id="address-email" name="email" type="email" defaultValue={initial?.email ?? ""} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address-line1">Address line 1</Label>
          <Input id="address-line1" name="line1" defaultValue={initial?.line1} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address-line2">Address line 2</Label>
          <Input id="address-line2" name="line2" defaultValue={initial?.line2 ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-city">City</Label>
          <Input id="address-city" name="city" defaultValue={initial?.city} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-state">State</Label>
          <Input id="address-state" name="state" defaultValue={initial?.state} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-zip">PIN code</Label>
          <Input id="address-zip" name="zipCode" defaultValue={initial?.zipCode} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-country">Country</Label>
          <Input id="address-country" name="country" defaultValue={initial?.country ?? "IN"} />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-dashed border-[#E8DFD3] px-3 py-2">
        <div>
          <p className="text-sm font-medium">Set as default address</p>
          <p className="text-xs text-muted-foreground">Use this for future checkouts</p>
        </div>
        <Switch checked={isDefault} onCheckedChange={setIsDefault} />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="bg-[#8B5E3C] hover:bg-[#744C31]" disabled={loading}>
          {loading ? "Saving..." : initial ? "Update address" : "Save address"}
        </Button>
      </div>
    </form>
  );
}
