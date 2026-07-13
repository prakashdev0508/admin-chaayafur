import type { Coupon } from "@/types/coupon";
import type { StatusVariant } from "@/lib/status-variants";

export function getCouponStatus(coupon: Coupon): {
  label: string;
  variant: StatusVariant;
} {
  const now = Date.now();
  const starts = new Date(coupon.startsAt).getTime();
  const expires = new Date(coupon.expiresAt).getTime();

  if (!coupon.isActive) {
    return { label: "Inactive", variant: "neutral" };
  }
  if (now < starts) {
    return { label: "Scheduled", variant: "default" };
  }
  if (now > expires) {
    return { label: "Expired", variant: "danger" };
  }
  if (
    coupon.maxUses !== null &&
    coupon.usedCount >= coupon.maxUses
  ) {
    return { label: "Exhausted", variant: "warning" };
  }
  return { label: "Active", variant: "success" };
}

export function formatCouponDiscount(coupon: Coupon) {
  if (coupon.type === "FLAT_CART") {
    return `₹${coupon.discountValue}`;
  }
  return `${coupon.discountValue}%`;
}
