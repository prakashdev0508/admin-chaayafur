import { apiRequest } from "@/lib/api";
import type { Coupon } from "@/types/coupon";

export type ValidateCouponPayload = {
  code: string;
  items: { productId: number; quantity: number }[];
};

export type ValidateCouponResponse = {
  couponId: number;
  code: string;
  type: string;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  minCartAmount: string;
};

export function listPublicCoupons() {
  return apiRequest<Coupon[]>("/coupons/public", {}, false);
}

export function validateCoupon(payload: ValidateCouponPayload) {
  return apiRequest<ValidateCouponResponse>("/coupons/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  }, "customer");
}
