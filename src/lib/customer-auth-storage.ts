import type { CustomerSession } from "@/types/customer-auth";

const STORAGE_KEY = "chaya_customer_session";

export function getStoredCustomerSession(): CustomerSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CustomerSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setStoredCustomerSession(session: CustomerSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredCustomerSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getCustomerAccessToken() {
  return getStoredCustomerSession()?.accessToken ?? null;
}
