import type { AddressType, CustomerAddress } from "@/types/address";
import { formatPhone } from "@/lib/format";

export const addressTypeLabels: Record<AddressType, string> = {
  SHIPPING: "Shipping",
  BILLING: "Billing",
};

const GSTIN_LENGTH = 15;

export function normalizeGstin(value: string) {
  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : "";
}

/** For create payloads — omit field when empty. */
export function gstinForCreate(value: string) {
  const normalized = normalizeGstin(value);
  return normalized ? normalized : undefined;
}

/** For update payloads — null clears GSTIN on the server. */
export function gstinForUpdate(value: string) {
  const normalized = normalizeGstin(value);
  return normalized ? normalized : null;
}

export function isValidGstin(value: string) {
  const normalized = normalizeGstin(value);
  if (!normalized) return true;
  return normalized.length === GSTIN_LENGTH && /^[0-9A-Z]+$/.test(normalized);
}

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
  if (address.gstin) parts.push(`GSTIN ${address.gstin}`);
  return parts.join(" · ");
}

export function formatOrderAddressRefContact(
  address: Pick<CustomerAddress, "email" | "phone" | "gstin">,
) {
  const parts: string[] = [];
  if (address.email) parts.push(address.email);
  if (address.phone) parts.push(formatPhone(address.phone));
  if (address.gstin) parts.push(`GSTIN ${address.gstin}`);
  return parts.join(" · ");
}
