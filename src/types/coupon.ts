export type CouponType = "FLAT_CART" | "PERCENTAGE_CART";
export type CouponVisibility = "PUBLIC" | "PRIVATE";

export type Coupon = {
  id: number;
  code: string;
  type: CouponType;
  visibility: CouponVisibility;
  discountValue: string;
  minCartAmount: string;
  maxUses: number | null;
  usedCount: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CouponFormValues = {
  code: string;
  type: CouponType;
  visibility: CouponVisibility;
  discountValue: number;
  minCartAmount: number;
  maxUses: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  description: string;
};

export type CreateCouponPayload = {
  code: string;
  type: CouponType;
  visibility: CouponVisibility;
  discountValue: number;
  minCartAmount: number;
  maxUses?: number;
  startsAt: string;
  expiresAt: string;
  isActive?: boolean;
  description?: string;
};

export type UpdateCouponPayload = Partial<
  Omit<CreateCouponPayload, "code">
>;

export type ListCouponsParams = {
  page?: number;
  limit?: number;
};
