import { buildQueryString } from "@/lib/build-query";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  Coupon,
  CouponDetail,
  CreateCouponPayload,
  GetCouponParams,
  ListCouponsParams,
  UpdateCouponPayload,
} from "@/types/coupon";

export function listCoupons(params: ListCouponsParams = {}) {
  return apiRequest<PaginatedResponse<Coupon>>(
    `/coupons${buildQueryString(params)}`,
  );
}

export function getCoupon(id: number, params: GetCouponParams = {}) {
  return apiRequest<CouponDetail>(
    `/coupons/${id}${buildQueryString(params)}`,
  );
}

export function createCoupon(payload: CreateCouponPayload) {
  return apiRequest<Coupon>("/coupons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCoupon(id: number, payload: UpdateCouponPayload) {
  return apiRequest<Coupon>(`/coupons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
