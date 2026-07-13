export type AddressType = "SHIPPING" | "BILLING";

export type CustomerAddress = {
  id: number;
  customerId: number;
  type: AddressType;
  name: string;
  email: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAddressPayload = {
  type: AddressType;
  name: string;
  email?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
};

export type UpdateAddressPayload = Partial<CreateAddressPayload>;
