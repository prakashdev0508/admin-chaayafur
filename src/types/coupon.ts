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
  perPersonAllowed: number | null;
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
  perPersonAllowed: string;
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
  perPersonAllowed?: number;
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

export type CouponRedemption = {
  id: number;
  orderId: number;
  customerId: number;
  discountAmount: string;
  createdAt: string;
  customer: { id: number; phone: string };
  order: {
    id: number;
    orderNumber: string;
    status: import("@/types/order").OrderStatus;
    totalAmount: string;
    createdAt: string;
  };
};

/** GET /coupons/:id — includes paginated all-time redemptions */
export type CouponDetail = Coupon & {
  redemptions: import("@/types/api").PaginatedResponse<CouponRedemption>;
};

export type GetCouponParams = {
  page?: number;
  limit?: number;
};
