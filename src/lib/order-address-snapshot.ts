import { gstinForCreate } from "@/lib/address-utils";
import type { OrderAddressRef } from "@/lib/order-utils";
import type { OrderAddressSnapshot } from "@/types/order";

export function buildOrderAddressSnapshot(params: {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  gstin: string;
}): OrderAddressSnapshot {
  const gstin = gstinForCreate(params.gstin);
  return {
    name: params.name.trim(),
    email: params.email.trim() || undefined,
    phone: params.phone.trim() || undefined,
    line1: params.line1.trim(),
    ...(params.line2.trim() ? { line2: params.line2.trim() } : {}),
    city: params.city.trim(),
    state: params.state.trim(),
    zipCode: params.zipCode.trim(),
    ...(params.country.trim() ? { country: params.country.trim() } : {}),
    ...(gstin ? { gstin } : {}),
  };
}

export function orderAddressRefToSnapshot(
  ref: OrderAddressRef,
): OrderAddressSnapshot {
  return {
    name: ref.name,
    email: ref.email ?? undefined,
    phone: ref.phone ?? undefined,
    line1: ref.line1,
    ...(ref.line2 ? { line2: ref.line2 } : {}),
    city: ref.city,
    state: ref.state,
    zipCode: ref.zipCode,
    country: ref.country,
    ...(ref.gstin ? { gstin: ref.gstin } : {}),
  };
}
