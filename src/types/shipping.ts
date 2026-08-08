export type ShippingPincode = {
  pincode: string;
  isServiceable: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ListPincodesParams = {
  page?: number;
  limit?: number;
  search?: string;
  isServiceable?: boolean;
};

export type UpsertPincodesPayload = {
  pincodes: string[];
  isServiceable: boolean;
};

export type ShippingQuoteParams = {
  pincode: string;
  subtotal: number;
  deliveryFloor?: number;
  liftAccessAvailable?: boolean;
};

export type ShippingQuote = {
  pincode: string;
  serviceable: boolean;
  shippingAmount: string;
  deliveryFloor: number;
  liftAccessAvailable: boolean;
  floorDeliveryChargePerFloor: string;
  floorDeliveryAmount: string;
  message: string;
};
