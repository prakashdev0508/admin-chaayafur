import type { CustomerAddress } from "@/types/address";
import type { Fabric } from "@/types/fabric";
import type { OrderStatus } from "@/types/order";
import type { Wood, WoodPolish } from "@/types/wood";

export type CustomizationRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED";

export type ReferenceImage = {
  url: string;
  storageKey?: string;
};

export type CustomizationRequestStaffSummary = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export type CustomizationRequestCustomerSummary = {
  id: number;
  phone: string;
};

export type CustomizationRequestProductSummary = {
  id: number;
  name: string;
  slug: string;
  price: string;
  isActive: boolean;
};

export type CustomizationRequestOrderSummary = {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: string;
  productId?: number | null;
};

export type CustomizationRequest = {
  id: number;
  status: CustomizationRequestStatus;
  productName: string;
  description: string;
  quantity: number;
  shippingAddressId: number;
  woodId?: number | null;
  polishId?: number | null;
  fabricId?: number | null;
  referenceImage?: ReferenceImage | null;
  customerId: number;
  productId?: number | null;
  orderId?: number | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  reviewedByStaffId?: number | null;
  createdAt: string;
  updatedAt: string;
  customer?: CustomizationRequestCustomerSummary;
  shippingAddress?: CustomerAddress;
  wood?: Wood | null;
  polish?: WoodPolish | null;
  fabric?: Fabric | null;
  product?: CustomizationRequestProductSummary | null;
  order?: CustomizationRequestOrderSummary | null;
  reviewedByStaff?: CustomizationRequestStaffSummary | null;
};

export const CUSTOMIZATION_FIELD_LIMITS = {
  productName: 120,
  description: 2000,
} as const;

export type CreateCustomizationRequestPayload = {
  productName: string;
  description: string;
  shippingAddressId: number;
  quantity?: number;
  woodId?: number;
  polishId?: number;
  fabricId?: number;
  referenceImage?: ReferenceImage;
};

export type UpdateCustomizationRequestPayload = {
  productName?: string;
  description?: string;
  quantity?: number;
  woodId?: number | null;
  polishId?: number | null;
  fabricId?: number | null;
  referenceImage?: ReferenceImage | null;
};

export type RejectCustomizationRequestPayload = {
  reason?: string;
};

export type ConvertCustomizationRequestPayload = {
  price: number;
  subCategoryId: number;
  productName?: string;
  quantity?: number;
  useReferenceImageAsProductImage?: boolean;
  woodId?: number;
  polishId?: number;
  fabricId?: number;
  shippingAmount?: number;
};

export type ConvertCustomizationRequestResult = {
  request: CustomizationRequest;
  order: CustomizationRequestOrderSummary & { productId?: number };
  product: CustomizationRequestProductSummary;
  paymentLinkUrl: string;
};

export type ListCustomizationRequestsParams = {
  page?: number;
  limit?: number;
  status?: CustomizationRequestStatus;
};
