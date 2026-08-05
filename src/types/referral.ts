import type { OrderStatus } from "@/types/order";

export type ReferralStatus = "PENDING" | "CREDITED" | "CANCELLED";

export type ReferralCustomerSummary = {
  id: number;
  phone: string;
  referralCode?: string | null;
};

export type ReferralOrderSummary = {
  id: number;
  orderNumber: string;
  status: OrderStatus;
};

export type MyReferralCode = {
  code: string;
  shareUrl: string | null;
};

export type CustomerReferralListItem = {
  id: number;
  status: ReferralStatus;
  orderTotalAmount: string;
  commissionRate: string;
  commissionAmount: string;
  creditedAt: string | null;
  createdAt: string;
  order: ReferralOrderSummary;
  referee: ReferralCustomerSummary;
};

export type AdminReferralListItem = CustomerReferralListItem & {
  referrer: ReferralCustomerSummary;
};

export type ListAdminReferralsParams = {
  page?: number;
  limit?: number;
  status?: ReferralStatus;
};

export type ListMyReferralsParams = {
  page?: number;
  limit?: number;
};
