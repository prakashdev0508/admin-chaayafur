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

/** City/state resolution from `GET /shipping/pincode/:pincode`. */
export type PincodeLookup = {
  pincode: string;
  city: string;
  state: string;
  offices: string[];
};
