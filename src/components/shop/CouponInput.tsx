import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { validateCoupon } from "@/services/shop-coupons.service";
import type { ValidateCouponResponse } from "@/services/shop-coupons.service";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

type CouponInputProps = {
  onValidated: (result: ValidateCouponResponse | null) => void;
};

export function CouponInput({ onValidated }: CouponInputProps) {
  const { getOrderItems, items } = useCart();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<ValidateCouponResponse | null>(null);

  const cartFingerprint = useMemo(
    () =>
      items
        .map((item) => `${item.productId}:${item.quantity}`)
        .sort()
        .join("|"),
    [items],
  );

  useEffect(() => {
    if (!applied) return;
    setApplied(null);
    onValidated(null);
    toast.message("Cart changed — re-apply your coupon if needed.");
  }, [cartFingerprint]); // eslint-disable-line react-hooks/exhaustive-deps -- clear when cart lines change only

  async function handleApply() {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const result = await validateCoupon({
        code: trimmed.toUpperCase(),
        items: getOrderItems(),
      });
      setApplied(result);
      onValidated(result);
      toast.success(`Coupon ${result.code} applied`);
    } catch (error) {
      setApplied(null);
      onValidated(null);
      toast.error(error instanceof ApiError ? error.message : "Invalid coupon");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setCode("");
    setApplied(null);
    onValidated(null);
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#E8DFD3] bg-white p-4">
      <Label htmlFor="coupon-code">Promo code</Label>
      <div className="flex gap-2">
        <Input
          id="coupon-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="SAVE500"
          disabled={Boolean(applied)}
        />
        {applied ? (
          <Button variant="outline" onClick={handleClear}>
            Remove
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={loading || !code.trim()}
            onClick={() => void handleApply()}
          >
            {loading ? "Checking..." : "Apply"}
          </Button>
        )}
      </div>
      {applied && (
        <p className="text-sm text-[#5C7A4A]">
          You save {formatCurrency(applied.discountAmount)}. New total{" "}
          {formatCurrency(applied.totalAmount)}.
        </p>
      )}
    </div>
  );
}
