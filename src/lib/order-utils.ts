import type { AddressType } from "@/types/address";

export type OrderAddressRef = {
  id: number;
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
};

export function formatOrderAddressRef(address: OrderAddressRef) {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ].filter(Boolean);

  return parts.join(", ");
}
