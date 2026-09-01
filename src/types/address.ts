export type AddressType = "SHIPPING" | "BILLING";

export type CustomerAddress = {
  id: number;
  customerId: number;
  type: AddressType;
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
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
  gstin?: string | null;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
  /** When true with type SHIPPING, also creates an identical BILLING address. */
  sameAsBilling?: boolean;
};

export type UpdateAddressPayload = Partial<
  Omit<CreateAddressPayload, "sameAsBilling">
>;

/** Response when `sameAsBilling: true` creates a shipping + billing twin. */
export type CreateAddressTwinResult = {
  shipping: CustomerAddress;
  billing: CustomerAddress;
};

export type CreateAddressResult = CustomerAddress | CreateAddressTwinResult;

export function isAddressTwinResult(
  result: CreateAddressResult,
): result is CreateAddressTwinResult {
  return (
    typeof result === "object" &&
    result !== null &&
    "shipping" in result &&
    "billing" in result
  );
}

export function primaryAddressFromCreate(
  result: CreateAddressResult,
  preferredType: AddressType = "SHIPPING",
): CustomerAddress {
  if (isAddressTwinResult(result)) {
    return preferredType === "BILLING" ? result.billing : result.shipping;
  }
  return result;
}
