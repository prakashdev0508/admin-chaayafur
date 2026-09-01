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
import { usePincodeLookup } from "@/hooks/usePincodeLookup";
import { toast } from "sonner";
import { ADDRESS_TYPE_ITEMS } from "@/lib/select-items";
import {
  gstinForCreate,
  gstinForUpdate,
  isValidGstin,
} from "@/lib/address-utils";
import type {
  AddressType,
  CreateAddressPayload,
  CustomerAddress,
} from "@/types/address";

type ShopAddressFormProps = {
  initial?: CustomerAddress;
  /** Prefill / lock type when creating from a filtered picker. */
  defaultType?: AddressType;
  /** When true, hide the type selector (picker supplies type). */
  lockType?: boolean;
  onSubmit: (payload: CreateAddressPayload) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
};

export function ShopAddressForm({
  initial,
  defaultType = "SHIPPING",
  lockType = false,
  onSubmit,
  onCancel,
  loading,
}: ShopAddressFormProps) {
  const [type, setType] = useState<AddressType>(initial?.type ?? defaultType);
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? true);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [zipCode, setZipCode] = useState(initial?.zipCode ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");

  const pincodeLookup = usePincodeLookup(zipCode, {
    onResolved: (result) => {
      setCity(result.city);
      setState(result.state);
    },
  });

  const isCreate = !initial;
  const showSameAsBilling = isCreate && type === "SHIPPING";

  return (
    <form
      className="space-y-4 rounded-xl border border-[#E8DFD3] bg-white p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") || "").trim();
        const phone = String(form.get("phone") || "").trim();
        const line2 = String(form.get("line2") || "").trim();
        const gstinRaw = String(form.get("gstin") || "");

        if (!isValidGstin(gstinRaw)) {
          toast.error("GSTIN must be 15 characters when provided");
          return;
        }

        const gstin = initial
          ? gstinForUpdate(gstinRaw)
          : gstinForCreate(gstinRaw);

        await onSubmit({
          type,
          name: String(form.get("name")),
          line1: String(form.get("line1")),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
          country: String(form.get("country") || "IN"),
          isDefault,
          ...(showSameAsBilling && sameAsBilling ? { sameAsBilling: true } : {}),
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          ...(line2 ? { line2 } : {}),
          ...(gstin !== undefined ? { gstin } : {}),
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {!lockType && (
          <div className="space-y-2">
            <Label>Address type</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                if (!v) return;
                const next = v as AddressType;
                setType(next);
                if (next !== "SHIPPING") setSameAsBilling(false);
              }}
              items={ADDRESS_TYPE_ITEMS}
              disabled={Boolean(initial)}
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
        )}
        <div className={`space-y-2 ${lockType ? "sm:col-span-2" : ""}`}>
          <Label htmlFor="address-name">Full name</Label>
          <Input id="address-name" name="name" defaultValue={initial?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-phone">Phone</Label>
          <Input id="address-phone" name="phone" defaultValue={initial?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-email">Email</Label>
          <Input
            id="address-email"
            name="email"
            type="email"
            defaultValue={initial?.email ?? ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address-gstin">
            GSTIN{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="address-gstin"
            name="gstin"
            defaultValue={initial?.gstin ?? ""}
            maxLength={15}
            placeholder="15-character GSTIN"
            className="uppercase"
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase().replace(/\s/g, "");
            }}
          />
          <p className="text-xs text-muted-foreground">
            Optional. Useful on billing addresses for tax invoices.
          </p>
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
          <Label htmlFor="address-zip">PIN code</Label>
          <Input
            id="address-zip"
            name="zipCode"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            pattern="\d{6}"
            title="6-digit Indian PIN code"
            required
          />
          {pincodeLookup.isLoading && (
            <p className="text-xs text-muted-foreground">Looking up city and state…</p>
          )}
          {pincodeLookup.error && (
            <p className="text-xs text-destructive">{pincodeLookup.error}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-country">Country</Label>
          <Input id="address-country" name="country" defaultValue={initial?.country ?? "IN"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-city">City</Label>
          <Input
            id="address-city"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address-state">State</Label>
          <Input
            id="address-state"
            name="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
          />
        </div>
      </div>

      {showSameAsBilling && (
        <div className="flex items-center justify-between rounded-lg border border-dashed border-[#E8DFD3] px-3 py-2">
          <div>
            <p className="text-sm font-medium">Also save as billing address</p>
            <p className="text-xs text-muted-foreground">
              Creates a matching billing address (uses 2 of 5 slots)
            </p>
          </div>
          <Switch checked={sameAsBilling} onCheckedChange={setSameAsBilling} />
        </div>
      )}

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
