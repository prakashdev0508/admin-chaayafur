import type { OrderStatus } from "@/types/order";
import type {
  CustomerAddress,
  CreateAddressPayload,
  UpdateAddressPayload,
} from "@/types/address";

export type { CustomerAddress, CreateAddressPayload, UpdateAddressPayload };
export type { AddressType } from "@/types/address";

export type CustomerOrderSummary = {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: string;
  createdAt: string;
};

export type Customer = {
  id: number;
  phone: string;
  name?: string | null;
  isActive: boolean;
  lastLogin: string | null;
  loginBonusReceived?: boolean;
  loginBonusReceivedAt?: string | null;
  orderCount: number;
  reviewCount: number;
  addresses: CustomerAddress[];
  /** Embedded server cart from GET /customers/:id; null if never created */
  cart: import("@/types/cart").AdminCartDetail | null;
  recentOrders: CustomerOrderSummary[];
  /** Embedded follow-ups from GET /customers/:id when present */
  followUps?: CustomerFollowUp[];
};

export type CustomerFollowUp = {
  id: number;
  customerId?: number;
  remark: string;
  nextFollowUpDate: string;
  isFollowedUp: boolean;
  createdByStaffId: number;
  createdAt: string;
  customer?: { id: number; phone: string };
};

export type CreateCustomerFollowUpPayload = {
  remark: string;
  /** Calendar date YYYY-MM-DD */
  nextFollowUpDate: string;
};

export type UpdateCustomerFollowUpPayload = {
  isFollowedUp: boolean;
};

export type CustomerFollowUpsListResponse = {
  items: CustomerFollowUp[];
};

export type DayFollowUpsResponse = {
  date: string;
  items: CustomerFollowUp[];
};

export type ListDayFollowUpsParams = {
  date?: string;
};

export type CustomerListItem = {
  id: number;
  phone: string;
  isActive: boolean;
  lastLogin: string | null;
  orderCount: number;
  /** Total follow-ups (completed + incomplete) */
  followUpCount: number;
};

export type ListCustomersParams = {
  page?: number;
  limit?: number;
  phone?: string;
};

export type CreateCustomerPayload = {
  phone: string;
};

export type UpdateCustomerPayload = {
  isActive?: boolean;
};

export type ListCustomerOrdersParams = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
};
