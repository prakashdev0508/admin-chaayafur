import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Coupon,
  CouponFormValues,
  CreateCouponPayload,
  UpdateCouponPayload,
} from "@/types/coupon";

type CouponFormProps = {
  initial?: Coupon;
  onSubmit: (payload: CreateCouponPayload | UpdateCouponPayload) => Promise<unknown>;
  loading?: boolean;
  mode: "create" | "edit";
};

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  return new Date(value).toISOString();
}

function getInitialValues(coupon?: Coupon): CouponFormValues {
  if (!coupon) {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return {
      code: "",
      type: "FLAT_CART",
      visibility: "PUBLIC",
      discountValue: 100,
      minCartAmount: 0,
      maxUses: "",
      startsAt: toDatetimeLocal(now.toISOString()),
      expiresAt: toDatetimeLocal(nextMonth.toISOString()),
      isActive: true,
      description: "",
    };
  }
  return {
    code: coupon.code,
    type: coupon.type,
    visibility: coupon.visibility,
    discountValue: parseFloat(coupon.discountValue),
    minCartAmount: parseFloat(coupon.minCartAmount),
    maxUses: coupon.maxUses !== null ? String(coupon.maxUses) : "",
    startsAt: toDatetimeLocal(coupon.startsAt),
    expiresAt: toDatetimeLocal(coupon.expiresAt),
    isActive: coupon.isActive,
    description: coupon.description ?? "",
  };
}

export function CouponForm({ initial, onSubmit, loading, mode }: CouponFormProps) {
  const [values, setValues] = useState<CouponFormValues>(() =>
    getInitialValues(initial),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const base = {
      type: values.type,
      visibility: values.visibility,
      discountValue: values.discountValue,
      minCartAmount: values.minCartAmount,
      startsAt: fromDatetimeLocal(values.startsAt),
      expiresAt: fromDatetimeLocal(values.expiresAt),
      isActive: values.isActive,
      description: values.description.trim() || undefined,
      ...(values.maxUses.trim()
        ? { maxUses: Number(values.maxUses) }
        : {}),
    };

    if (mode === "create") {
      await onSubmit({
        ...base,
        code: values.code.trim().toUpperCase(),
      } as CreateCouponPayload);
    } else {
      await onSubmit(base as UpdateCouponPayload);
    }
  };

  const set = <K extends keyof CouponFormValues>(
    key: K,
    value: CouponFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
      {mode === "create" && (
        <div className="space-y-2">
          <Label htmlFor="code">Coupon code</Label>
          <Input
            id="code"
            value={values.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="SAVE500"
            required
            maxLength={32}
          />
          <p className="text-xs text-muted-foreground">
            Code cannot be changed after creation.
          </p>
        </div>
      )}

      {mode === "edit" && initial && (
        <div className="space-y-2">
          <Label>Coupon code</Label>
          <Input value={initial.code} disabled />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={values.type}
            onValueChange={(v) => v && set("type", v as CouponFormValues["type"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FLAT_CART">Flat amount (₹)</SelectItem>
              <SelectItem value="PERCENTAGE_CART">Percentage (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select
            value={values.visibility}
            onValueChange={(v) =>
              v && set("visibility", v as CouponFormValues["visibility"])
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="discount">
            {values.type === "FLAT_CART" ? "Discount (₹)" : "Discount (%)"}
          </Label>
          <Input
            id="discount"
            type="number"
            min={values.type === "PERCENTAGE_CART" ? 1 : 0.01}
            max={values.type === "PERCENTAGE_CART" ? 100 : undefined}
            step="any"
            value={values.discountValue}
            onChange={(e) => set("discountValue", Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minCart">Minimum cart (₹)</Label>
          <Input
            id="minCart"
            type="number"
            min={0}
            step="any"
            value={values.minCartAmount}
            onChange={(e) => set("minCartAmount", Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxUses">Max uses (optional)</Label>
        <Input
          id="maxUses"
          type="number"
          min={1}
          placeholder="Unlimited"
          value={values.maxUses}
          onChange={(e) => set("maxUses", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Starts at</Label>
          <Input
            id="startsAt"
            type="datetime-local"
            value={values.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiresAt">Expires at</Label>
          <Input
            id="expiresAt"
            type="datetime-local"
            value={values.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Promotional text shown on the website..."
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label htmlFor="isActive">Active</Label>
          <p className="text-sm text-muted-foreground">
            Inactive coupons cannot be applied at checkout.
          </p>
        </div>
        <Switch
          id="isActive"
          checked={values.isActive}
          onCheckedChange={(checked) => set("isActive", checked)}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : mode === "create" ? "Create coupon" : "Save changes"}
      </Button>
    </form>
  );
}
