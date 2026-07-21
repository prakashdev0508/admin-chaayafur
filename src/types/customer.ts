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
  isActive: boolean;
  lastLogin: string | null;
  orderCount: number;
  reviewCount: number;
  addresses: CustomerAddress[];
  /** Embedded server cart from GET /customers/:id; null if never created */
  cart: import("@/types/cart").AdminCartDetail | null;
  recentOrders: CustomerOrderSummary[];
};

export type CustomerListItem = {
  id: number;
  phone: string;
  isActive: boolean;
  lastLogin: string | null;
  orderCount: number;
  reviewCount: number;
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
