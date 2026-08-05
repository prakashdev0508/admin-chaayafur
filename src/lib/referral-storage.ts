const STORAGE_KEY = "chh_referral_code";

export function getStoredReferralCode(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value?.trim() ? value.trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

export function setStoredReferralCode(code: string) {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return;
  try {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } catch {
    // ignore quota / private mode
  }
}

export function clearStoredReferralCode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Capture `?ref=` from the current URL into localStorage. */
export function captureReferralCodeFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const ref = params.get("ref");
  if (ref?.trim()) {
    setStoredReferralCode(ref);
  }
}
