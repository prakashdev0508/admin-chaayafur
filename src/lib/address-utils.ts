import type { AddressType, CustomerAddress } from "@/types/address";
import { formatPhone } from "@/lib/format";

export const addressTypeLabels: Record<AddressType, string> = {
  SHIPPING: "Shipping",
  BILLING: "Billing",
};

export function formatAddressLines(address: CustomerAddress) {
  const lines = [address.line1];
  if (address.line2) lines.push(address.line2);
  lines.push(`${address.city}, ${address.state} ${address.zipCode}`);
  if (address.country && address.country !== "IN") {
    lines.push(address.country);
  }
  return lines;
}

export function formatAddressContact(address: CustomerAddress) {
  const parts: string[] = [];
  if (address.email) parts.push(address.email);
  if (address.phone) parts.push(formatPhone(address.phone));
  return parts.join(" · ");
}
